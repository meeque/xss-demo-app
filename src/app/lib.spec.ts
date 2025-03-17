
// defining Jasmine's AsymmetricEqualityTester interface, not sure where to import it from
// https://jasmine.github.io/api/edge/AsymmetricEqualityTester.html
export interface AsymmetricEqualityTester<T> {
  asymmetricMatch(actual: T): boolean;
  jasmineToString(): string;
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
  observer.observe(context, {childList: true, subtree: true});

  return promise;
}

function querySelectorOrCondition<T>(context: HTMLElement, selectorOrCondition: string | (() => T)): T {
  if (typeof selectorOrCondition === 'string') {
    return context.querySelector(selectorOrCondition) as T;
  }
  return selectorOrCondition();
}
