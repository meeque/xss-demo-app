
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, TemplateRef, model, inject, viewChild } from '@angular/core';
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

  private static nextComponentId = 0;
  protected readonly componentId = XssDemoComponent.nextComponentId++;

  private static readonly DEFAULT_XSS_MESSAGE = 'XSS has been triggered!';

  protected readonly PayloadOutputQuality = PayloadOutputQuality;


  private readonly payloadPresetService = inject(PayloadPresetService);
  private readonly payloadOutputService = inject(PayloadOutputService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly payload = model('');
  readonly activePayloadOutput = model<PayloadOutputDescriptor>();

  private readonly payloadOutputMenuItemTemplate = viewChild<TemplateRef<MenuItemContext>>('payloadOutputMenuItem');
  private readonly payloadOutputMenuTechnologyFiltersTemplate = viewChild<TemplateRef<MenuItemContext>>('payloadOutputMenuTechnologyFilters');
  private readonly payloadOutputMenuQualityFiltersTemplate = viewChild<TemplateRef<MenuItemContext>>('payloadOutputMenuQualityFilters');

  protected presetItems: MenuItem<PayloadPresetDescriptor>[];
  protected presetGroups: MenuGroup<XssContextCollection<PayloadPresetDescriptor>, PayloadPresetDescriptor>[];

  protected payloadOutputFilters: MenuItem<unknown>[] = [];
  protected payloadOutputGroups: MenuGroup<XssContextCollection<PayloadOutputDescriptor>, PayloadOutputDescriptor>[] = [];

  protected payloadOutputTechnologyFilters: string[] = [];
  protected payloadOutputQualityFilters: PayloadOutputQuality[] = [];

  protected xssTriggered = 0;
  protected xssMessage = XssDemoComponent.DEFAULT_XSS_MESSAGE;


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
    for (const context of this.payloadPresetService.descriptors) {
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
          template: this.payloadOutputMenuTechnologyFiltersTemplate()
        },
        {
          name: 'by quality:',
          value: [],
          select: () => false,
          template: this.payloadOutputMenuQualityFiltersTemplate()
        }
    ];

    this.payloadOutputGroups = [];
    for (const context of this.payloadOutputService.descriptors) {
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
          template: this.payloadOutputMenuItemTemplate()
        };
        group.items.push(item);
      }
      this.payloadOutputGroups.push(group);
    }
    this.changeDetector.detectChanges();
  }


  private selectPreset = (presetItem: MenuItem<PayloadPresetDescriptor>) => {
    this.loadPresetPayload(presetItem.value.url);
    return true;
  }

  private async loadPresetPayload(presetUrl: string) {
    this.payload.set(
      await this.payloadPresetService.loadPresetPayload(presetUrl)
    );
  }


  protected togglePayloadOutputTechnologyFilter(value: string) {
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

  protected togglePayloadOutputQualityFilter(value: PayloadOutputQuality) {
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

  private activateOutput(context: XssContext, output: string) {
    this.activePayloadOutput.set(
      this.payloadOutputService.outputDescriptorById(context, output)
    );
    return false;
  }


  protected doXss(message?: string) {
    this.xssMessage = message != undefined ? 'XSS: ' + message : XssDemoComponent.DEFAULT_XSS_MESSAGE;
    console.error(this.xssMessage);
    this.xssTriggered++;
    this.changeDetector.detectChanges();
  }

  protected resetXss() {
    if (this.xssTriggered > 0) {
      this.xssTriggered = 0;
      this.changeDetector.detectChanges();
    }
  }
}
