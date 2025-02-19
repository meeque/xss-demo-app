import { NgIf, NgFor, NgStyle } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MenuItem, MenuGroup, MenuItemContext, ComboboxInputComponent } from './combobox-input.component';
import { XssContext, XssContextCollection } from './xss-demo.common';
import { PayloadPresetService, PayloadPresetDescriptor } from './payload-preset.service';
import { PayloadOutputService, PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';


@Component({
    selector: 'xss-demo-root',
    templateUrl: './xss-demo.component.html',
    styleUrls: ['./xss-demo.component.css'],
    standalone: true,
    imports: [ComboboxInputComponent, FormsModule, NgIf, NgFor, PayloadOutputComponent, NgStyle]
})
export class XssDemoComponent implements OnInit, AfterViewInit {

  static nextComponentId: number = 0;

  componentId: number = XssDemoComponent.nextComponentId++;

  readonly XssContext = XssContext;

  readonly PayloadOutputQuality = PayloadOutputQuality;

  @ViewChild('payloadOutputMenuItem')
  payloadOutputMenuItemTemplate: TemplateRef<MenuItemContext>;

  @ViewChild('payloadOutputMenuTechnologyFilters')
  payloadOutputMenuTechnologyFiltersTemplate: TemplateRef<MenuItemContext>;

  @ViewChild('payloadOutputMenuQualityFilters')
  payloadOutputMenuQualityFiltersTemplate: TemplateRef<MenuItemContext>;

  private selectPreset = (presetItem: MenuItem<PayloadPresetDescriptor>) => {
    this.loadPresetPayload(presetItem.value.url);
    return true;
  }

  private payloadOutputMenuItemFilter = (item: MenuItem<PayloadOutputDescriptor>, query: string) => {
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

  presetItems: MenuItem<PayloadPresetDescriptor>[];

  presetGroups: MenuGroup<XssContextCollection<PayloadPresetDescriptor>, PayloadPresetDescriptor>[];

  payload: string = '';

  payloadOutputFilters: MenuItem<any>[] = [];

  payloadOutputGroups: MenuGroup<XssContextCollection<PayloadOutputDescriptor>, PayloadOutputDescriptor>[] = [];

  xssTriggered: number = 0;

  payloadOutputTechnologyFilters: string[] = [];

  payloadOutputQualityFilters: PayloadOutputQuality[] = [];

  private _activeContext: XssContext = XssContext.HtmlContent;

  private _activeOutput: string = 'HtmlEncodedContent';

  constructor(
    private readonly _payloadPresetService: PayloadPresetService,
    private readonly _payloadOutputService: PayloadOutputService,
    private readonly _changeDetector: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    window['xss'] = this.doXss.bind(this);
    this.loadPresetPayload('assets/presets/intro.txt');
  }

  ngAfterViewInit() {
    this.presetItems = [];
    this.presetGroups = [];
    for (const context of this._payloadPresetService.descriptors) {
      const group: MenuGroup<XssContextCollection<PayloadPresetDescriptor>, PayloadPresetDescriptor> = {
        name: context.name,
        value: context,
        items: []
      };
      const items: MenuItem<PayloadPresetDescriptor>[] = [];
      for (const payloadPreset of context.items) {
        const item: MenuItem<PayloadPresetDescriptor> = {
          name: payloadPreset.name,
          value: payloadPreset,
          select: this.selectPreset
        };
        items.push(item);
      }
      if (group.value.id == null) {
        this.presetItems = items;
      } else {
        group.items = items;
        this.presetGroups.push(group);
      }
    }

    this.payloadOutputFilters = [
        {
          name: 'by technology:',
          value: [],
          select: () => { return false },
          template: this.payloadOutputMenuTechnologyFiltersTemplate
        },
        {
          name: 'by quality:',
          value: [],
          select: () => { return false },
          template: this.payloadOutputMenuQualityFiltersTemplate
        }
    ];

    this.payloadOutputGroups = [];
    for (const context of this._payloadOutputService.descriptors) {
      const group: MenuGroup<XssContextCollection<PayloadOutputDescriptor>, PayloadOutputDescriptor> = {
        name: context.name,
        value: context,
        items: []
      };
      for (const payloadOutput of context.items) {
        const item: MenuItem<PayloadOutputDescriptor> = {
          name: payloadOutput.name,
          value: payloadOutput,
          select: (item: MenuItem<PayloadOutputDescriptor>) => {
            return this.activateOutput(context.id, payloadOutput.id);
          },
          filter: this.payloadOutputMenuItemFilter,
          template: this.payloadOutputMenuItemTemplate
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

  async loadPresetPayload(presetUrl: string) {
    this.payload = await this._payloadPresetService.loadPresetPayload(presetUrl);
  }

  isActiveOutput(context: XssContext, output: string) {
    return (context == this._activeContext) && (output == this._activeOutput);
  }

  activateOutput(context: XssContext, output: string) {
    this._activeContext = context;
    this._activeOutput = output;
    return false;
  }

  togglePayloadOutputTechnologyFilter(value: string) {
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

  togglePayloadOutputQualityFilter(value: PayloadOutputQuality) {
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
