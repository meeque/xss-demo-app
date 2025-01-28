import { NgIf, NgFor, NgStyle } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { MenuItem, MenuGroup, MenuItemContext, ComboboxInputComponent } from './combobox-input.component';
import { PayloadOutputService, PayloadOutputContext, ContextDescriptor, PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';


@Component({
    selector: 'xss-demo-root',
    templateUrl: './xss-demo.component.html',
    styleUrls: ['./xss-demo.component.css'],
    standalone: true,
    imports: [ComboboxInputComponent, FormsModule, NgIf, NgFor, PayloadOutputComponent, NgStyle]
})
export class XssDemoComponent implements OnInit, AfterViewInit {

  static nextComponentId : number = 0;

  componentId : number = XssDemoComponent.nextComponentId++;

  payloadOutputContexts : typeof PayloadOutputContext = PayloadOutputContext;

  @ViewChild('payloadOutputMenuItem')
  payloadOutputMenuItemTemplate : TemplateRef<MenuItemContext>;

  @ViewChild('payloadOutputMenuTechnologyFilters')
  payloadOutputMenuTechnologyFiltersTemplate : TemplateRef<MenuItemContext>;

  @ViewChild('payloadOutputMenuQualityFilters')
  payloadOutputMenuQualityFiltersTemplate : TemplateRef<MenuItemContext>;

  private selectPreset = (presetItem : MenuItem<string>) => {
    this.loadPresetPayload(presetItem.value);
    return false;
  }

  private payloadOutputMenuItemFilter = (item : MenuItem<PayloadOutputDescriptor<any>>, query : string) => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    if (this.payloadOutputTechnologyFilters.length > 0 && !this.payloadOutputTechnologyFilters.some(technology => item.value[technology])) {
      return false;
    }
    if (this.payloadOutputQualityFilters.length > 0 && !this.payloadOutputQualityFilters.includes(item.value.quality)) {
      return false;
    }
    return true;
  }

  presetItems : MenuItem<String>[] = [
    {
      name : 'Introduction',
      value : 'assets/presets/intro.txt',
      select : this.selectPreset
    }
  ];

  presetGroups : MenuGroup<PayloadOutputContext, string>[] = [
    {
      name: 'HTML Content',
      value: PayloadOutputContext.HtmlContent,
      items: [
        {
          name : 'Script tag',
          value : 'assets/presets/html/script-tag.txt',
          select : this.selectPreset
        },
        {
          name : 'IFrame src',
          value : 'assets/presets/html/iframe-src.txt',
          select : this.selectPreset
        },
        {
          name : 'Image src',
          value : 'assets/presets/html/img-src.txt',
          select : this.selectPreset
        },
        {
          name : 'Image onerror',
          value : 'assets/presets/html/img-onerror.txt',
          select : this.selectPreset
        },
        {
          name : 'Image onerror (legacy flavors)',
          value : 'assets/presets/html/img-onerror-legacy.txt',
          select : this.selectPreset
        },
        {
          name : 'Image onerror (SAP Commerce mini-cart credit card attack)',
          value : 'assets/presets/html/commerce-minicart-cc-attack.txt',
          select : this.selectPreset
        },
        {
            name : 'A link href',
            value : 'assets/presets/html/a-href.txt',
            select : this.selectPreset
        },
        {
            name : 'Input field onfocus',
            value : 'assets/presets/html/input-onfocus.txt',
            select : this.selectPreset
        },
        {
            name : 'Div onmouseenter',
            value : 'assets/presets/html/div-onmouseenter.txt',
            select : this.selectPreset
        },
        {
          name : 'SVG onload',
          value : 'assets/presets/html/svg-onload.txt',
          select : this.selectPreset
        },
        {
          name : 'Style block',
          value : 'assets/presets/html/style-block.txt',
          select : this.selectPreset
        },
        {
          name : 'Style attribute',
          value : 'assets/presets/html/style-attr.txt',
          select : this.selectPreset
        },
        {
            name : 'Mixed HTML Content',
            value : 'assets/presets/html/mixed-content.txt',
            select : this.selectPreset
          }
      ]
    },
    {
      name: 'HTML Attribute Values',
      value: PayloadOutputContext.HtmlAttribute,
      items: [
        {
          name : 'IFrame src',
          value : 'assets/presets/html-attr/iframe-src.txt',
          select : this.selectPreset
        },
        {
          name : 'Image src',
          value : 'assets/presets/html-attr/img-src.txt',
          select : this.selectPreset
        },
        {
          name : 'Image onerror',
          value : 'assets/presets/html-attr/img-onerror.txt',
          select : this.selectPreset
        },
        {
          name : 'SVG onload',
          value : 'assets/presets/html-attr/svg-onload.txt',
          select : this.selectPreset
        },
        {
          name : 'onload attribute',
          value : 'assets/presets/html-attr/onload-attr.txt',
          select : this.selectPreset
        },
        {
          name : 'onload attribute (unquoted)',
          value : 'assets/presets/html-attr/onload-attr-unquoted.txt',
          select : this.selectPreset
        },
        {
          name : 'onmouseenter attribute',
          value : 'assets/presets/html-attr/onmouseenter-attr.txt',
          select : this.selectPreset
        },
        {
          name : 'onmouseenter attribute (unquoted)',
          value : 'assets/presets/html-attr/onmouseenter-attr-unquoted.txt',
          select : this.selectPreset
        },
        {
          name : 'style attribute',
          value : 'assets/presets/html-attr/style-attr.txt',
          select : this.selectPreset
        }
      ]
    },
    {
      name: 'URL',
      value: PayloadOutputContext.Url,
      items: [
        {
          name : 'javascript URL',
          value : 'assets/presets/url/script-url.txt',
          select : this.selectPreset
        }
      ]
    },
    {
      name: 'CSS',
      value: PayloadOutputContext.Css,
      items: [
        {
          name : 'ruleset with javascript URL',
          value : 'assets/presets/css/background-js-ruleset.txt',
          select : this.selectPreset
        },
        {
          name : 'declarations with javascript URL',
          value : 'assets/presets/css/background-js-declarations.txt',
          select : this.selectPreset
        }
      ]
    },
    {
      name: 'JavaScript',
      value: PayloadOutputContext.JavaScript,
      items: [
        {
          name : 'pure JS code',
          value : 'assets/presets/js/pure.txt',
          select : this.selectPreset
        },
        {
          name : 'pure JS defacement attack',
          value : 'assets/presets/js/defacement.txt',
          select : this.selectPreset
        },
        {
          name : 'JS code breaking "string"',
          value : 'assets/presets/js/break-double-quotes.txt',
          select : this.selectPreset
        },
        {
          name : 'JS code breaking \'string\'',
          value : 'assets/presets/js/break-single-quotes.txt',
          select : this.selectPreset
        },
        {
          name : 'JS attack on a plain HTML page in an iframe',
          value : 'assets/presets/js/attack-plain-html-mock-in-frame.txt',
          select : this.selectPreset
        },
        {
          name : 'JS attack on a plain HTML page in a new top-level browsing context',
          value : 'assets/presets/js/attack-plain-html-mock-in-tlbc.txt',
          select : this.selectPreset
        },
        {
          name : 'JS attack on browser storage with an iframe',
          value : 'assets/presets/js/attack-storage-in-frame.txt',
          select : this.selectPreset
        },
        {
          name : 'JS attack on browser storage with a new top-level browsing context',
          value : 'assets/presets/js/attack-storage-in-tlbc.txt',
          select : this.selectPreset
        },
        {
          name : 'JS attack on cookies with an iframe',
          value : 'assets/presets/js/attack-cookies-in-frame.txt',
          select : this.selectPreset
        },
        {
          name : 'JS attack on cookies with a new top-level browsing context',
          value : 'assets/presets/js/attack-cookies-in-tlbc.txt',
          select : this.selectPreset
        },
      ]
    }
  ];

  payload : string = '';

  payloadOutputFilters : MenuItem<any>[] = [];

  payloadOutputGroups : MenuGroup<ContextDescriptor, PayloadOutputDescriptor<any>>[] = [];

  xssTriggered : number = 0;

  payloadOutputTechnologyFilters : string[] = [];

  payloadOutputQualityFilters : string[] = [];

  private _activeContext : string = 'HtmlContent';

  private _activeOutput : string = 'HtmlEncodedContent';

  constructor(
      private readonly _payloadOutputService : PayloadOutputService,
      private readonly _changeDetector: ChangeDetectorRef,
      private readonly _http: HttpClient) {
  }

  ngOnInit() {
    window['xss'] = this.doXss.bind(this);
    this.loadPresetPayload('assets/presets/intro.txt');
  }

  ngAfterViewInit() {
    this.payloadOutputFilters = [
        {
          name : 'by technology:',
          value : [],
          select : () => { return false },
          template : this.payloadOutputMenuTechnologyFiltersTemplate
        },
        {
          name : 'by quality:',
          value : [],
          select : () => { return false },
          template : this.payloadOutputMenuQualityFiltersTemplate
        }
    ];

    this.payloadOutputGroups = [];
    for (const context of this._payloadOutputService.descriptors) {
      const group : MenuGroup<ContextDescriptor, PayloadOutputDescriptor<any>> = {
        name : context.name,
        value : context,
        items : []
      };
      for (const payloadOutput of context.payloadOutputs) {
        const item : MenuItem<PayloadOutputDescriptor<any>> = {
          name : payloadOutput.name,
          value : payloadOutput,
          select : (item : MenuItem<PayloadOutputDescriptor<any>>, $event? : any) => {
            return this.activateOutput(context.id, payloadOutput.id);
          },
          filter : this.payloadOutputMenuItemFilter,
          template : this.payloadOutputMenuItemTemplate
        };
        group.items.push(item);
      }
      this.payloadOutputGroups.push(group);
    }
    this._changeDetector.detectChanges();
  }

  get payloadOutputService() {
    return this._payloadOutputService;
  }

  loadPresetPayload(presetUrl: string) {
    this._http.get(
        presetUrl,
        {responseType: 'text'})
      .subscribe(
        (presetPayload: string) => {
          console.log("Loaded preset payload from " + presetUrl);
          this.payload = presetPayload;
        });
  }

  isActiveOutput(context : string, output : string) {
    return (context == this._activeContext) && (output == this._activeOutput);
  }

  activateOutput(context : string, output : string) {
    this._activeContext = context;
    this._activeOutput = output;
    return false;
  }

  togglePayloadOutputTechnologyFilter(value : string) {
    const newFilters = [];
    for (const currentValue of this.payloadOutputTechnologyFilters) {
      if (currentValue != value) {
        newFilters.push(currentValue);
      }
    }
    if (newFilters.length == this.payloadOutputTechnologyFilters.length) {
        newFilters.push(value);
      }
    this.payloadOutputTechnologyFilters = newFilters;
  }

  togglePayloadOutputQualityFilter(value : string) {
    const newFilters = [];
    for (const currentValue of this.payloadOutputQualityFilters) {
      if (currentValue != value) {
        newFilters.push(currentValue);
      }
    }
    if (newFilters.length == this.payloadOutputQualityFilters.length) {
      newFilters.push(value);
    }
    this.payloadOutputQualityFilters = newFilters;
  }

  doXss() {
    console.error("XSS has been triggered!");
    this.xssTriggered++;
    this._changeDetector.detectChanges();
  }

  resetXss() {
    if (this.xssTriggered > 0) {
      this.xssTriggered = 0;
      this._changeDetector.detectChanges();
    }
  }
}
