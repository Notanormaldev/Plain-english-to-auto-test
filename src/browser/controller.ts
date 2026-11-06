import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { InteractiveElement } from '../types/index.js';

export class BrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async launch(options: { headed?: boolean; slowMo?: number } = {}) {
    this.browser = await chromium.launch({
      headless: !options.headed,
      slowMo: options.slowMo || 250,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(15000);
    this.page.setDefaultNavigationTimeout(30000);
  }

  async navigate(url: string) {
    if (!this.page) throw new Error('Browser not initialized');
    let targetUrl = url;
    if (targetUrl.startsWith('file://') || targetUrl.startsWith('localhost') || targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      // keep protocol
    } else if (fs.existsSync(targetUrl)) {
      targetUrl = `file://${path.resolve(targetUrl)}`;
    } else {
      targetUrl = 'https://' + targetUrl;
    }
    await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    // Give transient scripts a moment to settle
    await this.page.waitForTimeout(1500);
  }

  getPage(): Page {
    if (!this.page) throw new Error('Page not initialized');
    return this.page;
  }

  async getCurrentUrl(): Promise<string> {
    return this.page ? this.page.url() : '';
  }

  async getPageTitle(): Promise<string> {
    return this.page ? await this.page.title() : '';
  }

  async takeScreenshot(namePrefix: string = 'step'): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    const screenshotsDir = path.join(this.outputDir, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const filename = `${namePrefix}-${Date.now()}.png`;
    const fullPath = path.join(screenshotsDir, filename);
    await this.page.screenshot({ path: fullPath, fullPage: false });
    return fullPath;
  }

  async getVisibleText(maxLength: number = 2500): Promise<string> {
    if (!this.page) return '';
    try {
      const text = await this.page.evaluate(() => {
        // Collect text from headings, paragraphs, alerts, tables, main content
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, .alert, .notice, table, [role="alert"], [role="status"], [role="main"], main, body');
        const chunks: string[] = [];
        elements.forEach(el => {
          const content = (el as HTMLElement).innerText?.trim();
          if (content && content.length > 0 && !chunks.includes(content)) {
            chunks.push(content);
          }
        });
        return chunks.join('\n');
      });
      return text.length > maxLength ? text.substring(0, maxLength) + '... [truncated]' : text;
    } catch {
      return '';
    }
  }

  async getInteractiveElements(): Promise<InteractiveElement[]> {
    if (!this.page) return [];

    try {
      return await this.page.evaluate(() => {
        const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
        const interactiveRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'menuitem', 'tab'];
        const elements: any[] = [];
        let idCounter = 1;

        const allCandidates = document.querySelectorAll(
          'a, button, input, select, textarea, [role], [onclick], [tabindex]:not([tabindex="-1"])'
        );

        allCandidates.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const rect = htmlEl.getBoundingClientRect();
          const style = window.getComputedStyle(htmlEl);

          // Filter hidden or non-visible elements
          const isVisible =
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            style.opacity !== '0';

          if (!isVisible) return;

          const tagName = htmlEl.tagName.toLowerCase();
          const role = htmlEl.getAttribute('role') || undefined;
          const type = htmlEl.getAttribute('type') || undefined;
          const name = htmlEl.getAttribute('name') || undefined;
          const placeholder = htmlEl.getAttribute('placeholder') || undefined;
          const ariaLabel = htmlEl.getAttribute('aria-label') || undefined;
          let text = (htmlEl.innerText || htmlEl.textContent || '').trim().replace(/\s+/g, ' ');

          // If input with button/submit type, use value as text
          if (tagName === 'input' && (type === 'button' || type === 'submit') && (htmlEl as HTMLInputElement).value) {
            text = (htmlEl as HTMLInputElement).value;
          }

          // Generate an unambiguous CSS selector
          let selector = '';
          if (htmlEl.id) {
            selector = `#${CSS.escape(htmlEl.id)}`;
          } else if (name) {
            selector = `${tagName}[name="${name}"]`;
          } else if (placeholder) {
            selector = `${tagName}[placeholder="${placeholder}"]`;
          } else if (ariaLabel) {
            selector = `[aria-label="${ariaLabel}"]`;
          } else if (htmlEl.className && typeof htmlEl.className === 'string') {
            const classParts = htmlEl.className.trim().split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('/'));
            if (classParts.length > 0) {
              selector = `${tagName}.${classParts.slice(0, 2).join('.')}`;
            }
          }
          if (!selector) {
            selector = tagName;
          }

          const isInteractive =
            interactiveTags.includes(tagName) ||
            (role && interactiveRoles.includes(role)) ||
            htmlEl.hasAttribute('onclick') ||
            htmlEl.getAttribute('tabindex') === '0';

          if (isInteractive && idCounter <= 60) {
            elements.push({
              id: idCounter++,
              tagName,
              role,
              type,
              text: text.substring(0, 80),
              placeholder,
              name,
              value: (htmlEl as HTMLInputElement).value ? String((htmlEl as HTMLInputElement).value).substring(0, 50) : undefined,
              ariaLabel,
              selector,
              isVisible: true,
              isEnabled: !(htmlEl as any).disabled
            });
          }
        });

        return elements;
      });
    } catch {
      return [];
    }
  }

  async click(selector: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 8000 });
    await this.page.click(selector);
    await this.page.waitForTimeout(1000);
  }

  async fill(selector: string, value: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 8000 });
    await this.page.fill(selector, '');
    await this.page.fill(selector, value);
    await this.page.waitForTimeout(500);
  }

  async press(key: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(1000);
  }

  async scroll(direction: 'down' | 'up' = 'down') {
    if (!this.page) throw new Error('Page not initialized');
    const distance = direction === 'down' ? 600 : -600;
    await this.page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance);
    await this.page.waitForTimeout(800);
  }

  async waitForText(text: string, timeoutMs: number = 5000): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.waitForFunction(
        (target) => document.body && document.body.innerText.toLowerCase().includes(target.toLowerCase()),
        text,
        { timeout: timeoutMs }
      );
      return true;
    } catch {
      return false;
    }
  }

  async assertTextVisible(text: string): Promise<{ visible: boolean; foundText?: string }> {
    if (!this.page) return { visible: false };
    const content = await this.page.evaluate(() => document.body ? document.body.innerText : '');
    const cleanContent = content.toLowerCase();
    const cleanTarget = text.toLowerCase();
    const found = cleanContent.includes(cleanTarget);
    return { visible: found, foundText: found ? text : undefined };
  }

  async close() {
    try {
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch {
      // Ignored during shutdown
    }
  }
}
