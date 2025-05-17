import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { XssContext, XssContextCollection } from './xss-demo.common';
import { LiveOutputType, Encoded, TextContent, InnerText, InnerHtml, ParagraphTitle, LinkUrl, IframeUrl, StyleBlock, StyleAttribute, StructuredStyleAttribute } from './live-output.component';
import { PayloadProcessors, HtmlSourceProviders, DomInjectors, JQueryInjectors} from './payload-output.functions';


export enum PayloadOutputQuality {
  Recommended  = 'Recommended',
  Questionable = 'Questionable',
  Insecure     = 'Insecure'
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
    this._processors = new PayloadProcessors(sanitizer);
    this._providers = new HtmlSourceProviders();
    this._domInjectors = new DomInjectors();
    this._jQueryInjectors = new JQueryInjectors();

    this.descriptors = [

      {
        context: XssContext.HtmlContent,
        name: 'HTML Content',
        items: [

          {
            id: 'HtmlContentEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML Encoded',
            title: 'Payload as Manually Encoded HTML Content',
            payloadProcessor: this._processors.htmlEncode,
            htmlSourceProvider: this._providers.content
          },

          {
            id: 'HtmlContentSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML Content (DOMPurify default policy)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyDefault,
            htmlSourceProvider: this._providers.content
          },

          {
            id: 'HtmlContentSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML Content (DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyMinimalInline,
            htmlSourceProvider: this._providers.content
          },

          {
            id: 'HtmlContentSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML Content (DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyInlineBlockLinks,
            htmlSourceProvider: this._providers.content
          },

          {
            id: 'HtmlContentRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML Raw',
            title: 'Payload as Raw HTML Content',
            htmlSourceProvider: this._providers.content
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
            payloadProcessor: this._processors.htmlEncode,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify default policy)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyDefault,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyMinimalInline,
            domInjector: this._domInjectors.innerHtml
          },

          {
            id: 'DomInnerHTMLSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyInlineBlockLinks,
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
            payloadProcessor: this._processors.htmlSanitizeDomPurifyDefault,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyMinimalInline,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this._processors.htmlSanitizeDomPurifyInlineBlockLinks,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Encoded',
            title: 'Payload as Manually Encoded HTML (jQuery().html(...))',
            payloadProcessor: this._processors.htmlEncode,
            jQueryInjector: this._jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: '$() Encoded',
            title: 'Payload as Manually Encoded HTML Through Constructor (jQuery(...))',
            payloadProcessor: this._processors.htmlEncode,
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
            payloadProcessor: this._processors.ngTrustAsHtml,
            templateComponentType: InnerHtml
          }
        ]
      },

      {
        context: XssContext.HtmlAttribute,
        name: 'HTML Attributes',
        items: [

          {
            id: 'HtmlTitleAttributeEncodedQuoted',
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML <p title> Encoded & Quoted',
            title: 'Payload as Manually Encoded and Quoted HTML Title Attribute Value (<p title="...">)',
            payloadProcessor: this._processors.htmlEncode,
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
            payloadProcessor: this._processors.htmlEncode,
            htmlSourceProvider: this._providers.paragraphTitleUnquoted
          },

          {
            id: 'HtmlTitleAttributeRawUnquoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Unquoted',
            title: 'Payload as Raw and Unquoted HTML Title Attribute Value (<p title=...>)',
            htmlSourceProvider: this._providers.paragraphTitleUnquoted
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
            payloadProcessor: this._processors.ngTrustAsHtml,
            templateComponentType: ParagraphTitle
          }
        ]
      },

      {
        context: XssContext.Url,
        name: 'URLs',
        items: [

          {
            id: 'DomLinkHrefValidated',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM a.href URL-Validated',
            title: 'Payload as URL-Validated Link-URL (DOM a.href = ...)',
            payloadProcessor: this._processors.urlValidate,
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
            payloadProcessor: this._processors.urlValidate,
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
            payloadProcessor: this._processors.ngTrustAsUrl,
            templateComponentType: LinkUrl
          },

          {
            id: 'DomIframeSrcValidated',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM iframe.src URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (DOM iframe.src = ...)',
            payloadProcessor: this._processors.urlValidate,
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
            payloadProcessor: this._processors.urlValidate,
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
            payloadProcessor: this._processors.ngTrustAsResourceUrl,
            templateComponentType: IframeUrl
          }
        ]
      },

      {
        context: XssContext.Css,
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
            payloadProcessor: this._processors.ngTrustAsStyle,
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
            payloadProcessor: this._processors.ngTrustAsStyle,
            templateComponentType: StyleAttribute
          },

          {
            id: 'NgStyleAttributePropertiesSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [ngStyle] Sanitized',
            title: 'Payload as Sanitized Style Attribute Properties (Angular <div [ngStyle]="..."> with JSON.parse())',
            payloadProcessor: this._processors.jsonParse,
            templateComponentType: StructuredStyleAttribute
          }
        ]
      },

      {
        context: XssContext.JavaScript,
        name: 'JavaScript',
        items: [

          {
            id: 'DomScriptBlockValueEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM <script>-Block Expression Encoded',
            title: 'Payload as JavaScript-Encoded Expression in a JavaScript Block (DOM script.textContent = ..., with JSON.stringify())',
            payloadProcessor: this._processors.jsEncode,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockStringLiteralDq',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block "string literal" Raw',
            title: 'Payload as Raw Content of a Double-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'"\' + ... + \'"\')',
            payloadProcessor: this._processors.jsDoubleQuote,
            domInjector: this._domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockStringLiteralSq',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block \'string literal\' Raw',
            title: 'Payload as Raw Content of a Single-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'\\\'\' + ... + \'\\\'\')',
            payloadProcessor: this._processors.jsSingleQuote,
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
      },

      {
        context: null,
        name: 'Challenges',
        items: [
          {
            id: 'DoubleTrouble',
            quality: PayloadOutputQuality.Insecure,
            name: 'Double Trouble',
            title: 'Double Trouble Challenge',
            domInjector: this._domInjectors.challengeDoubleTrouble
          },
          {
            id: 'WhatsLeft',
            quality: PayloadOutputQuality.Insecure,
            name: 'What\'s Left',
            title: 'What\'s Left Challenge',
            payloadProcessor: this._processors.htmlChallengeStripTags,
            htmlSourceProvider: this._providers.content
          },
          {
            id: 'LikeLiterally',
            quality: PayloadOutputQuality.Insecure,
            name: 'Like Literally',
            title: 'Like Literally Challenge',
            payloadProcessor: this._processors.jsChallengeLikeLiterally,
            domInjector: this._domInjectors.trustedScriptBlock
          },
          {
            id: 'TheGreatEscape',
            quality: PayloadOutputQuality.Insecure,
            name: 'The Great Escape',
            title: 'The Great Escape Challenge',
            payloadProcessor: this._processors.jsChallengeTheGreatEscape,
            domInjector: this._domInjectors.trustedScriptBlock
          }
        ]
      }
    ];
  }

  contextDescriptorById(contextId: XssContext): XssContextCollection<PayloadOutputDescriptor> {
    for (const context of this.descriptors) {
      if (context.context == contextId) {
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
