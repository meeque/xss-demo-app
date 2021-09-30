import {
  Injectable
} from '@angular/core';
import {
  DomSanitizer
} from '@angular/platform-browser';

declare var DOMPurify: any;

export enum PayloadOutputContext {
  HtmlContent = 'HtmlContent',
  HtmlAttribute = 'HtmlAttribute',
  Url = 'Url',
  Css = 'Css',
  JavaScript = 'JavaScript'
}


export const enum PayloadOutputQuality {
  Recommended = 'Recommended',
  Questionable = 'Questionable',
  Insecure = 'Insecure'
}


interface PayloadProcessor<T> {
  (payload : string) : T;
}


interface HtmlSourceProvider<T> {
  (payload : T) : string;
}


interface DomInjector<T> {
  (element : any, payload : T) : void;
}


export interface PayloadOutputDescriptor<T> {
  readonly id : string;
  readonly quality : PayloadOutputQuality;
  readonly name : string;
  readonly title : string;
  readonly payloadProcessor? : PayloadProcessor<T>;
  readonly htmlSourceProvider? : HtmlSourceProvider<T>;
  readonly domInjector? : DomInjector<T>;
  readonly templateCode? : string;
}

export interface ContextDescriptor {
  readonly id : PayloadOutputContext;
  readonly name : string;
  payloadOutputs : PayloadOutputDescriptor<any>[];
}


@Injectable()
export class PayloadOutputService {

