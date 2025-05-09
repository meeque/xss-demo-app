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
            id: 'HtmlContentEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML Encoded',
            title: 'Payload as Manually Encoded HTML Content',
            payloadProcessor: this._processors.htmlEncoding,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlContentSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML Content (DOMPurify default policy)',
            payloadProcessor: this._processors.htmlSanitizingDomPurify,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlContentSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML Content (DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlContentSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML Content (DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
            htmlSourceProvider: this._providers.raw
          },

          {
            id: 'HtmlContentRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML Raw',
            title: 'Payload as Raw HTML Content',
            htmlSourceProvider: this._providers.raw
          },



          {
            id: 'DomTextContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .textContent',
            title: 'Payload as Text Content (DOM .textContent = ...)',
            domInjector: this._domInjectors.textContent
          },

          {
            id: 'DomInnerText',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerText',
            title: 'Payload as Inner Text (DOM .innerText = ...)',
            domInjector: this._domInjectors.innerText
          },

          {
            id: 'DomInnerHtmlEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM .innerHtml Encoded',
            title: 'Payload as Manually Encoded Inner HTML (DOM .innerHTML = ...)',
            payloadProcessor: this._processors.htmlEncoding,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify default policy)',
            payloadProcessor: this._processors.htmlSanitizingDomPurify,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHTMLSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML Raw',
            title: 'Payload as Raw HTML (DOM .innerHTML = ...)',
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlRawNoInsert',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML Raw (No Insert)',
            title: 'Payload as Raw HTML (DOM .innerHTML = ..., without insertion into the document)',
            domInjector: this._domInjectors.innerHtmlNoOutput
          },



          {
            id: 'JQueryText',
            quality: PayloadOutputQuality.Recommended,
            name: '$().text()',
            title: 'Payload as Text (jQuery().text(...))',
            jQueryInjector: this._jQueryInjectors.text
          },

          {
            id: 'JQueryHtmlSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify default policy)',
            payloadProcessor: this._processors.htmlSanitizingDomPurify,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Encoded',
            title: 'Payload as Manually Encoded HTML (jQuery().html(...))',
            payloadProcessor: this._processors.htmlEncoding,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: '$() Encoded',
            title: 'Payload as Manually Encoded HTML Through Constructor (jQuery(...))',
            payloadProcessor: this._processors.htmlEncoding,
            jQueryInjector: this._jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryHtmlTextNode',
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Text Node',
            title: 'Payload as DOM Text Node (jQuery().html(...))',
            payloadProcessor: this._processors.domTextNode,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorTextNode',
            quality: PayloadOutputQuality.Questionable,
            name: '$() Text Node',
            title: 'Payload as DOM Text Node Through Constructor (jQuery(...))',
            payloadProcessor: this._processors.domTextNode,
            jQueryInjector: this._jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryHtmlRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().html() Raw',
            title: 'Payload as Raw HTML (jQuery().html(...))',
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$() Raw',
            title: 'Payload as Raw HTML Through Constructor (jQuery(...))',
            jQueryInjector: this._jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryPrependRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().prepend() Raw',
            title: 'Payload Prepended as Raw HTML (jQuery().prepend(...))',
            jQueryInjector: this._jQueryInjectors.prepend
          },

          {
            id: 'JQueryAppendRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().append() Raw',
            title: 'Payload as Raw HTML Appended (jQuery().append(...))',
            jQueryInjector: this._jQueryInjectors.append
          },

          {
            id: 'JQueryBeforeRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().before() Raw',
            title: 'Payload as Raw HTML Inserted Before (jQuery().before(...))',
            jQueryInjector: this._jQueryInjectors.before
          },

          {
            id: 'JQueryAfterRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().after() Raw',
            title: 'Payload as Raw HTML Inserted After (jQuery().after(...))',
            jQueryInjector: this._jQueryInjectors.after
          },

          {
            id: 'JQueryWrapInnerRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().wrapInner() Raw',
            title: 'Payload as Raw HTML Wrapped Inside (jQuery().wrapInner(...))',
            jQueryInjector: this._jQueryInjectors.wrapInner
          },

          {
            id: 'JQueryWrapRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().wrap() Raw',
            title: 'Payload as Raw HTML Wrapped Around (jQuery().wrap(...))',
            jQueryInjector: this._jQueryInjectors.wrap
          },

          {
            id: 'JQueryReplaceWithRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().replaceWith() Raw',
            title: 'Payload as Raw HTML Replacement (jQuery().replaceWith(...))',
            jQueryInjector: this._jQueryInjectors.replaceWith
          },



          {
            id: 'NgTemplateInterpolation',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng {{...}}',
            title: 'Payload as HTML Content through Template Interpolation (Angular {{...}})',
            templateComponentType: Encoded
          },

          {
            id: 'NgTextContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [textContent]',
            title: 'Payload as HTML Text-Content (Angular <div [textContent]="...">)',
            templateComponentType: TextContent
          },

          {
            id: 'NgInnerText',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerText]',
            title: 'Payload as HTML Inner-Text (Angular <div [innerText]="...">)',
            templateComponentType: InnerText
          },

          {
            id: 'NgInnerHtmlSanitized',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerHTML] Sanitized',
            title: 'Payload as Sanitized Inner-HTML (Angular <div [innerHTML]="...">)',
            templateComponentType: InnerHtml
          },

          {
            id: 'NgInnerHtmlTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'ng [innerHTML] Trusted',
            title: 'Payload as Trusted Inner-HTML (Angular <div [innerHTML]="..."> with DomSanitizer.bypassSecurityTrustHtml())',
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
            id: 'HtmlTitleAttributeEncodedQuoted',
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML <p title> Encoded & Quoted',
            title: 'Payload as Manually Encoded and Quoted HTML Title Attribute Value (<p title="...">)',
            payloadProcessor: this._processors.htmlEncoding,
            htmlSourceProvider: this._providers.paragraphTitle
          },

          {
            id: 'HtmlTitleAttributeRawQuoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Quoted',
            title: 'Payload as Raw, But Quoted HTML Title Attribute Value (<p title="...">)',
            htmlSourceProvider: this._providers.paragraphTitle
          },

          {
            id: 'HtmlTitleAttributeEncodedUnquoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Encoded & Unquoted',
            title: 'Payload as Manually Encoded, But Unquoted HTML Title Attribute Value (<p title=...>)',
            payloadProcessor: this._processors.htmlEncoding,
            htmlSourceProvider: this._providers.unquotedParagraphTitle
          },

          {
            id: 'HtmlTitleAttributeRawUnquoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Unquoted',
            title: 'Payload as Raw and Unquoted HTML Title Attribute Value (<p title=...>)',
            htmlSourceProvider: this._providers.unquotedParagraphTitle
          },

          {
            id: 'DomTitleAttribute',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM p.setAttribute(\'title\')',
            title: 'Payload as Title Attribute Value (DOM p.setAttribute(\'title\', ...))',
            domInjector: this._domInjectors.titleAttribute
          },

          {
            id: 'JQueryTitleAttribute',
            quality: PayloadOutputQuality.Recommended,
            name: '$(p).attr(\'title\')',
            title: 'Paylaod as Title Attribute ($(p).attr(\'title\', ...))',
            jQueryInjector: this._jQueryInjectors.titleAttribute
          },

          {
            id: 'NgTitleAttribute',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng <p [title]>',
            title: 'Payload as Title Attribute (Angular <p [title]="...">)',
            templateComponentType: ParagraphTitle
          },

          {
            id: 'NgTitleAttributeTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <p [title]> Trusted',
            title: 'Payload as Trusted Title Attribute (Angular <p [title]="..."> with DomSanitizer.bypassSecurityTrustHtml())',
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
            id: 'DomLinkHrefValidated',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM a.href URL-Validated',
            title: 'Payload as URL-Validated Link-URL (DOM a.href = ...)',
            payloadProcessor: this._processors.urlValidation,
            domInjector: this._domInjectors.linkHref
          },

          {
            id: 'DomLinkHrefRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM a.href Raw',
            title: 'Payload as Raw Link-URL (DOM a.href = ...)',
            domInjector: this._domInjectors.linkHref
          },

          {
            id: 'JQueryLinkHrefValidated',
            quality: PayloadOutputQuality.Questionable,
            name: '$(a).attr(\'href\') URL-Validated',
            title: 'Payload as URL-Validated Link-URL (jQuery(a).attr(\'href\', ...))',
            payloadProcessor: this._processors.urlValidation,
            jQueryInjector: this._jQueryInjectors.linkHref
          },

          {
            id: 'JQueryLinkHrefRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$(a).attr(\'href\') Raw',
            title: 'Payload as Raw Link-URL (jQuery(a).attr(\'href\', ...))',
            jQueryInjector: this._jQueryInjectors.linkHref
          },

          {
            id: 'NgLinkHrefSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <a [href]> Sanitized',
            title: 'Payload as Sanitized Link-URL (Angular <a [href]="...">)',
            templateComponentType: LinkUrl
          },

          {
            id: 'NgLinkHrefTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'ng <a [href]> Trusted',
            title: 'Payload as Trusted Link-URL (Angular <a [href]="..."> with DomSanitizer.bypassSecurityTrustUrl())',
            payloadProcessor: this._processors.ngTrustedUrl,
            templateComponentType: LinkUrl
          },

          {
            id: 'DomIframeSrcValidated',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM iframe.src URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (DOM iframe.src = ...)',
            payloadProcessor: this._processors.urlValidation,
            domInjector: this._domInjectors.iframeSrc
          },

          {
            id: 'DomIframeSrcRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM iframe.src Raw',
            title: 'Payload as Raw IFrame-URL (DOM iframe.src = ...)',
            domInjector: this._domInjectors.iframeSrc
          },

          {
            id: 'JQueryIframeSrcValidated',
            quality: PayloadOutputQuality.Questionable,
            name: '$(iframe).attr(\'src\') URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (jQuery(iframe).attr(\'src\', ...))',
            payloadProcessor: this._processors.urlValidation,
            jQueryInjector: this._jQueryInjectors.iframeSrc
          },

          {
            id: 'JQueryIframeSrcRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$(iframe).attr(\'src\') Raw',
            title: 'Payload as Raw IFrame-URL (jQuery(iframe).attr(\'src\', ...))',
            jQueryInjector: this._jQueryInjectors.iframeSrc
          },

          {
            id: 'NgIframeSrcSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <iframe [src]> Sanitized',
            title: 'Payload as Sanitized IFrame-URL (Angular <iframe [src]="...">)',
            templateComponentType: IframeUrl
          },

          {
            id: 'NgIframeSrcTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'ng <iframe [src]> Trusted',
            title: 'Payload as Trusted Resource IFrame-URL (Angular <iframe [src]="..."> with DomSanitizer.bypassSecurityTrustResourceUrl())',
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
            id: 'DomStyleBlockRaw',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM style.textContent Raw',
            title: 'Payload as Style Block Text-Content (DOM style.textContent = ...)',
            domInjector: this._domInjectors.trustedStyleBlock,
          },

          {
            id: 'DomStyleAttributeRaw',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM div.setAttribute(\'style\') Raw',
            title: 'Payload as Style Attribute Value (DOM div.setAttribute(\'style\', ...))',
            domInjector: this._domInjectors.trustedStyleAttribute,
          },

          {
            id: 'NgStyleBlockSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <style [innerHTML]> Sanitized',
            title: 'Payload as Sanitized Style Block HTML (Angular <style [innerHTML]="...">)',
            templateComponentType: StyleBlock
          },

          {
            id: 'NgStyleBlockTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <style [innerHTML]> Trusted',
            title: 'Payload as Trusted Style Block HTML (Angular <style [innerHTML]="..."> with DomSanitizer.bypassSecurityTrusStyle())',
            payloadProcessor: this._processors.ngTrustedStyle,
            templateComponentType: StyleBlock
          },

          {
            id: 'NgStyleAttributeSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [style] Sanitized',
            title: 'Payload as Sanitized Style Attribute Value (Angular <div [style]="...">)',
            templateComponentType: StyleAttribute
          },

          {
            id: 'NgStyleAttributeTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [style] Trusted',
            title: 'Payload as Trusted Style Attribute Value (Angular <div [style]="..."> with DomSanitizer.bypassSecurityTrustStyle()',
            payloadProcessor: this._processors.ngTrustedStyle,
            templateComponentType: StyleAttribute
          },

          {
            id: 'NgStyleAttributePropertiesSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [ngStyle] Sanitized',
            title: 'Payload as Sanitized Style Attribute Properties (Angular <div [ngStyle]="..."> with JSON.parse())',
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
            id: 'DomScriptBlockValueEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM <script>-Block Expression Encoded',
            title: 'Payload as JavaScript-Encoded Expression in a JavaScript Block (DOM script.textContent = ..., with JSON.stringify())',
            payloadProcessor: this._processors.jsEncoding,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockStringLiteralDq',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block "string literal" Raw',
            title: 'Payload as Raw Content of a Double-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'"\' + ... + \'"\')',
            payloadProcessor: this._processors.jsDoubleQuoting,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockStringLiteralSq',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block \'string literal\' Raw',
            title: 'Payload as Raw Content of a Single-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'\\\'\' + ... + \'\\\'\')',
            payloadProcessor: this._processors.jsSingleQuoting,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block Content Raw',
            title: 'Payload as Raw Content of a JavaScript Block (DOM script.textContent = ...)',
            domInjector: this._domInjectors.trustedScriptBlock
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
