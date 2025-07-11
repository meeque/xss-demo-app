import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { XssContext, XssContextCollection } from './xss-demo.common';
import { LiveOutputType, EncodedLiveOutputComponent, TextContentLiveOutputComponent, InnerTextLiveOutputComponent, InnerHtmlLiveOutputComponent, ParagraphTitleLiveOutputComponent, LinkUrlLiveOutputComponent, IframeUrlLiveOutputComponent, StyleBlockLiveOutputComponent, StyleAttributeLiveOutputComponent, StructuredStyleAttributeLiveOutputComponent } from './live-output.component';
import { PayloadProcessors, HtmlSourceProviders, DomInjectors, JQueryInjectors} from './payload-output.functions';



export enum PayloadOutputQuality {
  Recommended  = 'Recommended',
  Questionable = 'Questionable',
  Insecure     = 'Insecure'
}



type PayloadProcessor = (payload: string) => unknown;

type HtmlSourceProvider = (payload: unknown) => string;

type Injector = (element: HTMLElement, payload: unknown) => void;

type DomInjector = Injector;

type JQueryInjector = Injector;



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

  private readonly payloadProcessors: PayloadProcessors;
  private readonly htmlSourceProviders: HtmlSourceProviders;
  private readonly domInjectors: DomInjectors;
  private readonly jQueryInjectors: JQueryInjectors;
  readonly descriptors: XssContextCollection<PayloadOutputDescriptor>[];


  constructor(domSanitizer?: DomSanitizer) {

    this.payloadProcessors = new PayloadProcessors(domSanitizer);
    this.htmlSourceProviders = new HtmlSourceProviders();
    this.domInjectors = new DomInjectors();
    this.jQueryInjectors = new JQueryInjectors();

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
            payloadProcessor: this.payloadProcessors.htmlEncode,
            htmlSourceProvider: this.htmlSourceProviders.content
          },

          {
            id: 'HtmlContentSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML Content (DOMPurify default policy)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyDefault,
            htmlSourceProvider: this.htmlSourceProviders.content
          },

          {
            id: 'HtmlContentSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML Content (DOMPurify minimal policy for inline markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyMinimalInline,
            htmlSourceProvider: this.htmlSourceProviders.content
          },

          {
            id: 'HtmlContentSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML Content (DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyInlineBlockLinks,
            htmlSourceProvider: this.htmlSourceProviders.content
          },

          {
            id: 'HtmlContentRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML Raw',
            title: 'Payload as Raw HTML Content',
            htmlSourceProvider: this.htmlSourceProviders.content
          },



          {
            id: 'DomTextContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .textContent',
            title: 'Payload as Text Content (DOM .textContent = ...)',
            domInjector: this.domInjectors.textContent
          },

          {
            id: 'DomInnerText',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerText',
            title: 'Payload as Inner Text (DOM .innerText = ...)',
            domInjector: this.domInjectors.innerText
          },

          {
            id: 'DomInnerHtmlEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM .innerHtml Encoded',
            title: 'Payload as Manually Encoded Inner HTML (DOM .innerHTML = ...)',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            domInjector: this.domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify default policy)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyDefault,
            domInjector: this.domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyMinimalInline,
            domInjector: this.domInjectors.innerHtml
          },

          {
            id: 'DomInnerHTMLSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyInlineBlockLinks,
            domInjector: this.domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML Raw',
            title: 'Payload as Raw HTML (DOM .innerHTML = ...)',
            domInjector: this.domInjectors.innerHtml
          },

          {
            id: 'DomInnerHtmlRawNoInsert',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML Raw (No Insert)',
            title: 'Payload as Raw HTML (DOM .innerHTML = ..., without insertion into the document)',
            domInjector: this.domInjectors.innerHtmlNoOutput
          },



          {
            id: 'JQueryText',
            quality: PayloadOutputQuality.Recommended,
            name: '$().text()',
            title: 'Payload as Text (jQuery().text(...))',
            jQueryInjector: this.jQueryInjectors.text
          },

          {
            id: 'JQueryHtmlSanitizedDefault',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify default policy)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyDefault,
            jQueryInjector: this.jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedMinimalInline',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyMinimalInline,
            jQueryInjector: this.jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlSanitizedInlineBlockLinks',
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyInlineBlockLinks,
            jQueryInjector: this.jQueryInjectors.html
          },

          {
            id: 'JQueryHtmlEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Encoded',
            title: 'Payload as Manually Encoded HTML (jQuery().html(...))',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            jQueryInjector: this.jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorEncoded',
            quality: PayloadOutputQuality.Questionable,
            name: '$() Encoded',
            title: 'Payload as Manually Encoded HTML Through Constructor (jQuery(...))',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            jQueryInjector: this.jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryHtmlTextNode',
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Text Node',
            title: 'Payload as DOM Text Node (jQuery().html(...))',
            payloadProcessor: this.payloadProcessors.domTextNode,
            jQueryInjector: this.jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorTextNode',
            quality: PayloadOutputQuality.Questionable,
            name: '$() Text Node',
            title: 'Payload as DOM Text Node Through Constructor (jQuery(...))',
            payloadProcessor: this.payloadProcessors.domTextNode,
            jQueryInjector: this.jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryHtmlRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().html() Raw',
            title: 'Payload as Raw HTML (jQuery().html(...))',
            jQueryInjector: this.jQueryInjectors.html
          },

          {
            id: 'JQueryConstructorRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$() Raw',
            title: 'Payload as Raw HTML Through Constructor (jQuery(...))',
            jQueryInjector: this.jQueryInjectors.jQueryConstructor
          },

          {
            id: 'JQueryPrependRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().prepend() Raw',
            title: 'Payload Prepended as Raw HTML (jQuery().prepend(...))',
            jQueryInjector: this.jQueryInjectors.prepend
          },

          {
            id: 'JQueryAppendRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().append() Raw',
            title: 'Payload as Raw HTML Appended (jQuery().append(...))',
            jQueryInjector: this.jQueryInjectors.append
          },

          {
            id: 'JQueryBeforeRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().before() Raw',
            title: 'Payload as Raw HTML Inserted Before (jQuery().before(...))',
            jQueryInjector: this.jQueryInjectors.before
          },

          {
            id: 'JQueryAfterRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().after() Raw',
            title: 'Payload as Raw HTML Inserted After (jQuery().after(...))',
            jQueryInjector: this.jQueryInjectors.after
          },

          {
            id: 'JQueryWrapInnerRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().wrapInner() Raw',
            title: 'Payload as Raw HTML Wrapped Inside (jQuery().wrapInner(...))',
            jQueryInjector: this.jQueryInjectors.wrapInner
          },

          {
            id: 'JQueryWrapRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().wrap() Raw',
            title: 'Payload as Raw HTML Wrapped Around (jQuery().wrap(...))',
            jQueryInjector: this.jQueryInjectors.wrap
          },

          {
            id: 'JQueryReplaceWithRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$().replaceWith() Raw',
            title: 'Payload as Raw HTML Replacement (jQuery().replaceWith(...))',
            jQueryInjector: this.jQueryInjectors.replaceWith
          },



          {
            id: 'NgTemplateInterpolation',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng {{...}}',
            title: 'Payload as HTML Content through Template Interpolation (Angular {{...}})',
            templateComponentType: EncodedLiveOutputComponent
          },

          {
            id: 'NgTextContent',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [textContent]',
            title: 'Payload as HTML Text-Content (Angular <div [textContent]="...">)',
            templateComponentType: TextContentLiveOutputComponent
          },

          {
            id: 'NgInnerText',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerText]',
            title: 'Payload as HTML Inner-Text (Angular <div [innerText]="...">)',
            templateComponentType: InnerTextLiveOutputComponent
          },

          {
            id: 'NgInnerHtmlSanitized',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerHTML] Sanitized',
            title: 'Payload as Sanitized Inner-HTML (Angular <div [innerHTML]="...">)',
            templateComponentType: InnerHtmlLiveOutputComponent
          },

          {
            id: 'NgInnerHtmlTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'ng [innerHTML] Trusted',
            title: 'Payload as Trusted Inner-HTML (Angular <div [innerHTML]="..."> with DomSanitizer.bypassSecurityTrustHtml())',
            payloadProcessor: this.payloadProcessors.ngTrustAsHtml,
            templateComponentType: InnerHtmlLiveOutputComponent
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
            payloadProcessor: this.payloadProcessors.htmlEncode,
            htmlSourceProvider: this.htmlSourceProviders.paragraphTitle
          },

          {
            id: 'HtmlTitleAttributeRawQuoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Quoted',
            title: 'Payload as Raw, But Quoted HTML Title Attribute Value (<p title="...">)',
            htmlSourceProvider: this.htmlSourceProviders.paragraphTitle
          },

          {
            id: 'HtmlTitleAttributeEncodedUnquoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Encoded & Unquoted',
            title: 'Payload as Manually Encoded, But Unquoted HTML Title Attribute Value (<p title=...>)',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            htmlSourceProvider: this.htmlSourceProviders.paragraphTitleUnquoted
          },

          {
            id: 'HtmlTitleAttributeRawUnquoted',
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Unquoted',
            title: 'Payload as Raw and Unquoted HTML Title Attribute Value (<p title=...>)',
            htmlSourceProvider: this.htmlSourceProviders.paragraphTitleUnquoted
          },

          {
            id: 'DomTitleAttribute',
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM p.setAttribute(\'title\')',
            title: 'Payload as Title Attribute Value (DOM p.setAttribute(\'title\', ...))',
            domInjector: this.domInjectors.titleAttribute
          },

          {
            id: 'JQueryTitleAttribute',
            quality: PayloadOutputQuality.Recommended,
            name: '$(p).attr(\'title\')',
            title: 'Paylaod as Title Attribute ($(p).attr(\'title\', ...))',
            jQueryInjector: this.jQueryInjectors.titleAttribute
          },

          {
            id: 'NgTitleAttribute',
            quality: PayloadOutputQuality.Recommended,
            name: 'ng <p [title]>',
            title: 'Payload as Title Attribute (Angular <p [title]="...">)',
            templateComponentType: ParagraphTitleLiveOutputComponent
          },

          {
            id: 'NgTitleAttributeTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <p [title]> Trusted',
            title: 'Payload as Trusted Title Attribute (Angular <p [title]="..."> with DomSanitizer.bypassSecurityTrustHtml())',
            payloadProcessor: this.payloadProcessors.ngTrustAsHtml,
            templateComponentType: ParagraphTitleLiveOutputComponent
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
            payloadProcessor: this.payloadProcessors.urlValidate,
            domInjector: this.domInjectors.linkHref
          },

          {
            id: 'DomLinkHrefRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM a.href Raw',
            title: 'Payload as Raw Link-URL (DOM a.href = ...)',
            domInjector: this.domInjectors.linkHref
          },

          {
            id: 'JQueryLinkHrefValidated',
            quality: PayloadOutputQuality.Questionable,
            name: '$(a).attr(\'href\') URL-Validated',
            title: 'Payload as URL-Validated Link-URL (jQuery(a).attr(\'href\', ...))',
            payloadProcessor: this.payloadProcessors.urlValidate,
            jQueryInjector: this.jQueryInjectors.linkHref
          },

          {
            id: 'JQueryLinkHrefRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$(a).attr(\'href\') Raw',
            title: 'Payload as Raw Link-URL (jQuery(a).attr(\'href\', ...))',
            jQueryInjector: this.jQueryInjectors.linkHref
          },

          {
            id: 'NgLinkHrefSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <a [href]> Sanitized',
            title: 'Payload as Sanitized Link-URL (Angular <a [href]="...">)',
            templateComponentType: LinkUrlLiveOutputComponent
          },

          {
            id: 'NgLinkHrefTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'ng <a [href]> Trusted',
            title: 'Payload as Trusted Link-URL (Angular <a [href]="..."> with DomSanitizer.bypassSecurityTrustUrl())',
            payloadProcessor: this.payloadProcessors.ngTrustAsUrl,
            templateComponentType: LinkUrlLiveOutputComponent
          },

          {
            id: 'DomIframeSrcValidated',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM iframe.src URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (DOM iframe.src = ...)',
            payloadProcessor: this.payloadProcessors.urlValidate,
            domInjector: this.domInjectors.iframeSrc
          },

          {
            id: 'DomIframeSrcRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM iframe.src Raw',
            title: 'Payload as Raw IFrame-URL (DOM iframe.src = ...)',
            domInjector: this.domInjectors.iframeSrc
          },

          {
            id: 'JQueryIframeSrcValidated',
            quality: PayloadOutputQuality.Questionable,
            name: '$(iframe).attr(\'src\') URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (jQuery(iframe).attr(\'src\', ...))',
            payloadProcessor: this.payloadProcessors.urlValidate,
            jQueryInjector: this.jQueryInjectors.iframeSrc
          },

          {
            id: 'JQueryIframeSrcRaw',
            quality: PayloadOutputQuality.Insecure,
            name: '$(iframe).attr(\'src\') Raw',
            title: 'Payload as Raw IFrame-URL (jQuery(iframe).attr(\'src\', ...))',
            jQueryInjector: this.jQueryInjectors.iframeSrc
          },

          {
            id: 'NgIframeSrcSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <iframe [src]> Sanitized',
            title: 'Payload as Sanitized IFrame-URL (Angular <iframe [src]="...">)',
            templateComponentType: IframeUrlLiveOutputComponent
          },

          {
            id: 'NgIframeSrcTrusted',
            quality: PayloadOutputQuality.Insecure,
            name: 'ng <iframe [src]> Trusted',
            title: 'Payload as Trusted Resource IFrame-URL (Angular <iframe [src]="..."> with DomSanitizer.bypassSecurityTrustResourceUrl())',
            payloadProcessor: this.payloadProcessors.ngTrustAsResourceUrl,
            templateComponentType: IframeUrlLiveOutputComponent
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
            domInjector: this.domInjectors.trustedStyleBlock,
          },

          {
            id: 'DomStyleAttributeRaw',
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM div.setAttribute(\'style\') Raw',
            title: 'Payload as Style Attribute Value (DOM div.setAttribute(\'style\', ...))',
            domInjector: this.domInjectors.trustedStyleAttribute,
          },

          {
            id: 'NgStyleBlockSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <style [innerHTML]> Sanitized',
            title: 'Payload as Sanitized Style Block HTML (Angular <style [innerHTML]="...">)',
            templateComponentType: StyleBlockLiveOutputComponent
          },

          {
            id: 'NgStyleBlockTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <style [innerHTML]> Trusted',
            title: 'Payload as Trusted Style Block HTML (Angular <style [innerHTML]="..."> with DomSanitizer.bypassSecurityTrusStyle())',
            payloadProcessor: this.payloadProcessors.ngTrustAsStyle,
            templateComponentType: StyleBlockLiveOutputComponent
          },

          {
            id: 'NgStyleAttributeSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [style] Sanitized',
            title: 'Payload as Sanitized Style Attribute Value (Angular <div [style]="...">)',
            templateComponentType: StyleAttributeLiveOutputComponent
          },

          {
            id: 'NgStyleAttributeTrusted',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [style] Trusted',
            title: 'Payload as Trusted Style Attribute Value (Angular <div [style]="..."> with DomSanitizer.bypassSecurityTrustStyle()',
            payloadProcessor: this.payloadProcessors.ngTrustAsStyle,
            templateComponentType: StyleAttributeLiveOutputComponent
          },

          {
            id: 'NgStyleAttributePropertiesSanitized',
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [ngStyle] Sanitized',
            title: 'Payload as Sanitized Style Attribute Properties (Angular <div [ngStyle]="..."> with JSON.parse())',
            payloadProcessor: this.payloadProcessors.jsonParse,
            templateComponentType: StructuredStyleAttributeLiveOutputComponent
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
            payloadProcessor: this.payloadProcessors.jsEncode,
            domInjector: this.domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockStringLiteralDq',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block "string literal" Raw',
            title: 'Payload as Raw Content of a Double-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'"\' + ... + \'"\')',
            payloadProcessor: this.payloadProcessors.jsDoubleQuote,
            domInjector: this.domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockStringLiteralSq',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block \'string literal\' Raw',
            title: 'Payload as Raw Content of a Single-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'\\\'\' + ... + \'\\\'\')',
            payloadProcessor: this.payloadProcessors.jsSingleQuote,
            domInjector: this.domInjectors.trustedScriptBlock
          },

          {
            id: 'DomScriptBlockRaw',
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block Content Raw',
            title: 'Payload as Raw Content of a JavaScript Block (DOM script.textContent = ...)',
            domInjector: this.domInjectors.trustedScriptBlock
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
            domInjector: this.domInjectors.challengeDoubleTrouble
          },
          {
            id: 'WhatsLeft',
            quality: PayloadOutputQuality.Insecure,
            name: 'What\'s Left',
            title: 'What\'s Left Challenge',
            payloadProcessor: this.payloadProcessors.htmlChallengeStripTags,
            htmlSourceProvider: this.htmlSourceProviders.content
          },
          {
            id: 'LookMomNoParentheses',
            quality: PayloadOutputQuality.Insecure,
            name: 'Look mom! No parentheses!',
            title: 'Look mom! No parentheses! Challenge',
            payloadProcessor: this.payloadProcessors.jsChallengeLookMomNoParentheses,
            domInjector: this.domInjectors.trustedScriptBlock
          },
          {
            id: 'LikeLiterally',
            quality: PayloadOutputQuality.Insecure,
            name: 'Like Literally',
            title: 'Like Literally Challenge',
            payloadProcessor: this.payloadProcessors.jsChallengeLikeLiterally,
            domInjector: this.domInjectors.trustedScriptBlock
          },
          {
            id: 'TheGreatEscape',
            quality: PayloadOutputQuality.Insecure,
            name: 'The Great Escape',
            title: 'The Great Escape Challenge',
            payloadProcessor: this.payloadProcessors.jsChallengeTheGreatEscape,
            domInjector: this.domInjectors.trustedScriptBlock
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
