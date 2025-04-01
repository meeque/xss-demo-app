import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, Input, Output, EventEmitter, EnvironmentInjector, ComponentRef, signal, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { XssContext } from './xss-demo.common';
import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { StripExtraIndentPipe } from './strip-extra-indent.pipe';
import { AngularTemplateOutput, AngularTemplateOutputType } from './template-outputs/angular-template-output.components';

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

  private _templateOutputComponent : ComponentRef<AngularTemplateOutput> = null;

  private _autoUpdate : boolean = true;

  private _inputPayload : any = '';

  private readonly _outputPayload = signal(null);

  constructor(private readonly _environmentInjector : EnvironmentInjector) {
    this._asyncChange.subscribe(
      () => {
        let outputElement = this.outputContainer.nativeElement;
        if (this.outputDescriptor.htmlSourceProvider) {
          try {
            outputElement.innerHTML = this.outputDescriptor.htmlSourceProvider(this._outputPayload());
          } catch (err) {
            console.error(err);
          }
        }
        else if (this.outputDescriptor.domInjector) {
          outputElement.textContent = '';
          try {
            this.outputDescriptor.domInjector(outputElement, this._outputPayload());
          } catch (err) {
            console.error(err);
          }
        }
        else if (this.outputDescriptor.jQueryInjector) {
          outputElement.textContent = '';
          try {
            this.outputDescriptor.jQueryInjector(outputElement, this._outputPayload());
          } catch (err) {
            console.error(err);
          }
        }
        this.liveCode = outputElement.innerHTML;
      });
  }

  ngAfterViewInit() {
    const templateComponentType = this.outputDescriptor.templateComponentType;
    if (templateComponentType) {
      this._templateOutputComponent = this.templateOutputContainer.createComponent(
        templateComponentType,
        { environmentInjector: this._environmentInjector }
      );
      const templateOutputComponent = this._templateOutputComponent.instance;
      templateOutputComponent.payload = this._outputPayload.asReadonly();
      templateOutputComponent.outputDescriptor = this.outputDescriptor;
    }
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

  get payload() : Signal<any> {
    return this._outputPayload();
  }

  update() {
    if (this.outputDescriptor?.payloadProcessor) {
      this._outputPayload.set(this.outputDescriptor.payloadProcessor(this._inputPayload));
    } else {
      this._outputPayload.set(this._inputPayload);
    }
    this.change.emit();
    this._asyncChange.emit();
    return false;
  }
}
