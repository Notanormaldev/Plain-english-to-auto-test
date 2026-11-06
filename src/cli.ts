#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { AutonomousTestRunner } from './runner/agent.js';
import { TestReporter } from './reporter/reporter.js';
import { RunnerOptions } from './types/index.js';

dotenv.config();

const program = new Command();

program
  .name('auto-test')
  .description('Autonomous AI browser test runner: converts plain-English test cases into automated Playwright tests')
  .version('1.0.0')
  .option('-u, --url <url>', 'Target website URL', 'https://phptravels.com/demo')
  .option('-t, --test <instruction>', 'Plain-English test case', 'Log in as a customer and verify the dashboard is shown')
  .option('-f, --file <path>', 'Path to JSON file containing array of test cases to run in batch')
  .option('--headed', 'Run browser in visible (headed) mode for visual demos', false)
  .option('--slowmo <ms>', 'Milliseconds to pause between browser interactions', '400')
  .option('-p, --provider <provider>', 'LLM provider: gemini | openai | mock', process.env.LLM_PROVIDER || '')
  .option('-m, --model <model>', 'LLM model name')
  .option('-k, --api-key <key>', 'API key for LLM provider (or set GEMINI_API_KEY / OPENAI_API_KEY in .env)')
  .option('--max-steps <num>', 'Maximum agentic steps per test run', '12')
  .option('-o, --output <dir>', 'Output directory for reports & screenshots', './reports')
  .option('--no-spec', 'Skip exporting generated Playwright spec file');

program.parse(process.argv);
const options = program.opts();

async function main() {
  const reporter = new TestReporter(options.output);

  interface TestCaseItem {
    url?: string;
    test: string;
  }

  const testList: TestCaseItem[] = [];

  if (options.file) {
    const filePath = path.resolve(process.cwd(), options.file);
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      parsed.forEach(item => {
        if (typeof item === 'string') {
          testList.push({ url: options.url, test: item });
        } else if (item && item.test) {
          testList.push({ url: item.url || options.url, test: item.test });
        }
      });
    }
  } else {
    testList.push({ url: options.url, test: options.test });
  }

  console.log(chalk.bold.green(`\n============================================================`));
  console.log(chalk.bold.white(`  PLAIN-ENGLISH AUTONOMOUS TEST RUNNER`));
  console.log(chalk.bold.green(`============================================================`));
  console.log(chalk.gray(`Loaded ${testList.length} test case(s) to execute.\n`));

  let totalPassed = 0;
  let totalFailed = 0;

  for (let i = 0; i < testList.length; i++) {
    const item = testList[i];
    console.log(chalk.cyan(`\n[Running Test ${i + 1}/${testList.length}]: `) + chalk.bold(`"${item.test}"`));

    const runnerOptions: RunnerOptions = {
      url: item.url || options.url,
      testCase: item.test,
      headed: Boolean(options.headed),
      slowMo: parseInt(options.slowmo, 10) || 400,
      maxSteps: parseInt(options.maxSteps, 10) || 12,
      provider: options.provider || undefined,
      model: options.model || undefined,
      apiKey: options.apiKey || undefined,
      outputDir: options.output,
      exportSpec: !options.noSpec
    };

    const runner = new AutonomousTestRunner(runnerOptions);
    const result = await runner.run();

    reporter.printConsoleSummary(result);
    const jsonPath = reporter.saveJsonReport(result);
    const htmlPath = reporter.generateHtmlReport(result);
    console.log(chalk.green(`📄 HTML Report generated:`), chalk.underline(htmlPath));
    console.log(chalk.gray(`📊 JSON Data saved:      `), chalk.underline(jsonPath));

    if (!options.noSpec) {
      const specPath = reporter.generatePlaywrightSpec(result);
      console.log(chalk.blue(`🧪 Playwright Spec saved:`), chalk.underline(specPath));
    }

    if (result.passed) {
      totalPassed++;
    } else {
      totalFailed++;
    }
  }

  console.log(chalk.bold(`\n------------------------------------------------------------`));
  console.log(chalk.bold(`Suite Summary: Total: ${testList.length} | `) + chalk.green(`Passed: ${totalPassed}`) + ` | ` + (totalFailed > 0 ? chalk.red(`Failed: ${totalFailed}`) : chalk.gray(`Failed: 0`)));
  console.log(chalk.bold(`------------------------------------------------------------\n`));

  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(chalk.bold.red('\nFatal Uncaught Error:'), err);
  process.exit(1);
});

