import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { XssContext, XssContextCollection } from './xss-demo.common';
import { LiveOutputType, Encoded, TextContent, InnerText, InnerHtml, ParagraphTitle, LinkUrl, IframeUrl, StyleBlock, StyleAttribute, StructuredStyleAttribute } from './live-output.component';



export enum PayloadOutputQuality {
  Recommended,
  Questionable,
  Insecure
}



interface PayloadProcessor {
  (payload: string): any;
}

interface HtmlSourceProvider {
  (payload: any): string;
}

interface Injector {
  (element: HTMLElement, payload: any): void;
}

interface DomInjector extends Injector {};

interface JQueryInjector extends Injector {};



interface PayloadProcessors {
  new (sanitizer: DomSanitizer): PayloadProcessors;
  [prop: string]: PayloadProcessor;
}

interface HtmlSourceProviders {
  new (): HtmlSourceProviders;
  [prop: string]: HtmlSourceProvider;
}

interface DomInjectors {
  new (): DomInjectors;
  [prop: string]: DomInjector;
}

interface JQueryInjectors {
  new (): JQueryInjectors;
  [prop: string]: JQueryInjector;
}

interface PayloadOutputFunctions {
  readonly PayloadProcessors: PayloadProcessors;
  readonly HtmlSourceProviders: HtmlSourceProviders;
  readonly DomInjectors: DomInjectors;
  readonly JQueryInjectors: JQueryInjectors;
}



export interface PayloadOutputDescriptor {
  readonly id: string;
  readonly quality: PayloadOutputQuality;
  readonly name: string;
  readonly title: string;
  readonly payloadProcessor?: PayloadProcessor;
  readonly htmlSourceProvider?: HtmlSourceProvider;
  readonly domInjector?: DomInjector;
  readonly jQueryInjector?: JQueryInjector;
  readonly templateComponentType?: LiveOutputType;
}



@Injectable()
export class PayloadOutputService {

  private readonly _processors: PayloadProcessors;

  private readonly _providers: HtmlSourceProviders;

  private readonly _domInjectors: DomInjectors;

  private readonly _jQueryInjectors: JQueryInjectors;

  readonly descriptors: XssContextCollection<PayloadOutputDescriptor>[];

