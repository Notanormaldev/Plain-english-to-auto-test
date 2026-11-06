import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { TestRunResult } from '../types/index.js';

export class TestReporter {
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  printConsoleSummary(result: TestRunResult) {
    const divider = '═'.repeat(65);
    console.log('\n' + divider);
    if (result.passed) {
      console.log(chalk.bold.green('  ✅ TEST RUN STATUS: PASSED'));
    } else {
      console.log(chalk.bold.red('  ❌ TEST RUN STATUS: FAILED'));
    }
    console.log(divider);
    console.log(chalk.bold('• Test Case:      '), result.testCase);
    console.log(chalk.bold('• Target URL:     '), result.targetUrl);
    console.log(chalk.bold('• Total Duration: '), `${(result.totalDurationMs / 1000).toFixed(2)}s`);
    console.log(chalk.bold('• Steps Run:      '), result.steps.length);
    console.log(chalk.bold('• Conclusion:     '), result.passed ? chalk.green(result.reason) : chalk.red(result.reason));
    if (result.finalScreenshotPath) {
      console.log(chalk.bold('• Screenshot:     '), chalk.underline(result.finalScreenshotPath));
    }
    console.log(divider + '\n');
  }

  saveJsonReport(result: TestRunResult): string {
    const filename = `result-${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
    return filepath;
  }

  generateHtmlReport(result: TestRunResult): string {
    const timestamp = Date.now();
    const filename = `report-${timestamp}.html`;
    const filepath = path.join(this.outputDir, filename);

    const stepsHtml = result.steps.map(step => {
      let screenshotHtml = '';
      if (step.screenshotPath && fs.existsSync(step.screenshotPath)) {
        try {
          const imgBase64 = fs.readFileSync(step.screenshotPath).toString('base64');
          screenshotHtml = `
            <div class="screenshot-container">
              <a href="data:image/png;base64,${imgBase64}" target="_blank">
                <img src="data:image/png;base64,${imgBase64}" alt="Step ${step.stepNumber} screenshot" />
              </a>
            </div>
          `;
        } catch {}
      }

      const statusBadge = step.status === 'SUCCESS' 
        ? '<span class="badge success">SUCCESS</span>' 
        : '<span class="badge error">ERROR</span>';

      return `
        <div class="step-card ${step.status.toLowerCase()}">
          <div class="step-header">
            <span class="step-num">Step ${step.stepNumber}</span>
            <span class="step-action">${step.action.toUpperCase()}</span>
            ${statusBadge}
            <span class="step-time">${step.durationMs}ms</span>
          </div>
          <div class="step-thought">
            <strong>Agent Thought:</strong> <em>${escapeHtml(step.thought)}</em>
          </div>
          ${step.target ? `<div class="step-target"><strong>Target:</strong> <code>${escapeHtml(step.target)}</code></div>` : ''}
          ${step.value ? `<div class="step-value"><strong>Value:</strong> <code>${escapeHtml(step.value)}</code></div>` : ''}
          ${step.errorMessage ? `<div class="step-error"><strong>Error:</strong> ${escapeHtml(step.errorMessage)}</div>` : ''}
          ${screenshotHtml}
        </div>
      `;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auto-Test Report - ${result.passed ? 'PASSED' : 'FAILED'}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --green: #10b981;
      --red: #ef4444;
      --blue: #3b82f6;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .status-banner {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .status-banner.passed { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid var(--green); }
    .status-banner.failed { background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid var(--red); }
    h1 { margin: 0 0 12px 0; font-size: 24px; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .meta-item label { display: block; font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
    .meta-item span { font-size: 14px; font-weight: 600; }
    .step-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .step-card.error { border-color: var(--red); }
    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .step-num { font-weight: 700; color: var(--blue); }
    .step-action { font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .badge.success { background: var(--green); color: #000; }
    .badge.error { background: var(--red); color: #fff; }
    .step-time { margin-left: auto; font-size: 12px; color: var(--text-muted); }
    .step-thought { margin-bottom: 8px; font-size: 14px; color: #cbd5e1; }
    .step-target, .step-value { font-size: 13px; margin-bottom: 4px; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #38bdf8; }
    .step-error { color: var(--red); font-size: 13px; margin-top: 6px; }
    .screenshot-container { margin-top: 12px; }
    .screenshot-container img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid var(--border);
      transition: transform 0.2s;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="status-banner ${result.passed ? 'passed' : 'failed'}">
        ${result.passed ? 'TEST PASSED' : 'TEST FAILED'}
      </div>
      <h1>${escapeHtml(result.testCase)}</h1>
      <p style="color: var(--text-muted); margin: 0 0 12px 0;">Target URL: <a href="${escapeHtml(result.targetUrl)}" target="_blank" style="color: var(--blue);">${escapeHtml(result.targetUrl)}</a></p>
      <div style="font-size: 15px; margin-top: 8px;"><strong>Reason / Diagnostic:</strong> ${escapeHtml(result.reason)}</div>

      <div class="meta-grid">
        <div class="meta-item"><label>Total Duration</label><span>${(result.totalDurationMs / 1000).toFixed(2)}s</span></div>
        <div class="meta-item"><label>Steps Run</label><span>${result.steps.length}</span></div>
        <div class="meta-item"><label>Completed At</label><span>${new Date(result.endTime).toLocaleTimeString()}</span></div>
      </div>
    </div>

    <h2 style="font-size: 18px; margin-bottom: 16px;">Execution Timeline</h2>
    ${stepsHtml}
  </div>
</body>
</html>`;

    fs.writeFileSync(filepath, html, 'utf-8');
    return filepath;
  }

