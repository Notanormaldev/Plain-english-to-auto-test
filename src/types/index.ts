export interface InteractiveElement {
  id: number;
  tagName: string;
  role?: string;
  type?: string;
  text: string;
  placeholder?: string;
  name?: string;
  value?: string;
  ariaLabel?: string;
  selector: string;
  isVisible: boolean;
  isEnabled: boolean;
}

export type ActionType =
  | 'click'
  | 'fill'
  | 'press'
  | 'navigate'
  | 'scroll'
  | 'wait'
  | 'assert'
  | 'finish';

export interface AgentAction {
  thought: string;
  action: ActionType;
  elementId?: number;
  selector?: string;
  value?: string;
  key?: string;
  expected?: string;
  isFinal: boolean;
  testPassed?: boolean;
  reason?: string;
}

export interface StepRecord {
  stepNumber: number;
  thought: string;
  action: ActionType;
  target?: string;
  value?: string;
  screenshotPath?: string;
  timestamp: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}

export interface TestRunResult {
  testCase: string;
  targetUrl: string;
  passed: boolean;
  reason: string;
  startTime: string;
  endTime: string;
  totalDurationMs: number;
  steps: StepRecord[];
  finalScreenshotPath?: string;
  exportedSpecPath?: string;
}

export interface RunnerOptions {
  url: string;
  testCase: string;
  headed?: boolean;
  slowMo?: number;
  maxSteps?: number;
  provider?: 'gemini' | 'openai' | 'mock' | 'anthropic';
  model?: string;
  apiKey?: string;
  outputDir?: string;
  exportSpec?: boolean;
}

