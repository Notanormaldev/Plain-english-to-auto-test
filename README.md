# 🤖 Plain-English to Automated Tests Runner

> **Autonomous AI-Powered Browser Test Automation Engine**  
> Translates plain-English test specifications (e.g. *"Log in as a customer and verify the dashboard is shown"*) into live automated browser actions using Playwright, dynamically evaluates assertions, and generates visual HTML reports and reusable Playwright test scripts (`.spec.ts`).

---

## 💻 Technology Stack

| Layer | Technologies & Libraries | Purpose |
|---|---|---|
| **Runtime & Language** | **Node.js (v18+)**, **TypeScript (v5.7+)**, **TSX** | Type-safe execution with modern ES modules and zero-compile overhead |
| **Browser Automation** | **Playwright (v1.49+)** (Chromium) | Multi-page browser control, dynamic DOM queries, automated waiting, screenshot capture |
| **AI & LLM Providers** | **Google Gemini** (`@google/genai`)<br>**OpenAI** (`openai` SDK)<br>**Smart Heuristic Engine** | Sense-Plan-Act decision loop (supports `gemini-2.5-flash`, `gemini-1.5-pro`, `gpt-4o`, `gpt-4o-mini`, and offline fallback) |
| **CLI & Terminal UX** | **Commander.js (v12)**, **Chalk (v5)**, **Dotenv (v16)** | Robust command-line parsing, colored terminal banners, environment configuration |
| **Test Reporting** | **HTML5 / CSS3 / Base64**, **JSON** | Standalone interactive HTML report with embedded screenshots, status badges, and execution metrics |
| **Code Generation** | **Playwright Test Runner (`@playwright/test`)** | Synthesizes reproducible `.spec.ts` test scripts from successful agent executions |

---

## 🌟 Key Capabilities

- **Zero Hardcoding**: Dynamically inspects the live DOM, accessibility hierarchy, buttons, inputs, links, and forms on any web application.
- **Autonomous Sense-Plan-Act Loop**: Reads the current page state, formulates the next rational interaction, executes the action in Playwright, and validates results.
- **Multi-Model / Multi-Provider AI**:
  - **Google Gemini** (`gemini-2.5-flash`, `gemini-1.5-pro` via `@google/genai`)
  - **OpenAI** (`gpt-4o`, `gpt-4o-mini`)
  - **Smart Heuristic Fallback Engine**: Works out-of-the-box even without an API key or offline!
- **Rich Visual Reporting**:
  - Generates standalone interactive HTML test reports (`reports/report-<id>.html`) with embedded base64 screenshots for every step.
  - Generates structured JSON reports (`reports/result-<id>.json`) for CI/CD integration.
- **Exportable Playwright Specs**: Automatically generates clean, executable Playwright test scripts (`reports/generated-specs/test-<id>.spec.ts`) from the agent's run so test cases can be committed to standard test suites.
- **Headed & Slow-Motion Mode**: Enables step-by-step visual debugging and interactive inspections.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│             Plain-English Test Prompt                  │
│  "Log in as a customer and verify dashboard is shown"  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
           ┌─────────────────────────────────┐
           │     Autonomous Test Runner      │
           └────────────────┬────────────────┘
                            │
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
┌──────────────┐                         ┌──────────────┐
│  Playwright  │ ── Page DOM & State ──> │   AI Model   │
│  Browser     │ <── Browser Actions ─── │ (Gemini/GPT) │
└──────────────┘                         └──────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│                     Test Outputs                       │
│  • Terminal Pass/Fail Verdict & Step Timings           │
│  • Visual HTML Report with Step Screenshots            │
│  • Exported Playwright `.spec.ts` Test Script          │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start: Clone, Setup & Run

Follow these step-by-step instructions to clone the repository, install dependencies, and run the tests.

---

### Step 1: Clone the Repository
Clone the repository using Git and navigate into the project directory:

```bash
git clone https://github.com/Notanormaldev/Plain-english-to-auto-test.git
cd Plain-english-to-auto-test
```

---

### Step 2: Prerequisites
Ensure you have the following installed on your system:
- **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org/)
- **pnpm** (recommended) or **npm** (comes bundled with Node.js)

Verify installations in your terminal:
```bash
node --version
npm --version
```

---

### Step 3: Install Dependencies
Install all project dependencies:

**Using pnpm (recommended):**
```bash
pnpm install
```

**Using npm:**
```bash
npm install
```

---

### Step 4: Install Playwright Chromium Browser
Download the required Playwright Chromium browser binaries:

**Using pnpm:**
```bash
pnpm exec playwright install chromium
```

**Using npx:**
```bash
npx playwright install chromium
```

---

### Step 5: Configure AI API Key (Optional)
The runner includes an offline **Smart Heuristic Fallback Engine** that executes out-of-the-box with **zero API keys required**. 

