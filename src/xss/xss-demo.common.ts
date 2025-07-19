export enum XssContext {
  HtmlContent   = 'HtmlContent',
  HtmlAttribute = 'HtmlAttribute',
  Url           = 'Url',
  Css           = 'Css',
  JavaScript    = 'JavaScript',
}

export interface XssContextCollection<P> {
  readonly context: XssContext
  readonly name: string
  readonly items: P[]
}
