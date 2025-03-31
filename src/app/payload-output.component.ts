import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ViewContainerRef, Input, Output, EventEmitter, EnvironmentInjector, ComponentRef, afterRender } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { XssContext } from './xss-demo.common';
import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { StripExtraIndentPipe } from './strip-extra-indent.pipe';
import { AngularTemplateOutput, AngularTemplateOutputType, NonAngular } from './template-outputs/angular-template-output.components';

@Component({
    selector: 'payload-output',
    templateUrl: './payload-output.component.html',
    styleUrls: ['./payload-output.component.css'],
    standalone: true,
    imports: [NgIf, NgClass, FormsModule, StripExtraIndentPipe]
})
export class PayloadOutputComponent implements AfterViewInit {

  static nextComponentId : number = 0;

  componentId : number = PayloadOutputComponent.nextComponentId++;

  readonly XssContext = XssContext;

  readonly PayloadOutputQuality = PayloadOutputQuality;

  @ViewChild('outputView', {read: ViewContainerRef})
  outputViewContainer : ViewContainerRef;

  @ViewChild('outputSource', {read: ViewContainerRef})
  outputSourceContainer : ViewContainerRef;

  @Input()
  outputContext : XssContext;

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

  private _outputComponent : ComponentRef<AngularTemplateOutput> = null;

  private _autoUpdate : boolean = true;

  private _inputPayload : any = '';

  private _outputPayload : any = null;

  constructor(private readonly _environmentInjector : EnvironmentInjector) {
    this._asyncChange.subscribe(
      () => {
        this._outputComponent?.setInput('payload', this.payload);
      });
  }

  ngAfterViewInit() {
    const outputComponentType: AngularTemplateOutputType = this.outputDescriptor.templateComponentType || NonAngular;
    this._outputComponent = this.outputViewContainer.createComponent(
      outputComponentType,
      { environmentInjector: this._environmentInjector }
    );
    this._outputComponent.setInput('outputDescriptor', this.outputDescriptor);
    this._outputComponent.instance.change.subscribe((source) => {
      this.liveCode = source;
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