  constructor(sanitizer: DomSanitizer) {
    const payloadOutputFunctions = (window as any).XssDemoApp.PayloadOutputFunctions as PayloadOutputFunctions;
    this._processors = new payloadOutputFunctions.PayloadProcessors(sanitizer);
    this._providers = new payloadOutputFunctions.HtmlSourceProviders();
    this._domInjectors = new payloadOutputFunctions.DomInjectors();
    this._jQueryInjectors = new payloadOutputFunctions.JQueryInjectors();

    this.descriptors = [

      {
        id: XssContext.HtmlContent,
        name: 'HTML Content',
        items: [

          {
            id: 'HtmlEncodedContent',
            quality: PayloadOutputQuality.Questionable,
            name: 'Encoded HTML',
            title: 'Payload as Manually Encoded HTML',
            payloadProcessor: this._processors.htmlEncoding,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlSanitizedContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized HTML (DOMPurify)',
            title: 'Payload as Sanitized HTML (DOMPurify default policy)',
            payloadProcessor: this._processors.htmlSanitizingDomPurify,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlSanitizedContentMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized HTML (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML (DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlSanitizedContentInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized HTML (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML (DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlContent',
            quality: PayloadOutputQuality.Insecure,
            name: 'Raw HTML',
            title: 'Payload as Raw HTML',
            htmlSourceProvider: this._providers.raw
          },



          {
            id: 'DomTextContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .textContent',
            title: 'Payload as HTML Text Content (DOM .textContent)',
            domInjector: this._domInjectors.textContent
          },

          {
            id: 'DomInnerText',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerText',
            title: 'Payload as HTML Inner Text (DOM .innerText)',
            domInjector: this._domInjectors.innerText
          },

          {
            id: 'DomEncodedInnerHtml',
            quality: PayloadOutputQuality.Questionable,
            name: 'Encoded DOM .innerHtml',
            title: 'Payload HTML Manually Encoded (DOM .innerHTML)',
            payloadProcessor: this._processors.htmlEncoding,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomSanitizedInnerHtml',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized DOM .innerHtml (DOMPurify)',
            title: 'Payload HTML Sanitized (DOMPurify default policy & DOM .innerHTML)',
            payloadProcessor: this._processors.htmlSanitizingDomPurify,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomSanitizedInnerHtmlMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized DOM .innerHtml (DOMPurify minimal inline)',
            title: 'Payload HTML Sanitized (DOMPurify minimal policy for inline markup & DOM .innerHTML)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomSanitizedContentInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized DOM .innerHtml (DOMPurify some inline, block, links)',
            title: 'Payload HTML Sanitized (DOMPurify policy for some inline, block, and link markup & DOM .innerHTML)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtml',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML',
            title: 'Payload HTML Raw (DOM .innerHTML)',
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlNoOutput',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML (no output)',
            title: 'Payload HTML Unencoded (DOM .innerHTML, without modifying the document)',
            domInjector: this._domInjectors.innerHtmlNoOutput
          },



          {
            id: 'JQueryText',
            quality: PayloadOutputQuality.Recommended,
            name: 'jQuery.text(string)',
            title: 'Payload as text ($.text())',
            jQueryInjector: this._jQueryInjectors.text
          },

          {
            id: 'JQueryHtmlSanitized',
            quality: PayloadOutputQuality.Recommended,
            name: 'jQuery.html(DOMPurify default)',
            title: 'Payload as sanitized HTML (DOMPurify default policy & $.html())',
            payloadProcessor: this._processors.htmlSanitizingDomPurify,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'jQuery.html(DOMPurify minimal inline)',
            title: 'Payload as sanitized HTML (DOMPurify minimal policy for inline markup & $.html())',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'jQuery.html(DOMPurify some inline, block, links)',
            title: 'Payload as sanitized HTML (DOMPurify policy for some inline, block, and link markup & $.html())',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'jQuery.html(encodedString)',
            title: 'Payload as manually encoded HTML ($.html())',
            payloadProcessor: this._processors.htmlEncoding,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'jQuery(encodedString)',
            title: 'Payload as manually encoded HTML, through constructor ($())',
            payloadProcessor: this._processors.htmlEncoding,
            jQueryInjector: this._jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryHtmlTextNode',
            quality: PayloadOutputQuality.Questionable,
            name: 'jQuery.html(Text)',
            title: 'Payload as HTML Text node ($.html())',
            payloadProcessor: this._processors.domTextNode,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorTextNode',
            quality: PayloadOutputQuality.Questionable,
            name: 'jQuery(Text)',
            title: 'Payload as HTML Text node, through constructor ($())',
            payloadProcessor: this._processors.domTextNode,
            jQueryInjector: this._jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryHtml',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.html(string)',
            title: 'Payload as HTML ($.html())',
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructor',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery(string)',
            title: 'Payload as HTML, through constructor ($())',
            jQueryInjector: this._jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryPrepend',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.prepend(string)',
            title: 'Payload prepended as HTML ($.prepend())',
            jQueryInjector: this._jQueryInjectors.prepend
          },

          {
            id: 'JQueryAppend',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.append(string)',
            title: 'Payload appended as HTML ($.append())',
            jQueryInjector: this._jQueryInjectors.append
          },

          {
            id: 'JQueryBefore',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.before(string)',
            title: 'Payload as HTML before ($.before())',
            jQueryInjector: this._jQueryInjectors.before
          },

          {
            id: 'JQueryAfter',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.after(string)',
            title: 'Payload as HTML after ($.after())',
            jQueryInjector: this._jQueryInjectors.after
          },

          {
            id: 'JQueryWrapInner',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.wrapInner(string)',
            title: 'Payload as inner HTML wrap ($.wrapInner())',
            jQueryInjector: this._jQueryInjectors.wrapInner
          },

          {
            id: 'JQueryWrap',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.wrap(string)',
            title: 'Payload as HTML wrap ($.wrap())',
            jQueryInjector: this._jQueryInjectors.wrap
          },

          {
            id: 'JQueryReplaceWith',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery.replaceWith(string)',
            title: 'Payload as HTML replacement ($.replaceWith())',
            jQueryInjector: this._jQueryInjectors.replaceWith
          },



          {
            id: 'NgEncodedTemplate',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng {{ template }}',
            title: 'Payload HTML Encoded (Angular {{ template }})',
            templateComponentType: Encoded
          },

          {
            id: 'NgEncodedTextContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [textContent]',
            title: 'Payload as HTML Text Content (Angular [textContent])',
            templateComponentType: TextContent
          },

          {
            id: 'NgEncodedInnerText',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerText]',
            title: 'Payload as HTML Inner Text (Angular [innerText])',
            templateComponentType: InnerText
          },

          {
            id: 'NgSanitized',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized ng [innerHTML]',
            title: 'Payload HTML Sanitized (Angular [innerHTML])',
            templateComponentType: InnerHtml
          },

          {
            id: 'NgTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'Trusted ng [innerHTML]',
            title: 'Payload HTML Trusted (Angular [innerHTML] and DomSanitizer.bypassSecurityTrustHtml())',
            payloadProcessor: this._processors.ngTrustedHtml,
            templateComponentType: InnerHtml
          }
        ]
      },

      {
        id: XssContext.HtmlAttribute,
        name: 'HTML Attributes',
        items: [

          {
            id: 'HtmlEncodedAttribute',
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML paragraph title encoded',
            title: 'Payload as Manually Encoded HTML Attribute (<p title="">)',
            payloadProcessor: this._processors.htmlEncoding,
            htmlSourceProvider: this._providers.paragraphTitle
          },

          {
            id: 'HtmlAttribute',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML paragraph title',
            title: 'Payload as HTML Attribute (<p title="">)',
            htmlSourceProvider: this._providers.paragraphTitle
          },

          {
            id: 'HtmlEncodedUnquotedAttribute',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML paragraph title encoded, unquoted',
            title: 'Payload as Manually Encoded, Unquoted HTML Attribute (<p title=>)',
            payloadProcessor: this._processors.htmlEncoding,
            htmlSourceProvider: this._providers.unquotedParagraphTitle
          },

          {
            id: 'HtmlUnquotedAttribute',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML paragraph title unquoted',
            title: 'Payload as Unquoted HTML Attribute (<p title=>)',
            htmlSourceProvider: this._providers.unquotedParagraphTitle
          },

          {
            id: 'DomAttributeValue',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM paragraph title',
            title: 'Payload as HTML Attribute (DOM p[title])',
            domInjector: this._domInjectors.titleAttribute
          },

          {
            id: 'JQueryAttributeValue',
            quality: PayloadOutputQuality.Recommended,
            name: 'jQuery paragraph title',
            title: 'Paylaod as HTML Attribute ($(\'<p>\').attr(\'title\', ...))',
            jQueryInjector: this._jQueryInjectors.titleAttribute
          },

          {
            id: 'NgEncodedAttributeValue',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng p [title]',
            title: 'Payload as HTML Attribute (Angular Paragraph [title])',
            templateComponentType: ParagraphTitle
          },

          {
            id: 'NgTrustedAttributeValue',
            quality: PayloadOutputQuality.Questionable,
            name: 'Trusted ng p [title]',
            title: 'Payload as HTML Attribute (Angular Paragraph [title])',
            payloadProcessor: this._processors.ngTrustedHtml,
            templateComponentType: ParagraphTitle
          }
        ]
      },

      {
        id: XssContext.Url,
        name: 'URLs',
        items: [

          {
            id: 'LinkDomValidated',
            quality: PayloadOutputQuality.Recommended,
            name: 'URL-validated DOM <a href>',
            title: 'Payload URL Validated (DOM a.href)',
            payloadProcessor: this._processors.urlValidation,
            domInjector: this._domInjectors.linkHref
          },

          {
            id: 'LinkDomTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <a href>',
            title: 'Payload URL Raw (DOM a.href)',
            domInjector: this._domInjectors.linkHref
          },

          {
            id: 'LinkJQueryValidated',
            quality: PayloadOutputQuality.Recommended,
            name: 'URL-validated jQuery <a href>',
            title: 'Payload URL Validated ($.attr(\'href\', ...))',
            payloadProcessor: this._processors.urlValidation,
            jQueryInjector: this._jQueryInjectors.linkHref
          },

          {
            id: 'LinkJQueryTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery <a href>',
            title: 'Payload URL Raw ($.attr(\'href\', ...))',
            jQueryInjector: this._jQueryInjectors.linkHref
          },

          {
            id: 'LinkNgSanitized',
            quality: PayloadOutputQuality.Recommended,
            name: 'Sanitized ng <a href>',
            title: 'Payload URL Sanitized (Angular a [href])',
            templateComponentType: LinkUrl
          },

          {
            id: 'LinkNgTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'Trusted ng <a href>',
            title: 'Payload URL Trusted!!! (Angular a [href] and DomSanitizer.bypassSecurityTrustUrl())',
            payloadProcessor: this._processors.ngTrustedUrl,
            templateComponentType: LinkUrl
          },

          {
            id: 'IframeDomValidated',
            quality: PayloadOutputQuality.Recommended,
            name: 'URL-validated DOM <iframe src>',
            title: 'Payload URL Validated (DOM iframe.src)',
            payloadProcessor: this._processors.urlValidation,
            domInjector: this._domInjectors.iframeSrc
          },

          {
            id: 'IframeDomTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <iframe src>',
            title: 'Payload URL Raw (DOM iframe.src)',
            domInjector: this._domInjectors.iframeSrc
          },

          {
            id: 'IframeJQueryValidated',
            quality: PayloadOutputQuality.Recommended,
            name: 'URL-validated jQuery <iframe src>',
            title: 'Payload URL Validated ($.attr(\'src\', ...))',
            payloadProcessor: this._processors.urlValidation,
            jQueryInjector: this._jQueryInjectors.iframeSrc
          },

          {
            id: 'IframeJQueryTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'jQuery <iframe src>',
            title: 'Payload URL Raw ($.attr(\'src\', ...))',
            jQueryInjector: this._jQueryInjectors.iframeSrc
          },

          {
            id: 'IframeNgSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'Sanitized ng <iframe src>',
            title: 'Payload URL Sanitized (Angular iframe [src])',
            templateComponentType: IframeUrl
          },

          {
            id: 'IframeNgTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'Trusted ng <iframe src>',
            title: 'Payload URL Trusted! (Angular iframe [src] and DomSanitizer.bypassSecurityTrustResourceUrl())',
            payloadProcessor: this._processors.ngTrustedResourceUrl,
            templateComponentType: IframeUrl
          }
        ]
      },

      {
        id: XssContext.Css,
        name: 'CSS Styles',
        items: [

          {
            id: 'BlockDomTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'Style Block DOM .textContent',
            title: 'Payload CSS Raw (Style Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedStyleBlock,
          },

          {
            id: 'AttributeDomTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'Style Attribute DOM .style',
            title: 'Payload CSS Raw (Style Attribute with DOM .style)',
            domInjector: this._domInjectors.trustedStyleAttribute,
          },

          {
            id: 'BlockNgSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'Sanitized Style Block ng [innerHTML]',
            title: 'Payload CSS Sanitized (Style block with Angular [innerHTML])',
            templateComponentType: StyleBlock
          },

          {
            id: 'BlockNgTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'Trusted Style Block ng [innerHTML]',
            title: 'Payload CSS Trusted (Style block with Angular [innerHTML] and DomSanitizer.bypassSecurityTrustCss())',
            payloadProcessor: this._processors.ngTrustedStyle,
            templateComponentType: StyleBlock
          },

          {
            id: 'AttributeNgSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'Sanitized Style Attribute ng [style]',
            title: 'Payload CSS Sanitized (Style attribute with Angular [style])',
            templateComponentType: StyleAttribute
          },

          {
            id: 'AttributeNgTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'Trusted Style Attribute ng [style]',
            title: 'Payload CSS Trusted (Style attribute with Angular [style] and DomSanitizer.bypassSecurityTrustStyle()',
            payloadProcessor: this._processors.ngTrustedStyle,
            templateComponentType: StyleAttribute
          },

          {
            id: 'AttributeNgStructured',
            quality: PayloadOutputQuality.Questionable,
            name: 'Structured Style Attribute ng [ngStyle]',
            title: 'Payload CSS Sanitized (Style attribute with Angular [ngStyle] and JSON data)',
            payloadProcessor: this._processors.jsonParsing,
            templateComponentType: StructuredStyleAttribute
          }
        ]
      },

      {
        id: XssContext.JavaScript,
        name: 'JavaScript',
        items: [

          {
            id: 'ValueDomEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'Encoded JS value',
            title: 'Payload JavaScript Encoded (JSON encoding and DOM .textContent)',
            payloadProcessor: this._processors.jsEncoding,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'DqStringDomTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'Trusted JS "string"',
            title: 'Payload JavaScript Trusted (JS "string" and DOM .textContent)',
            payloadProcessor: this._processors.jsDoubleQuoting,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'SqStringDomTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'Trusted JS \'string\'',
            title: 'Payload JavaScript Trusted (JS \'string\' and DOM .textContent)',
            payloadProcessor: this._processors.jsSingleQuoting,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'BlockDomTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'Trusted JavaScript Block',
            title: 'Payload JavaScript Trusted (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'BlockDomPlainMockIframe',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Plain Mock (Iframe)',
            title: 'Payload JavaScript in plain mock page via iframe (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockPlainMockIframe
          },

          {
            id: 'BlockDomPlainMockWindow',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Plain Mock (Window)',
            title: 'Payload JavaScript in plain mock page via new window (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockPlainMockWindow
          },

          {
            id: 'BlockDomStorageMockIframe',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Storage Mock (Iframe)',
            title: 'Payload JavaScript in storage mock page via iframe (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockStorageMockIframe
          },

          {
            id: 'BlockDomStorageMockWindow',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Storage Mock (Window)',
            title: 'Payload JavaScript in storage mock page via new window (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockStorageMockWindow
          },

          {
            id: 'BlockDomCookiesMockIframe',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Cookies Mock (Iframe)',
            title: 'Payload JavaScript in cookies mock page via iframe (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockCookiesMockIframe
          },

          {
            id: 'BlockDomCookiesMockWindow',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Cookies Mock (Window)',
            title: 'Payload JavaScript in cookies mock page via new window (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockCookiesMockWindow
          },

          {
            id: 'BlockDomMessageMockIframe',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Post Message Mock (Iframe)',
            title: 'Payload JavaScript in post message mock page via iframe (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockMessageMockIframe
          },

          {
            id: 'BlockDomMessageMockWindow',
            quality: PayloadOutputQuality.Insecure,
            name: 'JavaScript in Post Message Mock (Window)',
            title: 'Payload JavaScript in post message mock page via new window (Script Block with DOM .textContent)',
            domInjector: this._domInjectors.trustedScriptBlockMessageMockWindow
          }
        ]
      }
    ];
  }

  contextDescriptorById(contextId: XssContext): XssContextCollection<PayloadOutputDescriptor> {
    for (const context of this.descriptors) {
      if (context.id == contextId) {
        return context;
      }
    }
    return null;
  }

  outputDescriptorById(contextId: XssContext, outputId: string): PayloadOutputDescriptor {
    const context = this.contextDescriptorById(contextId);
    if (context) {
      for (const output of context.items) {
        if (output.id == outputId) {
          return output;
        }
      }
    }
    return null;
  }
}
