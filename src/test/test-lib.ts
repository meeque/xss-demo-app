import { ComponentFixture } from '@angular/core/testing';
import { By, WebDriver, WebElement } from 'selenium-webdriver';



// defining Jasmine's AsymmetricEqualityTester interface
// not sure where to import it from
// https://jasmine.github.io/api/edge/AsymmetricEqualityTester.html
export interface AsymmetricEqualityTester<T> {
  asymmetricMatch(actual: T, matchersUtil: MatchersUtil): boolean
  jasmineToString(pp: (value: unknown) => string): string
}

interface MatchersUtil {
  contains(haystack: unknown, needle: unknown): boolean
  equals(haystack: unknown, needle: unknown): boolean
  pp(actual: unknown): string
}

export function anyOf(expected: unknown[]): AsymmetricEqualityTester<unknown> {
  return {
    asymmetricMatch: function (actual, util: MatchersUtil) {
      return util.contains(expected, actual);
    },
    jasmineToString: function (pp) {
      return 'any of ' + pp(expected);
    },
  };
}



export function timeout<D>(millis: number, data?: D): Promise<D> {
  let resolve: (value: D) => void;
  const promise = new Promise<D>(r => resolve = r);
  setTimeout(() => resolve(data), millis);
  return promise;
}

export function domTreeAvailable<T>(context: HTMLElement, selectorOrCondition: string | (() => T)): Promise<T> {
  const preflightResult = querySelectorOrCondition(context, selectorOrCondition);
  if (preflightResult) {
    return Promise.resolve(preflightResult);
  }

  const { promise, resolve } = Promise.withResolvers<T>();
  const observer = new MutationObserver(() => {
    const result = querySelectorOrCondition(context, selectorOrCondition);
    if (result) {
      observer.disconnect();
      resolve(result);
    }
  });
  observer.observe(context, { attributes: true, childList: true, characterData: true, subtree: true });

  return promise;
}

function querySelectorOrCondition<T>(context: HTMLElement, selectorOrCondition: string | (() => T)): T {
  if (typeof selectorOrCondition === 'string') {
    return context.querySelector(selectorOrCondition) as T;
  }
  return selectorOrCondition();
}



export function queryAndExpectOptional(context: HTMLElement, selector: string): HTMLElement {
  const result = context.querySelectorAll(selector);
  expect(result.length).toBeLessThanOrEqual(1);
  if (result.length === 1) {
    return result[0] as HTMLElement;
  }
  return null;
}

export function queryAndExpectCount(context: HTMLElement, selector: string, count = 1): HTMLElement[] {
  const result = context.querySelectorAll(selector);
  expect(result.length).toBe(count);
  return Array.from(result) as HTMLElement[];
}

export function queryAndExpectOne(context: HTMLElement, selector: string): HTMLElement {
  return queryAndExpectCount(context, selector)[0];
}

export function queryAndExpectNone(context: HTMLElement, selector: string): void {
  queryAndExpectCount(context, selector, 0);
}



export async function whenStableDetectChanges(fixture: ComponentFixture<unknown>): Promise<void> {
  try {
    await fixture.whenStable();
    fixture.detectChanges();
  }
  catch (err) {
    console.error(err);
  }
}


export function queryAndExpectOptional(context: HTMLElement, selector: string): HTMLElement {
  const result = context.querySelectorAll(selector);
  expect(result.length).toBeLessThanOrEqual(1);
  if (result.length === 1) {
    return result[0] as HTMLElement;
  }
  return null;
}



export async function findAndExpectCount(context: WebElement, selector: string, count = 1): Promise<WebElement[]> {
  const elements = await context.findElements(By.css(selector));
  expect(elements.length).toBe(count);
  return elements;
}

export async function findAndExpectOne(context: WebElement, selector: string): Promise<WebElement> {
  const elements = await findAndExpectCount(context, selector, 1);
  return elements[0];
}

export async function findAndExpectNone(context: WebElement, selector: string): Promise<void> {
  findAndExpectCount(context, selector, 0);
}



export async function getClasses(element: WebElement): Promise<string[]> {
  const classAttribute = await element.getAttribute('class');
  return classAttribute.split(' ');
}



export class WindowTracker {

  private ownWindow: string;

  private priorWindows: string[];

  private constructor(private readonly driver: WebDriver) {
  }

  static async track(driver: WebDriver): Promise<WindowTracker> {
    const windowTracker = new WindowTracker(driver);
    windowTracker.ownWindow = await driver.getWindowHandle();
    windowTracker.priorWindows = await driver.getAllWindowHandles();
    return windowTracker;
  }

  public async getNewWindows(): Promise<string[]> {
    const currentWindows = await this.driver.getAllWindowHandles();
    const newWindows = [] as string[];
    for (const window of currentWindows) {
      if (!this.priorWindows.includes(window)) {
        newWindows.push(window);
      }
    }
    return newWindows;
  }

  public async switchToOwnWindow(): Promise<string> {
    await this.driver.switchTo().window(this.ownWindow);
    return this.ownWindow;
  }

  public async closeAllNewWindows(): Promise<string> {
    for (const window of await this.getNewWindows()) {
      await this.driver.switchTo().window(window);
      await this.driver.close();
    }
    return this.switchToOwnWindow();
  }
}
