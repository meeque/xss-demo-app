export enum XssContext {
  HtmlContent,
  HtmlAttribute,
  Url,
  Css,
  JavaScript
}

export interface XssContextCollection<P> {
  readonly id: XssContext;
  readonly name: string;
  readonly items: P[];
}
