/**
 * CleanCity Opaque-Box E2E Assertion Framework & Runner
 * Provides deterministic test registration, lifecycle hooks, rich assertions, and multi-tier summary reports.
 */

export interface TestCaseResult {
  title: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface TestSuiteResult {
  suiteName: string;
  tier: string;
  results: TestCaseResult[];
  passedCount: number;
  failedCount: number;
  totalDurationMs: number;
}

export type TestFn = () => Promise<void> | void;
export type HookFn = () => Promise<void> | void;

interface TestDefinition {
  title: string;
  fn: TestFn;
}

export class TestSuiteContext {
  public suiteName: string;
  public tier: string;
  public tests: TestDefinition[] = [];
  public beforeAllHooks: HookFn[] = [];
  public afterAllHooks: HookFn[] = [];
  public beforeEachHooks: HookFn[] = [];
  public afterEachHooks: HookFn[] = [];

  constructor(suiteName: string, tier: string = 'Tier 1') {
    this.suiteName = suiteName;
    this.tier = tier;
  }

  public it(title: string, fn: TestFn) {
    this.tests.push({ title, fn });
  }

  public beforeAll(fn: HookFn) {
    this.beforeAllHooks.push(fn);
  }

  public afterAll(fn: HookFn) {
    this.afterAllHooks.push(fn);
  }

  public beforeEach(fn: HookFn) {
    this.beforeEachHooks.push(fn);
  }

  public afterEach(fn: HookFn) {
    this.afterEachHooks.push(fn);
  }

  public async run(): Promise<TestSuiteResult> {
    const results: TestCaseResult[] = [];
    const startTime = Date.now();

    try {
      for (const hook of this.beforeAllHooks) {
        await hook();
      }
    } catch (err: any) {
      console.error(`[Error] beforeAll hook failed in suite "${this.suiteName}":`, err);
    }

    for (const test of this.tests) {
      const testStart = Date.now();
      try {
        for (const hook of this.beforeEachHooks) {
          await hook();
        }

        await test.fn();

        for (const hook of this.afterEachHooks) {
          await hook();
        }

        results.push({
          title: test.title,
          passed: true,
          durationMs: Date.now() - testStart,
        });
      } catch (err: any) {
        results.push({
          title: test.title,
          passed: false,
          durationMs: Date.now() - testStart,
          error: err,
        });
      }
    }

    try {
      for (const hook of this.afterAllHooks) {
        await hook();
      }
    } catch (err: any) {
      console.error(`[Error] afterAll hook failed in suite "${this.suiteName}":`, err);
    }

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;

    return {
      suiteName: this.suiteName,
      tier: this.tier,
      results,
      passedCount,
      failedCount,
      totalDurationMs: Date.now() - startTime,
    };
  }
}

// Global Runner Registry
export class E2ERunner {
  private static suites: TestSuiteContext[] = [];

  public static createSuite(suiteName: string, tier: string): TestSuiteContext {
    const suite = new TestSuiteContext(suiteName, tier);
    this.suites.push(suite);
    return suite;
  }

  public static clearSuites() {
    this.suites = [];
  }

  public static async runAll(): Promise<{
    suiteResults: TestSuiteResult[];
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDurationMs: number;
  }> {
    const suiteResults: TestSuiteResult[] = [];
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    const overallStart = Date.now();

    console.log('\n======================================================================');
    console.log('🚀 CLEAN-CITY INTELLIGENT RECYCLING PLATFORM: E2E TEST EXECUTION');
    console.log('======================================================================\n');

    for (const suite of this.suites) {
      console.log(`\n📦 [${suite.tier}] Running Suite: ${suite.suiteName}`);
      const res = await suite.run();
      suiteResults.push(res);
      totalTests += res.results.length;
      totalPassed += res.passedCount;
      totalFailed += res.failedCount;

      for (const r of res.results) {
        if (r.passed) {
          console.log(`   ✅  ${r.title} (${r.durationMs}ms)`);
        } else {
          console.log(`   ❌  ${r.title} (${r.durationMs}ms)`);
          console.log(`       Error: ${r.error?.message}`);
        }
      }
    }

    const totalDurationMs = Date.now() - overallStart;

    console.log('\n======================================================================');
    console.log('📊 E2E TEST EXECUTION SUMMARY:');
    console.log(`   Total Test Cases: ${totalTests}`);
    console.log(`   Passed:           ${totalPassed}`);
    console.log(`   Failed:           ${totalFailed}`);
    console.log(`   Pass Rate:        ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`   Duration:         ${totalDurationMs}ms`);
    console.log('======================================================================\n');

    return {
      suiteResults,
      totalTests,
      totalPassed,
      totalFailed,
      totalDurationMs,
    };
  }
}

// Expect Assertion Helper
export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, but received ${actual}`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but received ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength(expectedLen: number) {
      const len = actual?.length ?? (typeof actual === 'object' && actual !== null ? Object.keys(actual).length : undefined);
      if (len !== expectedLen) {
        throw new Error(`Expected length ${expectedLen}, but received ${len}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but received ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: any) {
      if (typeof actual === 'string') {
        if (!actual.includes(String(expected))) {
          throw new Error(`Expected string "${actual}" to contain "${expected}"`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
        }
      } else {
        throw new Error(`toContain applied to non-iterable ${typeof actual}`);
      }
    },
    toThrow(expectedMsgOrSubstring?: string) {
      if (typeof actual !== 'function') {
        throw new Error(`toThrow requires a function input`);
      }
      let threw = false;
      let errorThrown: any = null;
      try {
        actual();
      } catch (err: any) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new Error('Expected function to throw an error, but it did not throw');
      }
      if (expectedMsgOrSubstring && !errorThrown.message.includes(expectedMsgOrSubstring)) {
        throw new Error(`Expected error message "${errorThrown.message}" to include "${expectedMsgOrSubstring}"`);
      }
    },
  };
}