To enable cutting-edge LLMs (Google Gemini or OpenAI):
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your API key:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Or set `OPENAI_API_KEY=your_key_here` to use OpenAI).*

---

### Step 6: Run the Automated Tests

#### Option A: Visible Interactive Headed Mode (Watch the Browser Live)
Opens a visible browser with slow-motion execution so you can observe the AI interacting with the page:
```bash
pnpm run test:headed
```
*(or with npm: `npm run test:headed`)*

#### Option B: Default PHPTravels Customer Login Test
```bash
pnpm run test:demo
```
*(or with npm: `npm run test:demo`)*

#### Option C: Offline Local Demo Test (Instant Execution)
```bash
pnpm run test:local
```
*(or with npm: `npm run test:local`)*

#### Option D: Multi-Test Batch Suite
Executes a batch suite containing positive login tests, credential checks, and negative failure verification:
```bash
pnpm run test:suite
```
*(or with npm: `npm run test:suite`)*

#### Option E: Run Any Custom Test on Any Custom Website
```bash
pnpm start --url "<any-website-url>" --test "<any-plain-english-test-instruction>"
```
*(or with npm: `npm start -- --url "<any-website-url>" --test "<any-plain-english-test-instruction>"`)*

---

## 💻 Usage & Multi-Website Examples

You can pass **any URL** and **any plain-English instruction** via CLI arguments. The tool dynamically discovers elements and evaluates assertions on any website:

```bash
pnpm start --url "<any-website-url>" --test "<any-plain-english-instruction>"
```

---

### 🌐 Ready-to-Run Test Commands Across Different Websites

Here are verified copy-paste commands to test across multiple different domains:

#### 1. PHPTravels Demo Portal ([phptravels.com/demo](https://phptravels.com/demo))
```bash
pnpm start --url "https://phptravels.com/demo" --test "Log in as a customer and verify the dashboard is shown"
```

#### 2. The Internet Herokuapp Login ([the-internet.herokuapp.com/login](https://the-internet.herokuapp.com/login))
```bash
pnpm start --url "https://the-internet.herokuapp.com/login" --test "Log in with username tomsmith and password SuperSecretPassword! and verify you logged into a secure area"
```

#### 3. SauceDemo E-Commerce Store ([saucedemo.com](https://www.saucedemo.com))
```bash
pnpm start --url "https://www.saucedemo.com" --test "Log in with username standard_user and password secret_sauce and verify the product inventory is shown"
```

#### 4. Quotes to Scrape ([quotes.toscrape.com](https://quotes.toscrape.com))
```bash
pnpm start --url "https://quotes.toscrape.com" --test "Verify quotes and tag navigation links are visible on the homepage"
```

#### 5. Local Offline Demo Portal (`./demo/local-demo.html`)
*(Works 100% offline with zero internet or API keys required)*
```bash
pnpm start --url "./demo/local-demo.html" --test "Log in as a customer and verify the dashboard is shown" --headed --slowmo 500
```

#### 6. Local E-Commerce Store (`./demo/ecommerce-store.html`)
```bash
pnpm start --url "./demo/ecommerce-store.html" --test "Verify that Wireless Noise-Cancelling Headphones is listed"
```

#### 7. Negative Test (Proving Failure Reporting)
```bash
pnpm start --url "./demo/ecommerce-store.html" --test "Verify that 'Quantum Supercomputer RTX 9090' is available"
```
*(Demonstrates automatic detection of missing elements, reporting `❌ TEST RUN STATUS: FAILED` with exit code 1).*

---

### 🖥️ Visual Headed Mode (for Local Debugging & Demos)

Watch the browser open, type credentials, and click buttons in slow-motion:

```bash
pnpm run test:headed
```
*(or specify custom parameters:)*
```bash
pnpm start --url "./demo/local-demo.html" --test "Log in as a customer and verify the dashboard is shown" --headed --slowmo 600
```

### 3. Run a Multi-Test Batch Suite

Execute multiple test cases sequentially across different sites:

```bash
pnpm run test:suite
```

Or test multiple external websites:
```bash
pnpm run test:multisite
```

---

## 🛠️ CLI Options

| Flag | Description | Default |
|---|---|---|
| `-u, --url <url>` | Target website URL | `https://phptravels.com/demo` |
| `-t, --test <str>` | Plain-English test description | Customer login & dashboard test |
| `-f, --file <path>` | Batch test suite JSON file | — |
| `--headed` | Run visible browser window | `false` (headless) |
| `--slowmo <ms>` | Delay between actions in milliseconds | `400` |
| `-p, --provider` | `gemini` \| `openai` \| `mock` | Autodetected |
| `-m, --model` | Specific model name | `gemini-2.5-flash` / `gpt-4o-mini` |
| `-k, --api-key` | API key override | Reads from `.env` |
| `--max-steps <n>` | Max agentic steps before timeout | `12` |
| `-o, --output` | Output directory for reports | `./reports` |
| `--no-spec` | Skip exporting `.spec.ts` files | `false` |