  private readonly _processors : { [prop: string] : PayloadProcessor<any> } =
  {
    ngTrustedHtml : (payload) => {
      return this.sanitizer.bypassSecurityTrustHtml(payload);
    },

    ngTrustedUrl : (payload) => {
      return this.sanitizer.bypassSecurityTrustUrl(payload);
    },

    ngTrustedResourceUrl : (payload) => {
      return this.sanitizer.bypassSecurityTrustResourceUrl(payload);
    },

    ngTrustedStyle : (payload) => {
      return this.sanitizer.bypassSecurityTrustStyle(payload);
    },

    htmlEncoding(payload) {
      return payload
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
    },

    htmlSanitizingDomPurify(payload) {
      return DOMPurify.sanitize(payload);
    },

    htmlSanitizingDomPurifyMinimalInline(payload) {
      return DOMPurify.sanitize(
        payload,
        {
          ALLOWED_TAGS: ['span', 'em', 'strong'],
          ALLOWED_ATTR: ['class']
        });
    },

    htmlSanitizingDomPurifyInlineBlockLinks(payload) {
      return DOMPurify.sanitize(
        payload,
        {
          ALLOWED_TAGS: ['span', 'em', 'strong', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
          ALLOWED_ATTR: ['class', 'href', 'target']
        });
    },

    urlValidation(payload) {
      try {
        var url = new URL(payload, document.baseURI);
      } catch(e) {
        return '';
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        return '';
      }
      return payload;
    },

    jsonParsing(payload) {
      try {
        return JSON.parse(payload);
      } catch (e) {
        console.warn('Expected JSON as payload, but failed to parse it!')
        return {};
      }
    },

    jsEncoding(payload) {
      return 'var outputElement = document.createElement(\'div\');\n'
          + 'outputElement.textContent = ' + JSON.stringify(payload) + ';\n'
          + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
    },

    jsDoubleQuoting(payload) {
      return 'var outputElement = document.createElement(\'div\');\n'
          + 'outputElement.textContent = "' + payload + '";\n'
          + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
    },

    jsSingleQuoting(payload) {
      return 'var outputElement = document.createElement(\'div\');\n'
          + 'outputElement.textContent = \'' + payload + '\';\n'
          + 'document.currentScript.insertAdjacentElement(\'afterend\', outputElement);';
    }
  };

  private readonly _providers : { [prop : string] : HtmlSourceProvider<any> } =
  {
    raw(payload) {
      return payload;
    },

    paragraphTitle(payload) {
      return '<p title="' + payload + '">This paragraph has a title.</p>';
    },

    unquotedParagraphTitle(payload) {
      return '<p title=' + payload + '>This paragraph has a title.</p>';
    }
  };

  private readonly _injectors : { [prop : string] : DomInjector<any> } =
  {
    textContent(element, payload) {
      element.textContent = payload;
    },

    innerText(element, payload) {
      element.innerText = payload;
    },

    innerHtml(element, payload) {
      element.innerHTML = payload;
    },

    innerHtmlNoOutput(element, payload) {
      document.createElement('div').innerHTML = payload;
    },

    titleAttribute(element, payload) {
      let paragraph = document.createElement('p');
      paragraph.textContent = 'This paragraph has a title.'
      paragraph.title = payload;
      element.insertAdjacentElement('beforeend', paragraph);
    },

    trustedUrlLinkHref(element, payload) {
      let link = document.createElement('a');
      link.textContent = 'Click here to test your payload as a URL!'
      link.href = payload;
      element.insertAdjacentElement('beforeend', link);
    },

    trustedUrlIframeSrc(element, payload) {
      let iframe = document.createElement('iframe');
      iframe.src = payload;
      element.insertAdjacentElement('beforeend', iframe);
    },

    trustedStyleBlock(element, payload) {
      let styleBlock = document.createElement('style');
      styleBlock.setAttribute('type', 'text/css');
      styleBlock.textContent = payload;
      element.insertAdjacentElement('beforeend', styleBlock);
    },

    trustedStyleAttribute(element, payload) {
      let styledElement = document.createElement('div');
      styledElement.textContent = 'Element with custom style';
      styledElement.setAttribute('style', payload);
      element.insertAdjacentElement('beforeend', styledElement);
    },

    trustedScriptBlock(element, payload) {
      let scriptBlock = document.createElement('script');
      scriptBlock.setAttribute('type', 'text/javascript');
      scriptBlock.textContent = '\n' + payload + '\n';
      element.insertAdjacentElement('beforeend', scriptBlock);
    }
  };

  readonly descriptors : ContextDescriptor[] =
  [

    {
      id : PayloadOutputContext.HtmlContent,
      name: 'HTML Content',
      payloadOutputs : [

        {
          id : 'HtmlEncodedContent',
          quality : PayloadOutputQuality.Questionable,
          name : 'Encoded HTML',
          title : 'Payload as Manually Encoded HTML',
          payloadProcessor: this._processors.htmlEncoding,
          htmlSourceProvider : this._providers.raw
        },

        {
          id : 'HtmlSanitizedContent',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized HTML (DOMPurify)',
          title : 'Payload as Sanitized HTML (DOMPurify default policy)',
          payloadProcessor: this._processors.htmlSanitizingDomPurify,
          htmlSourceProvider : this._providers.raw
        },

        {
          id : 'HtmlSanitizedContentMinimalInline',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized HTML (DOMPurify minimal inline)',
          title : 'Payload as Sanitized HTML (DOMPurify minimal policy for inline markup)',
          payloadProcessor: this._processors.htmlSanitizingDomPurifyMinimalInline,
          htmlSourceProvider : this._providers.raw
        },

        {
          id : 'HtmlSanitizedContentInlineBlockLinks',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized HTML (DOMPurify some inline, block, links)',
          title : 'Payload as Sanitized HTML (DOMPurify policy for some inline, block, and link markup)',
          payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
          htmlSourceProvider : this._providers.raw
        },

        {
          id : 'HtmlContent',
          quality : PayloadOutputQuality.Insecure,
          name : 'Raw HTML',
          title : 'Payload as Raw HTML',
          htmlSourceProvider : this._providers.raw
        },

        {
          id : 'DomTextContent',
          quality : PayloadOutputQuality.Recommended,
          name : 'DOM .textContent',
          title : 'Payload as HTML Text Content (DOM .textContent)',
          domInjector : this._injectors.textContent
        },

        {
          id : 'DomInnerText',
          quality : PayloadOutputQuality.Recommended,
          name : 'DOM .innerText',
          title : 'Payload as HTML Inner Text (DOM .innerText)',
          domInjector : this._injectors.innerText
        },

        {
          id : 'DomEncodedInnerHtml',
          quality : PayloadOutputQuality.Questionable,
          name : 'Encoded DOM .innerHtml',
          title : 'Payload HTML Manually Encoded (DOM .innerHTML)',
          payloadProcessor : this._processors.htmlEncoding,
          domInjector : this._injectors.innerHtml
        },

        {
          id : 'DomSanitizedInnerHtml',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized DOM .innerHtml (DOMPurify)',
          title : 'Payload HTML Sanitized (DOMPurify default policy & DOM .innerHTML)',
          payloadProcessor : this._processors.htmlSanitizingDomPurify,
          domInjector : this._injectors.innerHtml
        },

        {
          id : 'DomSanitizedInnerHtmlMinimalInline',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized DOM .innerHtml (DOMPurify minimal inline)',
          title : 'Payload HTML Sanitized (DOMPurify minimal policy for inline markup & DOM .innerHTML)',
          payloadProcessor : this._processors.htmlSanitizingDomPurifyMinimalInline,
          domInjector : this._injectors.innerHtml
        },

        {
          id : 'DomSanitizedContentInlineBlockLinks',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized DOM .innerHtml (DOMPurify some inline, block, links)',
          title : 'Payload HTML Sanitized (DOMPurify policy for some inline, block, and link markup & DOM .innerHTML)',
          payloadProcessor: this._processors.htmlSanitizingDomPurifyInlineBlockLinks,
          domInjector : this._injectors.innerHtml
        },

        {
          id : 'DomInnerHtml',
          quality : PayloadOutputQuality.Insecure,
          name : 'DOM .innerHTML',
          title : 'Payload HTML Raw (DOM .innerHTML)',
          domInjector : this._injectors.innerHtml
        },

        {
          id : 'DomInnerHtmlNoOutput',
          quality : PayloadOutputQuality.Insecure,
          name : 'DOM .innerHTML (no output)',
          title : 'Payload HTML Unencoded (DOM .innerHTML, without modifying the document)',
          domInjector : this._injectors.innerHtmlNoOutput
        },

        {
          id : 'NgEncodedTemplate',
          quality : PayloadOutputQuality.Recommended,
          name : 'ng {{ template }}',
          title : 'Payload HTML Encoded (Angular {{ template }})',
          templateCode : '{{ payload }}'
        },

        {
          id : 'NgEncodedTextContent',
          quality : PayloadOutputQuality.Recommended,
          name : 'ng [textContent]',
          title : 'Payload as HTML Text Content (Angular [textContent])',
          templateCode : '<div [textContent]="payload"></div>'
        },

        {
          id : 'NgEncodedInnerText',
          quality : PayloadOutputQuality.Recommended,
          name : 'ng [innerText]',
          title : 'Payload as HTML Inner Text (Angular [innerText])',
          templateCode : '<div [innerText]="payload"></div>'
        },

        {
          id : 'NgSanitized',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized ng [innerHTML]',
          title : 'Payload HTML Sanitized (Angular [innerHTML])',
          templateCode : '<div [innerHTML]="payload"></div>'
        },

        {
          id : 'NgTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted ng [innerHTML]',
          title : 'Payload HTML Trusted (Angular [innerHTML] and DomSanitizer.bypassSecurityTrustHtml())',
          payloadProcessor: this._processors.ngTrustedHtml,
          templateCode : '<div [innerHTML]="payload"></div>'
        }
      ]
    },

    {
      id : PayloadOutputContext.HtmlAttribute,
      name: 'HTML Attributes',
      payloadOutputs : [

        {
          id : 'HtmlEncodedAttribute',
          quality : PayloadOutputQuality.Questionable,
          name : 'HTML paragraph title encoded',
          title : 'Payload as Manually Encoded HTML Attribute (<p title="">)',
          payloadProcessor: this._processors.htmlEncoding,
          htmlSourceProvider : this._providers.paragraphTitle
        },

        {
          id : 'HtmlAttribute',
          quality : PayloadOutputQuality.Insecure,
          name : 'HTML paragraph title',
          title : 'Payload as HTML Attribute (<p title="">)',
          htmlSourceProvider : this._providers.paragraphTitle
        },

        {
          id : 'HtmlEncodedUnquotedAttribute',
          quality : PayloadOutputQuality.Insecure,
          name : 'HTML paragraph title encoded, unquoted',
          title : 'Payload as Manually Encoded, Unquoted HTML Attribute (<p title=>)',
          payloadProcessor: this._processors.htmlEncoding,
          htmlSourceProvider : this._providers.unquotedParagraphTitle
        },

        {
          id : 'DomHtmlUnquotedAttribute',
          quality : PayloadOutputQuality.Insecure,
          name : 'HTML paragraph title unquoted',
          title : 'Payload as Unquoted HTML Attribute (<p title=>)',
          htmlSourceProvider : this._providers.unquotedParagraphTitle
        },

        {
          id : 'DomAttributeValue',
          quality : PayloadOutputQuality.Recommended,
          name : 'DOM paragraph .title',
          title : 'Payload as HTML Attribute (DOM p.title)',
          domInjector : this._injectors.titleAttribute
        },

        {
          id : 'NgEncodedAttributeValue',
          quality : PayloadOutputQuality.Recommended,
          name : 'ng p [title]',
          title : 'Payload as HTML Attribute (Angular Paragraph [title])',
          templateCode : '<p [title]="payload">This paragraph has a title.</p>'
        },

        {
          id : 'NgTrustedAttributeValue',
          quality : PayloadOutputQuality.Questionable,
          name : 'Trusted ng p [title]',
          title : 'Payload as HTML Attribute (Angular Paragraph [title])',
          payloadProcessor: this._processors.ngTrustedHtml,
          templateCode : '<p [title]="payload">This paragraph has a title.</p>'
        }
      ]
    },

    {
      id : PayloadOutputContext.Url,
      name: 'URLs',
      payloadOutputs : [

        {
          id : 'LinkDomValidated',
          quality : PayloadOutputQuality.Recommended,
          name : 'URL-validated DOM a.href',
          title : 'Payload URL Validated (DOM a.href)',
          payloadProcessor: this._processors.urlValidation,
          domInjector : this._injectors.trustedUrlLinkHref
        },

        {
          id : 'LinkDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'DOM a.href',
          title : 'Payload URL Raw (DOM a.href)',
          domInjector : this._injectors.trustedUrlLinkHref
        },

        {
          id : 'LinkNgSanitized',
          quality : PayloadOutputQuality.Recommended,
          name : 'Sanitized ng a [href]',
          title : 'Payload URL Sanitized (Angular a [href])',
          templateCode : '<a [href]="payload">Click here to test your payload as a URL!</a>'
        },

        {
          id : 'LinkNgTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted ng a [href]',
          title : 'Payload URL Trusted!!! (Angular a [href] and DomSanitizer.bypassSecurityTrustUrl())',
          payloadProcessor: this._processors.ngTrustedUrl,
          templateCode : '<a [href]="payload">Click here to test your payload as a URL!</a>'
        },

        {
          id : 'IframeDomValidated',
          quality : PayloadOutputQuality.Recommended,
          name : 'URL-validated DOM iframe.src ',
          title : 'Payload URL Validated (DOM iframe.src)',
          payloadProcessor: this._processors.urlValidation,
          domInjector : this._injectors.trustedUrlIframeSrc
        },

        {
          id : 'IframeDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'DOM iframe.src',
          title : 'Payload URL Raw (DOM iframe.src)',
          domInjector : this._injectors.trustedUrlIframeSrc
        },

        {
          id : 'IframeNgSanitized',
          quality : PayloadOutputQuality.Questionable,
          name : 'Sanitized ng iframe [src]',
          title : 'Payload URL Sanitized (Angular iframe [src])',
          templateCode : '<iframe [src]="payload"></iframe>'
        },

        {
          id : 'IframeNgTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted ng iframe [src]',
          title : 'Payload URL Trusted! (Angular iframe [src] and DomSanitizer.bypassSecurityTrustUrl())',
          payloadProcessor: this._processors.ngTrustedResourceUrl,
          templateCode : '<iframe [src]="payload"></iframe>'
        }
      ]
    },

    {
      id : PayloadOutputContext.Css,
      name: 'CSS Styles',
      payloadOutputs : [

        {
          id : 'BlockDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Style Block DOM .textContent',
          title : 'Payload CSS Raw (Style Block with DOM .textContent)',
          domInjector : this._injectors.trustedStyleBlock,
        },

        {
          id : 'AttributeDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Style Attribute DOM .style',
          title : 'Payload CSS Raw (Style Attribute with DOM .style)',
          domInjector : this._injectors.trustedStyleAttribute,
        },

        {
          id : 'BlockNgSanitized',
          quality : PayloadOutputQuality.Questionable,
          name : 'Sanitized Style Block ng [innerHTML]',
          title : 'Payload CSS Sanitized (Style block with Angular [innerHTML])',
          templateCode : '<style type="text/css" [innerHTML]="payload"></style>'
        },

        {
          id : 'BlockNgTrusted',
          quality : PayloadOutputQuality.Questionable,
          name : 'Trusted Style Block ng [innerHTML]',
          title : 'Payload CSS Trusted (Style block with Angular [innerHTML] and DomSanitizer.bypassSecurityTrustCss())',
          payloadProcessor: this._processors.ngTrustedStyle,
          templateCode : '<style type="text/css" [innerHTML]="payload"></style>'
        },

        {
          id : 'AttributeNgSanitized',
          quality : PayloadOutputQuality.Questionable,
          name : 'Sanitized Style Attribute ng [style]',
          title : 'Payload CSS Sanitized (Style attribute with Angular [style])',
          templateCode : '<div [style]="payload">Element with custom style</div>'
        },

        {
          id : 'AttributeNgTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted Style Attribute ng [style]',
          title : 'Payload CSS Trusted (Style attribute with Angular [style] and DomSanitizer.bypassSecurityTrustStyle()',
          payloadProcessor: this._processors.ngTrustedStyle,
          templateCode : '<div [style]="payload">Element with custom style</div>'
        },

        {
          id : 'AttributeNgStructured',
          quality : PayloadOutputQuality.Insecure,
          name : 'Structured Style Attribute ng [ngStyle]',
          title : 'Payload CSS Sanitized (Style attribute with Angular [ngStyle] and JSON data)',
          payloadProcessor: this._processors.jsonParsing,
          templateCode : '<div [ngStyle]="payload">Element with custom style</div>'
        }
      ]
    },

    {
      id : PayloadOutputContext.JavaScript,
      name: 'JavaScript',
      payloadOutputs : [

        {
          id : 'ValueDomEncoded',
          quality : PayloadOutputQuality.Questionable,
          name : 'Encoded JS value',
          title : 'Payload JavaScript Encoded (JSON encoding and DOM .textContent)',
          payloadProcessor: this._processors.jsEncoding,
          domInjector : this._injectors.trustedScriptBlock
        },

        {
          id : 'DqStringDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted JS "string"',
          title : 'Payload JavaScript Trusted (JS "string" and DOM .textContent)',
          payloadProcessor: this._processors.jsDoubleQuoting,
          domInjector : this._injectors.trustedScriptBlock
        },

        {
          id : 'SqStringDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted JS \'string\'',
          title : 'Payload JavaScript Trusted (JS \'string\' and DOM .textContent)',
          payloadProcessor: this._processors.jsSingleQuoting,
          domInjector : this._injectors.trustedScriptBlock
        },

        {
          id : 'BlockDomTrusted',
          quality : PayloadOutputQuality.Insecure,
          name : 'Trusted JavaScript Block',
          title : 'Payload JavaScript Trusted (Script Block with DOM .textContent)',
          domInjector : this._injectors.trustedScriptBlock
        }
      ]
    }
  ];

  contextDescriptorById(contextId : PayloadOutputContext) : ContextDescriptor {
    for (const context of this.descriptors) {
      if (context.id == contextId) {
        return context;
      }
    }
    return null;
  }

  outputDescriptorById(contextId : PayloadOutputContext, outputId : string) : PayloadOutputDescriptor<any> {
    const context = this.contextDescriptorById(contextId);
    if (context) {
      for (const output of context.payloadOutputs) {
        if (output.id == outputId) {
          return output;
        }
      }
    }
    return null;
  }

  constructor(
      private readonly sanitizer: DomSanitizer ) {
  }
}