  generatePlaywrightSpec(result: TestRunResult): string {
    const generatedDir = path.join(this.outputDir, 'generated-specs');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const filename = `test-${Date.now()}.spec.ts`;
    const filepath = path.join(generatedDir, filename);

    const playwrightActions: string[] = [];
    playwrightActions.push(`  // 1. Initial navigation`);
    playwrightActions.push(`  await page.goto('${result.targetUrl}', { waitUntil: 'domcontentloaded' });`);

    for (const step of result.steps) {
      if (step.status === 'ERROR') continue;
      if (step.action === 'click' && step.target) {
        playwrightActions.push(`  // Step ${step.stepNumber}: Click element`);
        playwrightActions.push(`  await page.waitForSelector('${escapeForSpec(step.target)}', { state: 'visible' });`);
        playwrightActions.push(`  await page.click('${escapeForSpec(step.target)}');`);
      } else if (step.action === 'fill' && step.target) {
        playwrightActions.push(`  // Step ${step.stepNumber}: Fill input`);
        playwrightActions.push(`  await page.waitForSelector('${escapeForSpec(step.target)}', { state: 'visible' });`);
        playwrightActions.push(`  await page.fill('${escapeForSpec(step.target)}', '${escapeForSpec(step.value || '')}');`);
      } else if (step.action === 'press') {
        playwrightActions.push(`  await page.keyboard.press('${escapeForSpec(step.value || 'Enter')}');`);
      } else if (step.action === 'scroll') {
        playwrightActions.push(`  await page.evaluate(() => window.scrollBy(0, 600));`);
      } else if (step.action === 'assert' && step.value) {
        playwrightActions.push(`  // Assertion`);
        playwrightActions.push(`  await expect(page.locator('body')).toContainText('${escapeForSpec(step.value)}');`);
      }
    }

    if (result.passed && result.reason) {
      playwrightActions.push(`  // Final verification check`);
      playwrightActions.push(`  expect(page.url()).toBeDefined();`);
    }

    const specContent = `import { test, expect } from '@playwright/test';

test('${escapeForSpec(result.testCase)}', async ({ page }) => {
${playwrightActions.join('\n\n')}
});
`;

    fs.writeFileSync(filepath, specContent, 'utf-8');
    return filepath;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeForSpec(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}
