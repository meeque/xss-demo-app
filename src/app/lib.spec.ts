

export function waitForElement(context: HTMLElement, selector: string): Promise<HTMLElement> {

  const element = context.querySelector(selector) as HTMLElement;
  if (element) {
    return Promise.resolve(element);
  }

  const {promise, resolve} = Promise.withResolvers<HTMLElement>();
  const observer = new MutationObserver(() => {
    const element = context.querySelector(selector) as HTMLElement;
    if (element) {
      observer.disconnect();
      resolve(element);
    }
  });
  observer.observe(context, {childList: true, subtree: true});

  return promise;
}

export function timeout(millis: number): Promise<boolean> {
  return new Promise(resolve => {
    setTimeout(() => resolve(false), millis);
  });
}