---

## 📊 Reports & Artifacts

After every test run, the tool generates:
1. **Interactive HTML Report**: `reports/report-<timestamp>.html`
   - Overall Pass/Fail badge, execution duration, and diagnostic reason
   - Interactive timeline of every step taken
   - Base64 embedded screenshots of each page state
2. **Replay Playwright Spec**: `reports/generated-specs/test-<timestamp>.spec.ts`
   - Complete, standalone TypeScript Playwright test code
   - Ready to run directly with `npx playwright test`
3. **Structured JSON**: `reports/result-<timestamp>.json`

---

## 🧠 Approach & Engineering Decisions

### 1. The Problem with Naive Code Generation
Traditional AI testing tools attempt a single-pass translation: passing a plain-English prompt to an LLM and asking it to write a Playwright or Selenium script from scratch without opening a browser.

This approach consistently fails on real-world applications because:
- The LLM cannot predict the page's actual live DOM hierarchy, dynamic IDs, or shadow DOM.
- Modern SPAs (React, Vue, Angular) dynamically render elements, causing hallucinated or brittle selectors to fail with `TimeoutError` or `ElementNotInteractable`.
- Web applications change states across user interactions (e.g., modals popping up, authentication redirects, multi-step wizards).

### 2. Our Solution: Dynamic Autonomous Agentic Loop (Sense → Plan → Act → Assert)
Instead of guessing selectors upfront, this tool uses a live, closed-loop browser agent:
- **Sense (State Extraction)**: Playwright navigates to the target URL. The DOM extractor scans visible elements and filters out hidden or zero-dimension nodes. Each interactive element (`button`, `input`, `a`, `select`, `role="button"`) is tagged with an index marker `[#id]`, visible text, input attributes (`type`, `name`, `placeholder`, `aria-label`), and an unambiguous CSS selector.
- **Plan (Grounded Reasoning)**: The AI model receives the plain-English goal, the current URL, page title, sanitized list of interactive elements, and previous action history. It outputs a strictly typed JSON action schema selecting the target element, action, and reasoning.
- **Act (Playwright Execution)**: Playwright executes the action directly on the live page with built-in actionability checks (`waitForSelector`, visibility assertions) and captures step-by-step screenshots.
- **Assert & Conclude**: The agent evaluates whether the test goal has been satisfied or if an explicit assertion failed. On completion, it reports `PASSED` or `FAILED`, generates an interactive HTML report, saves a structured JSON artifact, and synthesizes an executable Playwright `.spec.ts` test script for deterministic replay.

### 3. Multi-Model Support with Smart Heuristic Fallback
To ensure high resilience, the runner supports:
- **Google Gemini** (`gemini-2.5-flash` / `gemini-1.5-pro`): Fast inference and low token costs.
- **OpenAI** (`gpt-4o` / `gpt-4o-mini`): Strong reasoning on complex web flows.
- **Smart Heuristic Fallback**: An offline, deterministic rule-engine that understands standard web patterns (logins, credential boxes, search inputs, assertion targets). This ensures anyone reviewing the code can execute and verify tests instantly without requiring an API key.

---

## ⚠️ Limitations & Edge Cases

While this autonomous agent approach is significantly more robust than static script generation, real-world web environments introduce specific challenges:

1. **Anti-Bot & CAPTCHA Gates**:
   - Enterprise security systems (Cloudflare Turnstile, reCAPTCHA, Akamai Bot Manager) detect automated browser instances and block access to protected portals.
   - *Mitigation*: Run tests in staging/preview environments where bot protections are disabled, or utilize pre-authenticated session cookies.

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

---

---

## 📂 Project Structure

```
├── src/
│   ├── browser/
│   │   └── controller.ts     # Playwright lifecycle, DOM extractor, actions & screenshots
│   ├── llm/
│   │   └── client.ts         # Multi-provider client (Gemini, OpenAI, Smart Heuristic)
│   ├── runner/
│   │   └── agent.ts          # Core agentic Sense-Plan-Act execution loop
│   ├── reporter/
│   │   └── reporter.ts       # HTML reports, console badges & Playwright spec generator
│   ├── types/
│   │   └── index.ts          # Data types and interfaces
│   └── cli.ts                # Command-line interface
├── demo/
│   ├── local-demo.html       # Offline-capable PHPTravels replica demo portal
│   ├── ecommerce-store.html  # Additional e-commerce demo site for multi-domain testing
│   ├── local-suite.json      # Sample test suite (positive & negative tests)
│   └── testcases.json        # Multi-website test cases
├── reports/                  # Generated HTML reports, specs, and screenshots
├── APPROACH_AND_LIMITATIONS.md # Detailed technical approach and engineering limitations
├── package.json
└── tsconfig.json
```
