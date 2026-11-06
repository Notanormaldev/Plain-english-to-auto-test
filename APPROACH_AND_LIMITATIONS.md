# Approach and Limitations

This document details the engineering decisions, architecture trade-offs, and current limitations of the **Plain-English Autonomous Browser Test Runner**.

---

## 1. Approach

### 1.1 The Problem with Naive Code Generation
Traditional AI-based test automation often attempts a single-pass translation: passing a plain-English prompt to an LLM and asking it to write a Playwright or Selenium script from scratch.

This naive approach consistently fails on real-world websites because:
- The LLM has not seen the target page's live DOM hierarchy, dynamic IDs, or shadow DOM.
- Modern SPAs (React, Vue, Angular) dynamically render elements, causing hallucinated or brittle selectors to fail with `TimeoutError` or `ElementNotInteractable`.
- Web applications change states across user interactions (e.g., modals popping up, authentication redirects, multi-step wizards).

### 1.2 Our Solution: Dynamic Autonomous Agentic Loop (Sense → Plan → Act → Assert)

Instead of guessing selectors upfront, this tool uses a live, closed-loop browser agent:

1. **Sense (State Extraction)**:
   - Playwright navigates to the target URL.
   - The DOM extractor scans visible elements and filters out hidden or zero-dimension nodes.
   - Each interactive element (`button`, `input`, `a`, `select`, `role="button"`) is tagged with an index marker `[#id]`, visible text, input attributes (`type`, `name`, `placeholder`, `aria-label`), and a robust CSS selector.
   - A contextual summary of visible headings, paragraphs, and alert banners is compiled.

2. **Plan (Grounded Reasoning)**:
   - The LLM receives:
     - The user's plain-English test objective (e.g., *"Log in as a customer and verify the dashboard is shown"*).
     - The current page URL and title.
     - The sanitized list of available interactive elements and page text.
     - The history of previous actions executed in this session.
   - The LLM outputs a strictly typed JSON action schema selecting the target element, the action (`click`, `fill`, `press`, `scroll`, `assert`, or `finish`), and the reasoning (`thought`).

3. **Act (Playwright Execution)**:
   - Playwright executes the action directly on the live browser page with built-in actionability checks (`waitForSelector`, visibility assertions).
   - A step screenshot is captured and stored with sub-millisecond timestamps.

4. **Assert & Conclude**:
   - The agent evaluates whether the test goal has been satisfied (e.g., customer dashboard is displayed) or if an explicit assertion failed.
   - On completion, the runner reports `PASSED` or `FAILED`, generates an interactive HTML report, saves a structured JSON artifact, and synthesizes an executable Playwright `.spec.ts` test script for deterministic replay.

### 1.3 Multi-Model Support with Smart Heuristic Fallback
To ensure high resilience, the runner supports:
- **Google Gemini** (`gemini-2.5-flash` / `gemini-1.5-pro`): Fast inference and low token costs.
- **OpenAI** (`gpt-4o` / `gpt-4o-mini`): Strong reasoning on complex web flows.
- **Smart Heuristic Fallback**: An offline, deterministic rule-engine that understands standard web patterns (logins, credential boxes, search inputs, assertion targets). This ensures anyone reviewing the code can execute and verify tests instantly without requiring an API key.

---

## 2. Limitations & Edge Cases

While this autonomous agent approach is significantly more robust than static script generation, real-world web environments introduce specific challenges:

1. **Anti-Bot & CAPTCHA Gates**:
   - Enterprise security systems (Cloudflare Turnstile, reCAPTCHA, Akamai Bot Manager) detect automated browser instances (even with stealth flags) and block access to protected portals.
   - *Mitigation*: Run tests in staging/preview environments where bot protections are disabled, or utilize authenticated session cookies.

2. **Canvas and WebGL Applications**:
   - Applications rendered entirely inside `<canvas>` elements (e.g., Figma, Canva, WebGL games) lack HTML DOM nodes. The agent's DOM extractor cannot inspect individual buttons inside a raster canvas without computer vision (VLM coordinate clicks).
   - *Mitigation*: Integrate vision-based coordinate clicking (e.g. Gemini 2.5 Flash Vision / GPT-4o Vision bounding box prediction).

3. **Complex Multi-Tab / OAuth Redirects**:
   - Single Sign-On (SSO) flows that redirect through external identity providers (Google OAuth, Okta, Microsoft Entra) often open pop-up tabs or enforce MFA (Multi-Factor Authentication).
   - *Mitigation*: Configure the browser context with pre-authenticated state (`storageState.json`).

4. **Latency and Token Costs**:
   - Calling an LLM on every step incurs network round-trip latency (1-3 seconds per step).
   - *Mitigation*: The generated Playwright test script (`.spec.ts`) saves the exact recorded sequence, allowing subsequent CI/CD runs to bypass the LLM entirely and run in milliseconds.

5. **Dynamic Asynchronous Animations**:
   - Elements that take several seconds to hydrate or fade in can cause race conditions if the agent acts before animation completion.
   - *Mitigation*: Configurable `slowMo` delays and Playwright auto-waiting states.

