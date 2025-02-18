import { NgIf, NgClass } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';

@Component({
    selector: 'payload-output',
    templateUrl: './payload-output.component.html',
    styleUrls: ['./payload-output.component.css'],
    standalone: true,
    imports: [NgIf, NgClass, FormsModule]
})
export class PayloadOutputComponent<T> {

  static nextComponentId : number = 0;

  componentId : number = PayloadOutputComponent.nextComponentId++;

  readonly PayloadOutputQuality = PayloadOutputQuality;

  @ViewChild('output')
  outputContent : ElementRef;

  @Input()
  outputDescriptor : PayloadOutputDescriptor;

  liveCode : string = '';

  @Input()
  showPayloadProcessor : boolean = true;

  @Input()
  showHtmlSourceProvider : boolean = true;

  @Input()
  showDomInjector : boolean = true;

  @Input()
  showJQueryInjector : boolean = true;

  @Input()
  showTemplateCode : boolean = true;

  @Input()
  showLiveCode : boolean = true;

  @Output()
  change : EventEmitter<void> = new EventEmitter();

  private _asyncChange = new EventEmitter(true);

  private _autoUpdate : boolean = true;

  private _inputPayload : any = '';

  private _outputPayload : any = null;

  constructor() {
    this._asyncChange.subscribe(
      () => {
        if (this.outputContent) {
          let outputElement = this.outputContent.nativeElement;
          if (this.outputDescriptor.htmlSourceProvider) {
            try {
              outputElement.innerHTML = this.outputDescriptor.htmlSourceProvider(this._outputPayload);
            } catch (err) {
              console.error(err);
            }
          }
          else if (this.outputDescriptor.domInjector) {
            outputElement.textContent = '';
            try {
              this.outputDescriptor.domInjector(outputElement, this._outputPayload);
            } catch (err) {
              console.error(err);
            }
          }
          else if (this.outputDescriptor.jQueryInjector) {
            outputElement.textContent = '';
            try {
              this.outputDescriptor.jQueryInjector(outputElement, this._outputPayload);
            } catch (err) {
              console.error(err);
            }
          }
          this.liveCode = outputElement.innerHTML;
        }
      });
  }

  @Input()
  set autoUpdate(autoUpdate : boolean) {
    this._autoUpdate = autoUpdate;
    if (autoUpdate) {
      this.update();
    }
  }

  get autoUpdate() : boolean {
    return this._autoUpdate;
  }

  @Input()
  set payload(payload : any)
  {
    this._inputPayload = payload;
    if (this.autoUpdate)
    {
      this.update();
    }
  }

  get payload() : any {
    return this._outputPayload;
  }

  update() {
    if (this.outputDescriptor?.payloadProcessor) {
      this._outputPayload = this.outputDescriptor.payloadProcessor(this._inputPayload);
    } else {
      this._outputPayload = this._inputPayload;
    }
    this.change.emit();
    this._asyncChange.emit();
    return false;
  }
}
