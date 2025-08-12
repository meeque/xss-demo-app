import { expect } from '@jest/globals';
import type { ExpectationResult } from 'expect';
import { Builder, Browser } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';



expect.extend({
  anyOf: function (actual: unknown, expectedOptions: unknown[]): ExpectationResult {
    for (const expectedOption of expectedOptions) {
      if (this.equals(actual, expectedOption)) {
        return {
          message: () => {
            return 'expected ' + this.utils.printReceived(actual) + ' to equal any of ' + this.utils.printExpected(expectedOptions);
          },
          pass: true,
        };
      }
    }

    return {
      message: () => {
        return 'expected ' + this.utils.printReceived(actual) + ' not to equal any of ' + this.utils.printExpected(expectedOptions);
      },
      pass: false,
    };
  },
});

declare module 'expect' {
  interface AsymmetricMatchers {
    anyOf(options: unknown[]): void
  }
}



beforeAll(
  async () => {
    const chromeOptions = new ChromeOptions();

    chromeOptions.setChromeBinaryPath('/usr/bin/chromium');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--ignore-certificate-errors');

    if (process.env.XSS_DEMO_APP_TEST_HEADLESS) {
      chromeOptions.addArguments('--headless');
    }

    const driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(chromeOptions).build();
    await driver.manage().setTimeouts({ implicit: 1000 });
    globalThis.driver = driver;
  },
  10000,
);

afterAll(
  async () => {
    const driver = globalThis.driver;
    if (driver) {
      await driver.quit();
    }
  },
  5000,
);



globalThis.xssDemoAppUrl = process.env.XSS_DEMO_APP_URL ?? 'https://localhost:4200/';
globalThis.xssDemoAppHostname = new URL(globalThis.xssDemoAppUrl).hostname;
globalThis.xssDemoAppOrigin = new URL(globalThis.xssDemoAppUrl).origin;
