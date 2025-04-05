import { ComponentFixture } from "@angular/core/testing";



// defining Jasmine's AsymmetricEqualityTester interface
// not sure where to import it from
// https://jasmine.github.io/api/edge/AsymmetricEqualityTester.html
export interface AsymmetricEqualityTester<T> {
  asymmetricMatch(actual: T, matchersUtil: MatchersUtil): boolean;
  jasmineToString(pp: (value: any) => string): string;
}

interface MatchersUtil {
  contains(haystack: any, needle: any): boolean;
  equals(haystack: any, needle: any): boolean;
  pp(actual: any): string
}

export function anyOf(expected: any[]): AsymmetricEqualityTester<any> {
  return {
    asymmetricMatch: function(actual, util: MatchersUtil) {
      return util.contains(expected, actual);
    },
    jasmineToString: function(pp) {
      return 'any of ' + pp(expected);
    }
  };
}



export function timeout<D>(millis: number, data?: D): Promise<D> {
  const {promise, resolve} = Promise.withResolvers<D>();
  setTimeout(() => resolve(data), millis);
  return promise;
}

export function domTreeAvailable<T>(context: HTMLElement, selectorOrCondition: string | (() => T)): Promise<T> {
  const preflightResult = querySelectorOrCondition(context, selectorOrCondition);
  if (preflightResult) {
    return Promise.resolve(preflightResult);
  }

  const {promise, resolve} = Promise.withResolvers<T>();
  const observer = new MutationObserver(() => {
    const result = querySelectorOrCondition(context, selectorOrCondition);
    if (result) {
      observer.disconnect();
      resolve(result);
    }
  });
  observer.observe(context, {attributes: true, childList: true, characterData: true, subtree: true});

  return promise;
}

function querySelectorOrCondition<T>(context: HTMLElement, selectorOrCondition: string | (() => T)): T {
  if (typeof selectorOrCondition === 'string') {
    return context.querySelector(selectorOrCondition) as T;
  }
  return selectorOrCondition();
}



export function queryAndExpectOne(context: HTMLElement, selector: string): HTMLElement {
  return queryAndExpectCount(context, selector)[0];
}

export function queryAndExpectCount(context: HTMLElement, selector: string, count: number = 1): HTMLElement[] {
  const result = context.querySelectorAll(selector);
  expect(result.length).withContext('number of elements matching query "' + selector + '"').toBe(count);
  return Array.from(result) as HTMLElement[];
}



export async function whenStableDetectChanges(fixture: ComponentFixture<any>): Promise<void> {
  try {
    await fixture.whenStable();
    fixture.detectChanges();
  } catch(err) {
    console.error(err);
  }
}
