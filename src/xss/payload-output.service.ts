import { Injectable, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { XssContext, XssContextCollection } from './xss-demo.common';
import { LiveOutputType, EncodedLiveOutputComponent, TextContentLiveOutputComponent, InnerTextLiveOutputComponent, InnerHtmlLiveOutputComponent, ParagraphTitleLiveOutputComponent, LinkUrlLiveOutputComponent, IframeUrlLiveOutputComponent, StyleBlockLiveOutputComponent, StyleAttributeLiveOutputComponent, StructuredStyleAttributeLiveOutputComponent } from './live-output.component';
import { PayloadProcessors, HtmlSourceProviders, DomInjectors, JQueryInjectors } from './payload-output.functions';



export enum PayloadOutputTechnology {
  HTML = 'HTML',
  DOM = 'DOM',
  jQuery = 'jQuery',
  Angular = 'Angular',
}

export enum PayloadOutputQuality {
  Recommended = 'Recommended',
  Questionable = 'Questionable',
  Insecure = 'Insecure',
}



type PayloadProcessor = (payload: string) => unknown;

type HtmlSourceProvider = (payload: unknown) => string;

type Injector = (element: HTMLElement, payload: unknown) => void;



interface PayloadOutputDescriptorBase {
  readonly id: string
  readonly technology: PayloadOutputTechnology
  readonly quality: PayloadOutputQuality
  readonly name: string
  readonly title: string
  readonly payloadProcessor?: PayloadProcessor
}

interface HtmlPayloadOutputDescriptor extends PayloadOutputDescriptorBase {
  readonly technology: PayloadOutputTechnology.HTML
  readonly payloadEmitter: HtmlSourceProvider
}

interface DomPayloadOutputDescriptor extends PayloadOutputDescriptorBase {
  readonly technology: PayloadOutputTechnology.DOM
  readonly payloadEmitter: Injector
}

interface JQueryPayloadOutputDescriptor extends PayloadOutputDescriptorBase {
  readonly technology: PayloadOutputTechnology.jQuery
  readonly payloadEmitter: Injector
}

interface AngularPayloadOutputDescriptor extends PayloadOutputDescriptorBase {
  readonly technology: PayloadOutputTechnology.Angular
  readonly payloadEmitter: LiveOutputType
}

export type PayloadOutputDescriptor
  = HtmlPayloadOutputDescriptor
    | DomPayloadOutputDescriptor
    | JQueryPayloadOutputDescriptor
    | AngularPayloadOutputDescriptor;



@Injectable()
export class PayloadOutputService {
  private readonly payloadProcessors: PayloadProcessors;
  private readonly htmlSourceProviders: HtmlSourceProviders;
  private readonly domInjectors: DomInjectors;
  private readonly jQueryInjectors: JQueryInjectors;
  readonly descriptors: XssContextCollection<PayloadOutputDescriptor>[];


  constructor() {
    const domSanitizer = inject(DomSanitizer);

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
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML Encoded',
            title: 'Payload as Manually Encoded HTML Content',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            payloadEmitter: this.htmlSourceProviders.content,
          },
          {
            id: 'HtmlContentSanitizedDefault',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML Content (DOMPurify default policy)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyDefault,
            payloadEmitter: this.htmlSourceProviders.content,
          },
          {
            id: 'HtmlContentSanitizedMinimalInline',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML Content (DOMPurify minimal policy for inline markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyMinimalInline,
            payloadEmitter: this.htmlSourceProviders.content,
          },
          {
            id: 'HtmlContentSanitizedInlineBlockLinks',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Recommended,
            name: 'HTML Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML Content (DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyInlineBlockLinks,
            payloadEmitter: this.htmlSourceProviders.content,
          },
          {
            id: 'HtmlContentRaw',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML Raw',
            title: 'Payload as Raw HTML Content',
            payloadEmitter: this.htmlSourceProviders.content,
          },

          {
            id: 'DomTextContent',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .textContent',
            title: 'Payload as Text Content (DOM .textContent = ...)',
            payloadEmitter: this.domInjectors.textContent,
          },
          {
            id: 'DomInnerText',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerText',
            title: 'Payload as Inner Text (DOM .innerText = ...)',
            payloadEmitter: this.domInjectors.innerText,
          },
          {
            id: 'DomInnerHtmlEncoded',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM .innerHtml Encoded',
            title: 'Payload as Manually Encoded Inner HTML (DOM .innerHTML = ...)',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            payloadEmitter: this.domInjectors.innerHtml,
          },
          {
            id: 'DomInnerHtmlSanitizedDefault',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify default policy)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyDefault,
            payloadEmitter: this.domInjectors.innerHtml,
          },
          {
            id: 'DomInnerHtmlSanitizedMinimalInline',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyMinimalInline,
            payloadEmitter: this.domInjectors.innerHtml,
          },
          {
            id: 'DomInnerHTMLSanitizedInlineBlockLinks',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM .innerHtml Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized Inner HTML (DOM .innerHTML = ..., with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyInlineBlockLinks,
            payloadEmitter: this.domInjectors.innerHtml,
          },
          {
            id: 'DomInnerHtmlRaw',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML Raw',
            title: 'Payload as Raw HTML (DOM .innerHTML = ...)',
            payloadEmitter: this.domInjectors.innerHtml,
          },
          {
            id: 'DomInnerHtmlRawNoInsert',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM .innerHTML Raw (No Insert)',
            title: 'Payload as Raw HTML (DOM .innerHTML = ..., without insertion into the document)',
            payloadEmitter: this.domInjectors.innerHtmlNoOutput,
          },

          {
            id: 'JQueryText',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Recommended,
            name: '$().text()',
            title: 'Payload as Text (jQuery().text(...))',
            payloadEmitter: this.jQueryInjectors.text,
          },
          {
            id: 'JQueryHtmlSanitizedDefault',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify default)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify default policy)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyDefault,
            payloadEmitter: this.jQueryInjectors.html,
          },
          {
            id: 'JQueryHtmlSanitizedMinimalInline',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify minimal inline)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify minimal policy for inline markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyMinimalInline,
            payloadEmitter: this.jQueryInjectors.html,
          },
          {
            id: 'JQueryHtmlSanitizedInlineBlockLinks',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Recommended,
            name: '$().html() Sanitized (DOMPurify some inline, block, links)',
            title: 'Payload as Sanitized HTML (jQuery().html(...) with DOMPurify policy for some inline, block, and link markup)',
            payloadProcessor: this.payloadProcessors.htmlSanitizeDomPurifyInlineBlockLinks,
            payloadEmitter: this.jQueryInjectors.html,
          },
          {
            id: 'JQueryHtmlEncoded',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Encoded',
            title: 'Payload as Manually Encoded HTML (jQuery().html(...))',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            payloadEmitter: this.jQueryInjectors.html,
          },
          {
            id: 'JQueryConstructorEncoded',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Questionable,
            name: '$() Encoded',
            title: 'Payload as Manually Encoded HTML Through Constructor (jQuery(...))',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            payloadEmitter: this.jQueryInjectors.jQueryConstructor,
          },
          {
            id: 'JQueryHtmlTextNode',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Questionable,
            name: '$().html() Text Node',
            title: 'Payload as DOM Text Node (jQuery().html(...))',
            payloadProcessor: this.payloadProcessors.domTextNode,
            payloadEmitter: this.jQueryInjectors.html,
          },
          {
            id: 'JQueryConstructorTextNode',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Questionable,
            name: '$() Text Node',
            title: 'Payload as DOM Text Node Through Constructor (jQuery(...))',
            payloadProcessor: this.payloadProcessors.domTextNode,
            payloadEmitter: this.jQueryInjectors.jQueryConstructor,
          },
          {
            id: 'JQueryHtmlRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().html() Raw',
            title: 'Payload as Raw HTML (jQuery().html(...))',
            payloadEmitter: this.jQueryInjectors.html,
          },
          {
            id: 'JQueryConstructorRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$() Raw',
            title: 'Payload as Raw HTML Through Constructor (jQuery(...))',
            payloadEmitter: this.jQueryInjectors.jQueryConstructor,
          },
          {
            id: 'JQueryPrependRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().prepend() Raw',
            title: 'Payload Prepended as Raw HTML (jQuery().prepend(...))',
            payloadEmitter: this.jQueryInjectors.prepend,
          },
          {
            id: 'JQueryAppendRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().append() Raw',
            title: 'Payload as Raw HTML Appended (jQuery().append(...))',
            payloadEmitter: this.jQueryInjectors.append,
          },
          {
            id: 'JQueryBeforeRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().before() Raw',
            title: 'Payload as Raw HTML Inserted Before (jQuery().before(...))',
            payloadEmitter: this.jQueryInjectors.before,
          },
          {
            id: 'JQueryAfterRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().after() Raw',
            title: 'Payload as Raw HTML Inserted After (jQuery().after(...))',
            payloadEmitter: this.jQueryInjectors.after,
          },
          {
            id: 'JQueryWrapInnerRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().wrapInner() Raw',
            title: 'Payload as Raw HTML Wrapped Inside (jQuery().wrapInner(...))',
            payloadEmitter: this.jQueryInjectors.wrapInner,
          },
          {
            id: 'JQueryWrapRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().wrap() Raw',
            title: 'Payload as Raw HTML Wrapped Around (jQuery().wrap(...))',
            payloadEmitter: this.jQueryInjectors.wrap,
          },
          {
            id: 'JQueryReplaceWithRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$().replaceWith() Raw',
            title: 'Payload as Raw HTML Replacement (jQuery().replaceWith(...))',
            payloadEmitter: this.jQueryInjectors.replaceWith,
          },

          {
            id: 'NgTemplateInterpolation',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Recommended,
            name: 'ng {{...}}',
            title: 'Payload as HTML Content through Template Interpolation (Angular {{...}})',
            payloadEmitter: EncodedLiveOutputComponent,
          },
          {
            id: 'NgTextContent',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [textContent]',
            title: 'Payload as HTML Text-Content (Angular <div [textContent]="...">)',
            payloadEmitter: TextContentLiveOutputComponent,
          },
          {
            id: 'NgInnerText',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerText]',
            title: 'Payload as HTML Inner-Text (Angular <div [innerText]="...">)',
            payloadEmitter: InnerTextLiveOutputComponent,
          },
          {
            id: 'NgInnerHtmlSanitized',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Recommended,
            name: 'ng [innerHTML] Sanitized',
            title: 'Payload as Sanitized Inner-HTML (Angular <div [innerHTML]="...">)',
            payloadEmitter: InnerHtmlLiveOutputComponent,
          },
          {
            id: 'NgInnerHtmlTrusted',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Insecure,
            name: 'ng [innerHTML] Trusted',
            title: 'Payload as Trusted Inner-HTML (Angular <div [innerHTML]="..."> with DomSanitizer.bypassSecurityTrustHtml())',
            payloadProcessor: this.payloadProcessors.ngTrustAsHtml,
            payloadEmitter: InnerHtmlLiveOutputComponent,
          },
        ],
      },

      {
        context: XssContext.HtmlAttribute,
        name: 'HTML Attributes',
        items: [
          {
            id: 'HtmlTitleAttributeEncodedQuoted',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Questionable,
            name: 'HTML <p title> Encoded & Quoted',
            title: 'Payload as Manually Encoded and Quoted HTML Title Attribute Value (<p title="...">)',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            payloadEmitter: this.htmlSourceProviders.paragraphTitle,
          },
          {
            id: 'HtmlTitleAttributeRawQuoted',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Quoted',
            title: 'Payload as Raw, But Quoted HTML Title Attribute Value (<p title="...">)',
            payloadEmitter: this.htmlSourceProviders.paragraphTitle,
          },
          {
            id: 'HtmlTitleAttributeEncodedUnquoted',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Encoded & Unquoted',
            title: 'Payload as Manually Encoded, But Unquoted HTML Title Attribute Value (<p title=...>)',
            payloadProcessor: this.payloadProcessors.htmlEncode,
            payloadEmitter: this.htmlSourceProviders.paragraphTitleUnquoted,
          },
          {
            id: 'HtmlTitleAttributeRawUnquoted',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Insecure,
            name: 'HTML <p title> Raw & Unquoted',
            title: 'Payload as Raw and Unquoted HTML Title Attribute Value (<p title=...>)',
            payloadEmitter: this.htmlSourceProviders.paragraphTitleUnquoted,
          },
          {
            id: 'DomTitleAttribute',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Recommended,
            name: 'DOM p.setAttribute(\'title\')',
            title: 'Payload as Title Attribute Value (DOM p.setAttribute(\'title\', ...))',
            payloadEmitter: this.domInjectors.titleAttribute,
          },
          {
            id: 'JQueryTitleAttribute',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Recommended,
            name: '$(p).attr(\'title\')',
            title: 'Paylaod as Title Attribute ($(p).attr(\'title\', ...))',
            payloadEmitter: this.jQueryInjectors.titleAttribute,
          },
          {
            id: 'NgTitleAttribute',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Recommended,
            name: 'ng <p [title]>',
            title: 'Payload as Title Attribute (Angular <p [title]="...">)',
            payloadEmitter: ParagraphTitleLiveOutputComponent,
          },
          {
            id: 'NgTitleAttributeTrusted',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <p [title]> Trusted',
            title: 'Payload as Trusted Title Attribute (Angular <p [title]="..."> with DomSanitizer.bypassSecurityTrustHtml())',
            payloadProcessor: this.payloadProcessors.ngTrustAsHtml,
            payloadEmitter: ParagraphTitleLiveOutputComponent,
          },
        ],
      },

      {
        context: XssContext.Url,
        name: 'URLs',
        items: [
          {
            id: 'DomLinkHrefValidated',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM a.href URL-Validated',
            title: 'Payload as URL-Validated Link-URL (DOM a.href = ...)',
            payloadProcessor: this.payloadProcessors.urlValidate,
            payloadEmitter: this.domInjectors.linkHref,
          },
          {
            id: 'DomLinkHrefRaw',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM a.href Raw',
            title: 'Payload as Raw Link-URL (DOM a.href = ...)',
            payloadEmitter: this.domInjectors.linkHref,
          },
          {
            id: 'JQueryLinkHrefValidated',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Questionable,
            name: '$(a).attr(\'href\') URL-Validated',
            title: 'Payload as URL-Validated Link-URL (jQuery(a).attr(\'href\', ...))',
            payloadProcessor: this.payloadProcessors.urlValidate,
            payloadEmitter: this.jQueryInjectors.linkHref,
          },
          {
            id: 'JQueryLinkHrefRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$(a).attr(\'href\') Raw',
            title: 'Payload as Raw Link-URL (jQuery(a).attr(\'href\', ...))',
            payloadEmitter: this.jQueryInjectors.linkHref,
          },
          {
            id: 'NgLinkHrefSanitized',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <a [href]> Sanitized',
            title: 'Payload as Sanitized Link-URL (Angular <a [href]="...">)',
            payloadEmitter: LinkUrlLiveOutputComponent,
          },
          {
            id: 'NgLinkHrefTrusted',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Insecure,
            name: 'ng <a [href]> Trusted',
            title: 'Payload as Trusted Link-URL (Angular <a [href]="..."> with DomSanitizer.bypassSecurityTrustUrl())',
            payloadProcessor: this.payloadProcessors.ngTrustAsUrl,
            payloadEmitter: LinkUrlLiveOutputComponent,
          },
          {
            id: 'DomIframeSrcValidated',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM iframe.src URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (DOM iframe.src = ...)',
            payloadProcessor: this.payloadProcessors.urlValidate,
            payloadEmitter: this.domInjectors.iframeSrc,
          },
          {
            id: 'DomIframeSrcRaw',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM iframe.src Raw',
            title: 'Payload as Raw IFrame-URL (DOM iframe.src = ...)',
            payloadEmitter: this.domInjectors.iframeSrc,
          },
          {
            id: 'JQueryIframeSrcValidated',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Questionable,
            name: '$(iframe).attr(\'src\') URL-Validated',
            title: 'Payload as URL-Validated IFrame-URL (jQuery(iframe).attr(\'src\', ...))',
            payloadProcessor: this.payloadProcessors.urlValidate,
            payloadEmitter: this.jQueryInjectors.iframeSrc,
          },
          {
            id: 'JQueryIframeSrcRaw',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: '$(iframe).attr(\'src\') Raw',
            title: 'Payload as Raw IFrame-URL (jQuery(iframe).attr(\'src\', ...))',
            payloadEmitter: this.jQueryInjectors.iframeSrc,
          },
          {
            id: 'NgIframeSrcSanitized',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <iframe [src]> Sanitized',
            title: 'Payload as Sanitized IFrame-URL (Angular <iframe [src]="...">)',
            payloadEmitter: IframeUrlLiveOutputComponent,
          },
          {
            id: 'NgIframeSrcTrusted',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Insecure,
            name: 'ng <iframe [src]> Trusted',
            title: 'Payload as Trusted Resource IFrame-URL (Angular <iframe [src]="..."> with DomSanitizer.bypassSecurityTrustResourceUrl())',
            payloadProcessor: this.payloadProcessors.ngTrustAsResourceUrl,
            payloadEmitter: IframeUrlLiveOutputComponent,
          },
        ],
      },

      {
        context: XssContext.Css,
        name: 'CSS Styles',
        items: [
          {
            id: 'DomStyleBlockRaw',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM style.textContent Raw',
            title: 'Payload as Style Block Text-Content (DOM style.textContent = ...)',
            payloadEmitter: this.domInjectors.styleBlock,
          },
          {
            id: 'DomStyleAttributeRaw',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM div.setAttribute(\'style\') Raw',
            title: 'Payload as Style Attribute Value (DOM div.setAttribute(\'style\', ...))',
            payloadEmitter: this.domInjectors.styleAttribute,
          },
          {
            id: 'NgStyleBlockSanitized',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <style [innerHTML]> Sanitized',
            title: 'Payload as Sanitized Style Block HTML (Angular <style [innerHTML]="...">)',
            payloadEmitter: StyleBlockLiveOutputComponent,
          },
          {
            id: 'NgStyleBlockTrusted',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng <style [innerHTML]> Trusted',
            title: 'Payload as Trusted Style Block HTML (Angular <style [innerHTML]="..."> with DomSanitizer.bypassSecurityTrusStyle())',
            payloadProcessor: this.payloadProcessors.ngTrustAsStyle,
            payloadEmitter: StyleBlockLiveOutputComponent,
          },
          {
            id: 'NgStyleAttributeSanitized',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [style] Sanitized',
            title: 'Payload as Sanitized Style Attribute Value (Angular <div [style]="...">)',
            payloadEmitter: StyleAttributeLiveOutputComponent,
          },
          {
            id: 'NgStyleAttributeTrusted',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [style] Trusted',
            title: 'Payload as Trusted Style Attribute Value (Angular <div [style]="..."> with DomSanitizer.bypassSecurityTrustStyle()',
            payloadProcessor: this.payloadProcessors.ngTrustAsStyle,
            payloadEmitter: StyleAttributeLiveOutputComponent,
          },
          {
            id: 'NgStyleAttributePropertiesSanitized',
            technology: PayloadOutputTechnology.Angular,
            quality: PayloadOutputQuality.Questionable,
            name: 'ng [ngStyle] Sanitized',
            title: 'Payload as Sanitized Style Attribute Properties (Angular <div [ngStyle]="..."> with JSON.parse())',
            payloadProcessor: this.payloadProcessors.jsonParse,
            payloadEmitter: StructuredStyleAttributeLiveOutputComponent,
          },
        ],
      },

      {
        context: XssContext.JavaScript,
        name: 'JavaScript',
        items: [
          {
            id: 'DomScriptBlockValueEncoded',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Questionable,
            name: 'DOM <script>-Block Expression Encoded',
            title: 'Payload as JavaScript-Encoded Expression in a JavaScript Block (DOM script.textContent = ..., with JSON.stringify())',
            payloadProcessor: this.payloadProcessors.jsEncode,
            payloadEmitter: this.domInjectors.scriptBlock,
          },
          {
            id: 'DomScriptBlockStringLiteralDq',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block "string literal" Raw',
            title: 'Payload as Raw Content of a Double-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'"\' + ... + \'"\')',
            payloadProcessor: this.payloadProcessors.jsDoubleQuote,
            payloadEmitter: this.domInjectors.scriptBlock,
          },
          {
            id: 'DomScriptBlockStringLiteralSq',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block \'string literal\' Raw',
            title: 'Payload as Raw Content of a Single-Quoted String Literal in a JavaScript Block (DOM script.textContent = \'\\\'\' + ... + \'\\\'\')',
            payloadProcessor: this.payloadProcessors.jsSingleQuote,
            payloadEmitter: this.domInjectors.scriptBlock,
          },
          {
            id: 'DomScriptBlockRaw',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'DOM <script>-Block Content Raw',
            title: 'Payload as Raw Content of a JavaScript Block (DOM script.textContent = ...)',
            payloadEmitter: this.domInjectors.scriptBlock,
          },
        ],
      },

      {
        context: null,
        name: 'Challenges',
        items: [
          {
            id: 'DoubleTrouble',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'Double Trouble',
            title: 'Double Trouble Challenge',
            payloadEmitter: this.domInjectors.challengeDoubleTrouble,
          },
          {
            id: 'WhatsLeft',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Insecure,
            name: 'What\'s Left',
            title: 'What\'s Left Challenge',
            payloadProcessor: this.payloadProcessors.htmlChallengeStripTags,
            payloadEmitter: this.htmlSourceProviders.content,
          },
          {
            id: 'LookMomNoParentheses',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'Look mom! No parentheses!',
            title: 'Look mom! No parentheses! Challenge',
            payloadProcessor: this.payloadProcessors.jsChallengeLookMomNoParentheses,
            payloadEmitter: this.domInjectors.scriptBlock,
          },
          {
            id: 'LikeLiterally',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'Like Literally',
            title: 'Like Literally Challenge',
            payloadProcessor: this.payloadProcessors.jsChallengeLikeLiterally,
            payloadEmitter: this.domInjectors.scriptBlock,
          },
          {
            id: 'TheGreatEscape',
            technology: PayloadOutputTechnology.DOM,
            quality: PayloadOutputQuality.Insecure,
            name: 'The Great Escape',
            title: 'The Great Escape Challenge',
            payloadProcessor: this.payloadProcessors.jsChallengeTheGreatEscape,
            payloadEmitter: this.domInjectors.scriptBlock,
          },
          {
            id: 'OutOfSpace',
            technology: PayloadOutputTechnology.HTML,
            quality: PayloadOutputQuality.Insecure,
            name: 'Out of Space',
            title: 'Out of Space Challenge',
            payloadProcessor: this.payloadProcessors.htmlChallengeOutOfSpace,
            payloadEmitter: this.htmlSourceProviders.content,
          },
          {
            id: 'RewindSelecta',
            technology: PayloadOutputTechnology.jQuery,
            quality: PayloadOutputQuality.Insecure,
            name: 'Rewind Selecta',
            title: 'Rewind Selecta Challenge',
            payloadEmitter: this.jQueryInjectors.jQueryConstructor,
          },
        ],
      },
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
