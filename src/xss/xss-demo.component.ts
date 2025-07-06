
import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, TemplateRef, model, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MenuItem, MenuGroup, MenuItemContext, ComboboxInputComponent } from '../lib/combobox-input.component';
import { XssContext, XssContextCollection } from './xss-demo.common';
import { PayloadPresetService, PayloadPresetDescriptor } from './payload-preset.service';
import { PayloadOutputService, PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';

@Component({
    selector: 'xss-demo-root',
    templateUrl: './xss-demo.component.html',
    styleUrls: ['./xss-demo.component.css'],
    standalone: true,
    imports: [FormsModule, ComboboxInputComponent, PayloadOutputComponent]
})
export class XssDemoComponent implements OnInit, AfterViewInit {
  private readonly _payloadPresetService = inject(PayloadPresetService);
  private readonly _payloadOutputService = inject(PayloadOutputService);
  private readonly _changeDetector = inject(ChangeDetectorRef);


  static readonly DEFAULT_XSS_MESSAGE = 'XSS has been triggered!'

  static nextComponentId = 0;
  componentId = XssDemoComponent.nextComponentId++;

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

  payload = model('');
  activePayloadOutput = model<PayloadOutputDescriptor>();

  payloadOutputFilters: MenuItem<unknown>[] = [];

  payloadOutputGroups: MenuGroup<XssContextCollection<PayloadOutputDescriptor>, PayloadOutputDescriptor>[] = [];

  xssTriggered = 0;
  xssMessage = XssDemoComponent.DEFAULT_XSS_MESSAGE;

  payloadOutputTechnologyFilters: string[] = [];

  payloadOutputQualityFilters: PayloadOutputQuality[] = [];

  constructor() {
    this.activateOutput(XssContext.HtmlContent, 'HtmlContentEncoded');
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
      if (group.value.context == null) {
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
          select: () => false,
          template: this.payloadOutputMenuTechnologyFiltersTemplate
        },
        {
          name: 'by quality:',
          value: [],
          select: () => false,
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
          select: () => this.activateOutput(context.context, payloadOutput.id),
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
    this.payload.set(
      await this._payloadPresetService.loadPresetPayload(presetUrl)
    );
  }

  activateOutput(context: XssContext, output: string) {
    this.activePayloadOutput.set(
      this._payloadOutputService.outputDescriptorById(context, output)
    );
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

  doXss(message?: string) {
    this.xssMessage = message != undefined ? 'XSS: ' + message : XssDemoComponent.DEFAULT_XSS_MESSAGE;
    console.error(this.xssMessage);
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
