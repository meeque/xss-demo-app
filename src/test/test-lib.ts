import { ComponentFixture } from '@angular/core/testing';
import { By, WebDriver, WebElement } from 'selenium-webdriver';



// general utils

export function timeout<D>(millis: number, data?: D): Promise<D> {
  let resolve: (value: D) => void;
  const promise = new Promise<D>(r => resolve = r);
  setTimeout(() => resolve(data), millis);
  return promise;
}



// DOM query utils

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



// Angular utils

export async function whenStableDetectChanges(fixture: ComponentFixture<unknown>): Promise<void> {
  try {
    await fixture.whenStable();
    fixture.detectChanges();
  }
  catch (err) {
    console.error(err);
  }
}



// Selenium Webdriver finder utils

type FlexibleLocator = string | By | (() => (WebElement[] | Promise<WebElement[]>));

export function findAndExpectCount(context: WebElement, locator: FlexibleLocator, count = 1): Promise<WebElement[]> {
  const processedLocator =
    typeof locator === 'string'
    ? By.css(locator)
    : locator;
  return context.getDriver().wait<WebElement[]>(
    async () => {
      const elements = await context.findElements(processedLocator);
      return (elements.length === count) ? elements : null;
    },
    2500,
  );
}

export async function findAndExpectOne(context: WebElement, locator: FlexibleLocator): Promise<WebElement> {
  const elements = await findAndExpectCount(context, locator, 1);
  return elements[0];
}

export async function findAndExpectNone(context: WebElement, locator: FlexibleLocator): Promise<void> {
  findAndExpectCount(context, locator, 0);
}



// Selenium Webdriver element utils

export async function getClasses(element: WebElement): Promise<string[]> {
  const classAttribute = await element.getAttribute('class');
  return classAttribute.split(' ');
}

export function getValue(formElement: WebElement): Promise<string> {
  return formElement.getAttribute('value');
}

export async function setValue(formElement: WebElement, value: string): Promise<void> {
  await formElement.clear();
  await formElement.sendKeys(value);
}

export async function isChecked(formElement: WebElement): Promise<boolean> {
  return null !== await formElement.getAttribute('checked');
}

export async function selectOption(selectElement: WebElement, selectValue: string): Promise<void> {
  const optionElements = await selectElement.findElements(By.css('option'));
  for (const optionElement of optionElements) {
    const optionValue = await getValue(optionElement);
    if (optionValue === selectValue) {
      await optionElement.click();
      return;
    }
  }
}



// Selenium Webdriver window tracker

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
