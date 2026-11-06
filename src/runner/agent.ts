import chalk from 'chalk';
import path from 'path';
import { BrowserController } from '../browser/controller.js';
import { LLMClient } from '../llm/client.js';
import { RunnerOptions, StepRecord, TestRunResult, AgentAction } from '../types/index.js';

export class AutonomousTestRunner {
  private options: RunnerOptions;
  private browser: BrowserController;
  private llm: LLMClient;

  constructor(options: RunnerOptions) {
    this.options = {
      maxSteps: 12,
      outputDir: './reports',
      headed: false,
      slowMo: 250,
      exportSpec: true,
      ...options
    };

    this.browser = new BrowserController(this.options.outputDir);
    this.llm = new LLMClient({
      provider: this.options.provider,
      model: this.options.model,
      apiKey: this.options.apiKey
    });
  }

  async run(): Promise<TestRunResult> {
    const startTime = new Date();
    const steps: StepRecord[] = [];
    const history: { step: number; action: string; result: string }[] = [];

    console.log(chalk.bold.cyan('\n🚀 [Auto-Test Runner Initializing]'));
    console.log(chalk.gray(`• URL:         ${this.options.url}`));
    console.log(chalk.gray(`• Test Case:   "${this.options.testCase}"`));
    console.log(chalk.gray(`• Engine:      ${this.llm.getProviderName()}`));
    console.log(chalk.gray(`• Mode:        ${this.options.headed ? 'Headed (visible browser)' : 'Headless'}\n`));

    let passed = false;
    let finalReason = '';
    let finalScreenshot: string | undefined;

    try {
      await this.browser.launch({
        headed: this.options.headed,
        slowMo: this.options.slowMo
      });

      console.log(chalk.blue(`🌐 Navigating to ${this.options.url}...`));
      await this.browser.navigate(this.options.url);

      // Main Agentic Execution Loop
      for (let stepIndex = 1; stepIndex <= (this.options.maxSteps || 12); stepIndex++) {
        const stepStartTime = Date.now();
        const currentUrl = await this.browser.getCurrentUrl();
        const pageTitle = await this.browser.getPageTitle();
        const visibleText = await this.browser.getVisibleText();
        const elements = await this.browser.getInteractiveElements();

        console.log(chalk.yellow(`\n--- Step ${stepIndex} / ${this.options.maxSteps} ---`));
        console.log(chalk.gray(`URL: ${currentUrl} | Elements detected: ${elements.length}`));

        // Ask LLM (or Heuristic Engine) for next action
        const action: AgentAction = await this.llm.decideNextAction({
          testCase: this.options.testCase,
          targetUrl: this.options.url,
          currentUrl,
          pageTitle,
          visibleText,
          elements,
          history,
          stepIndex,
          maxSteps: this.options.maxSteps || 12
        });

        console.log(chalk.magenta(`🧠 Agent Thought:`), chalk.italic(action.thought));
        console.log(chalk.cyan(`🎯 Action:       `), `${action.action.toUpperCase()} ${action.selector || action.elementId ? `(target: ${action.selector || `#${action.elementId}`})` : ''} ${action.value ? `value="${action.value}"` : ''}`);

        let stepStatus: 'SUCCESS' | 'ERROR' = 'SUCCESS';
        let stepError: string | undefined;
        let actionSummary = `${action.action}`;

        // Execute action in browser
        try {
          if (action.action === 'click') {
            const selector = action.selector || (action.elementId ? elements.find(e => e.id === action.elementId)?.selector : null);
            if (!selector) throw new Error(`Could not resolve selector for elementId ${action.elementId}`);
            actionSummary = `click ${selector}`;
            await this.browser.click(selector);
          } else if (action.action === 'fill') {
            const selector = action.selector || (action.elementId ? elements.find(e => e.id === action.elementId)?.selector : null);
            if (!selector) throw new Error(`Could not resolve selector for elementId ${action.elementId}`);
            actionSummary = `fill ${selector} with "${action.value || ''}"`;
            await this.browser.fill(selector, action.value || '');
          } else if (action.action === 'press') {
            actionSummary = `press key "${action.key || 'Enter'}"`;
            await this.browser.press(action.key || 'Enter');
          } else if (action.action === 'scroll') {
            actionSummary = `scroll ${action.value || 'down'}`;
            await this.browser.scroll((action.value as any) || 'down');
          } else if (action.action === 'navigate') {
            actionSummary = `navigate to ${action.value}`;
            await this.browser.navigate(action.value || this.options.url);
          } else if (action.action === 'assert') {
            const assertionText = action.expected || action.value || '';
            actionSummary = `assert visible "${assertionText}"`;
            const check = await this.browser.assertTextVisible(assertionText);
            if (!check.visible) {
              throw new Error(`Assertion failed: text "${assertionText}" was not visible on the page.`);
            }
          } else if (action.action === 'finish') {
            passed = action.testPassed ?? true;
            finalReason = action.reason || (passed ? 'Test requirements satisfied.' : 'Test stopped with failure.');
          }
        } catch (err: any) {
          stepStatus = 'ERROR';
          stepError = err.message;
          console.error(chalk.red(`❌ Action failed:`), err.message);
        }

        // Take step screenshot
        let screenshotPath: string | undefined;
        try {
          screenshotPath = await this.browser.takeScreenshot(`step-${stepIndex}`);
        } catch {}

        const stepRecord: StepRecord = {
          stepNumber: stepIndex,
          thought: action.thought,
          action: action.action,
          target: action.selector || (action.elementId ? `#${action.elementId}` : undefined),
          value: action.value || action.expected,
          screenshotPath,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - stepStartTime,
          status: stepStatus,
          errorMessage: stepError
        };

        steps.push(stepRecord);
        history.push({
          step: stepIndex,
          action: actionSummary,
          result: stepStatus === 'SUCCESS' ? 'OK' : `Failed: ${stepError}`
        });

        // Check completion condition
        if (action.isFinal || action.action === 'finish') {
          passed = action.testPassed ?? true;
          finalReason = action.reason || (passed ? 'Test case completed successfully.' : 'Test failed.');
          break;
        }

        if (stepIndex === (this.options.maxSteps || 12)) {
          passed = false;
          finalReason = `Reached maximum allowed steps (${this.options.maxSteps}) without reaching a decisive conclusion.`;
        }
      }

      // Take final screenshot
      try {
        finalScreenshot = await this.browser.takeScreenshot('final-result');
      } catch {}

    } catch (fatalErr: any) {
      passed = false;
      finalReason = `Fatal execution error: ${fatalErr.message}`;
      console.error(chalk.bold.red('\n💥 Fatal Error:'), fatalErr);
    } finally {
      await this.browser.close();
    }

    const endTime = new Date();
    const result: TestRunResult = {
      testCase: this.options.testCase,
      targetUrl: this.options.url,
      passed,
      reason: finalReason,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDurationMs: endTime.getTime() - startTime.getTime(),
      steps,
      finalScreenshotPath: finalScreenshot
    };

    return result;
  }
}

