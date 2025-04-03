import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, Input, Output, EventEmitter, EnvironmentInjector, ComponentRef, signal, Signal, model, effect } from '@angular/core';
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

  @ViewChild('output')
  outputContainer : ElementRef;

  @ViewChild('templateOutput', {read: ViewContainerRef})
  templateOutputContainer : ViewContainerRef;

  @Input()
  outputContext : XssContext;

  @Input()
  outputDescriptor : PayloadOutputDescriptor;

  liveSourceCode : string = '';

  showPayloadProcessor : boolean = true;
  showHtmlSourceProvider : boolean = true;
  showDomInjector : boolean = true;
  showJQueryInjector : boolean = true;
  showTemplateCode : boolean = true;
  showLiveSourceCode : boolean = true;

  @Output()
  change : EventEmitter<void> = new EventEmitter();

  private _asyncChange = new EventEmitter(true);

  private _templateOutputComponent : ComponentRef<AngularTemplateOutput> = null;

  private _autoUpdate : boolean = true;

  private _inputPayload : any = '';

  private readonly outputPayload = signal<any>(null);

  constructor(private readonly _environmentInjector : EnvironmentInjector) {
    this._asyncChange.subscribe(
      () => {
        this.liveSourceCode = this.outputContainer.nativeElement.innerHTML;
      });

    effect(() => {
      const outputPayload = this.outputPayload();
      if (this._templateOutputComponent) {
        this._templateOutputComponent.setInput('payload', outputPayload);
      }
    });
  }

  ngAfterViewInit() {
    const templateComponentType = this.outputDescriptor.templateComponentType || NonAngular;
    this._templateOutputComponent = this.templateOutputContainer.createComponent(
      templateComponentType,
      { environmentInjector: this._environmentInjector }
    );
    this._templateOutputComponent.setInput('payload', this.outputPayload());
    this._templateOutputComponent.setInput('outputDescriptor', this.outputDescriptor);
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
    return this._inputPayload();
  }

  update() {
    if (this.outputDescriptor?.payloadProcessor) {
      this.outputPayload.set(this.outputDescriptor.payloadProcessor(this._inputPayload));
    } else {
      this.outputPayload.set(this._inputPayload);
    }
    this.change.emit();
    this._asyncChange.emit();
    return false;
  }
}
