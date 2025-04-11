import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { XssContext, XssContextCollection } from './xss-demo.common';



export interface PayloadPresetDescriptor {
  readonly name: string;
  readonly url: string;
}



@Injectable()
export class PayloadPresetService {

  readonly descriptors: XssContextCollection<PayloadPresetDescriptor>[] =
  [
    {
      id: null,
      name: null,
      items: [
        {
        name: 'Introduction',
        url: 'assets/presets/intro.txt',
        }
      ]
    },

    {
      id: XssContext.HtmlContent,
      name: 'HTML Content',
      items: [
        {
          name: 'Script tag',
          url: 'assets/presets/html/script-tag.txt'
        },
        {
          name: 'IFrame src',
          url: 'assets/presets/html/iframe-src.txt'
        },
        {
          name: 'IFrame content',
          url: 'assets/presets/html/iframe-content.txt'
        },
        {
          name: 'IFrame content (sandboxed)',
          url: 'assets/presets/html/iframe-content-sandboxed.txt'
        },
        {
          name: 'Image src',
          url: 'assets/presets/html/img-src.txt'
        },
        {
          name: 'Image onerror',
          url: 'assets/presets/html/img-onerror.txt'
        },
        {
          name: 'Image onerror (legacy flavors)',
          url: 'assets/presets/html/img-onerror-legacy.txt'
        },
        {
            name: 'A link href',
            url: 'assets/presets/html/a-href.txt',
        },
        {
            name: 'A link target content',
            url: 'assets/presets/html/a-target-content.txt',
        },
        {
            name: 'Input field onfocus',
            url: 'assets/presets/html/input-onfocus.txt'
        },
        {
            name: 'Div onmouseenter',
            url: 'assets/presets/html/div-onmouseenter.txt'
        },
        {
          name: 'SVG onload',
          url: 'assets/presets/html/svg-onload.txt'
        },
        {
          name: 'Style block',
          url: 'assets/presets/html/style-block.txt'
        },
        {
          name: 'Style attribute',
          url: 'assets/presets/html/style-attr.txt'
        },
        {
            name: 'Mixed HTML Content',
            url: 'assets/presets/html/mixed-content.txt'
          }
      ]
    },
    {
      id: XssContext.HtmlAttribute,
      name: 'HTML Attributes',
      items: [
        {
          name: 'IFrame src',
          url: 'assets/presets/html-attr/iframe-src.txt'
        },
        {
          name: 'Image src',
          url: 'assets/presets/html-attr/img-src.txt'
        },
        {
          name: 'Image onerror',
          url: 'assets/presets/html-attr/img-onerror.txt'
        },
        {
          name: 'SVG onload',
          url: 'assets/presets/html-attr/svg-onload.txt'
        },
        {
          name: 'onload attribute',
          url: 'assets/presets/html-attr/onload-attr.txt'
        },
        {
          name: 'onload attribute (unquoted)',
          url: 'assets/presets/html-attr/onload-attr-unquoted.txt'
        },
        {
          name: 'onmouseenter attribute',
          url: 'assets/presets/html-attr/onmouseenter-attr.txt'
        },
        {
          name: 'onmouseenter attribute (unquoted)',
          url: 'assets/presets/html-attr/onmouseenter-attr-unquoted.txt'
        },
        {
          name: 'style attribute',
          url: 'assets/presets/html-attr/style-attr.txt'
        }
      ]
    },
    {
      id: XssContext.Url,
      name: 'URLs',
      items: [
        {
          name: 'javascript URL',
          url: 'assets/presets/url/script-url.txt'
        },
        {
          name: 'javascript URL (for parent)',
          url: 'assets/presets/url/script-url-parent.txt'
        }
      ]
    },
    {
      id: XssContext.Css,
      name: 'CSS Styles',
      items: [
        {
          name: 'ruleset with javascript URL',
          url: 'assets/presets/css/background-js-ruleset.txt'
        },
        {
          name: 'declarations with javascript URL',
          url: 'assets/presets/css/background-js-declarations.txt'
        },
        {
          name: 'declarations for Jester logo background',
          url: 'assets/presets/css/background-jester-logo.txt'
        },
        {
          name: 'declarations for Jester logo background (JSON-encoded Angular\'s ngStyle)',
          url: 'assets/presets/css/background-jester-logo-json.txt'
        }
      ]
    },
    {
      id: XssContext.JavaScript,
      name: 'JavaScript',
      items: [
        {
          name: 'pure JS code',
          url: 'assets/presets/js/pure.txt'
        },
        {
          name: 'pure JS code for parent and opener',
          url: 'assets/presets/js/js-for-parent-and-opener.txt'
        },
        {
          name: 'JS code breaking "string"',
          url: 'assets/presets/js/break-double-quotes.txt'
        },
        {
          name: 'JS code breaking \'string\'',
          url: 'assets/presets/js/break-single-quotes.txt'
        },
        {
          name: 'JS attack on a plain HTML page (iframe)',
          url: 'assets/presets/js/attack-plain-html-mock-in-frame.txt'
        },
        {
          name: 'JS attack on a plain HTML page (window)',
          url: 'assets/presets/js/attack-plain-html-mock-in-tlbc.txt'
        },
        {
          name: 'JS attack on browser storage (iframe)',
          url: 'assets/presets/js/attack-storage-in-frame.txt'
        },
        {
          name: 'JS attack on browser storage (window)',
          url: 'assets/presets/js/attack-storage-in-tlbc.txt'
        },
        {
          name: 'JS attack on cookies (iframe)',
          url: 'assets/presets/js/attack-cookies-in-frame.txt'
        },
        {
          name: 'JS attack on cookies (window)',
          url: 'assets/presets/js/attack-cookies-in-tlbc.txt'
        },
        {
          name: 'JSFuck',
          url: 'assets/presets/js/jsfuck.txt'
        },
        {
          name: 'pure JS defacement attack',
          url: 'assets/presets/js/defacement.txt'
        }
      ]
    }
  ]

  constructor(private readonly _http: HttpClient) {
  }

  loadPresetPayload(presetUrl: string): Promise<string> {
    const { promise, resolve } = (Promise as any).withResolvers();

    this._http
      .get(
        presetUrl,
        {responseType: 'text'}
      )
      .subscribe(
        (presetPayload: string) => {
          console.log("Loaded preset payload from " + presetUrl);
          resolve(presetPayload);
        });

    return promise;
  }
}
