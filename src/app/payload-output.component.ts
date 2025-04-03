import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, Output, EventEmitter, EnvironmentInjector, ComponentRef, input, model, computed, effect, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { XssContext } from './xss-demo.common';
import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { StripExtraIndentPipe } from './strip-extra-indent.pipe';
import { AngularTemplateOutput, NonAngular } from './template-outputs/angular-template-output.components';

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

  outputContext = input<XssContext>();
  outputDescriptor = input<PayloadOutputDescriptor>();
  payload = input<any>('');

  liveSourceCode = '';
  autoUpdate = model(true);

  private lastOutputPayload = '';

  private readonly outputPayload: Signal<any>;

  showPayloadProcessor = true;
  showHtmlSourceProvider = true;
  showDomInjector = true;
  showJQueryInjector = true;
  showTemplateCode = true;
  showLiveSourceCode = true;

  @Output()
  change = new EventEmitter<void>();

  @ViewChild('output')
  outputContainer : ElementRef;

  @ViewChild('templateOutput', {read: ViewContainerRef})
  templateOutputContainer : ViewContainerRef;

  private _asyncChange = new EventEmitter(true);

  private _templateOutputComponent : ComponentRef<AngularTemplateOutput> = null;

  constructor(private readonly _environmentInjector : EnvironmentInjector) {

    this.outputPayload = computed<any>(
      () => {
        if (this.autoUpdate()) {
          const payloadProcessor = this.outputDescriptor()?.payloadProcessor;
          if (payloadProcessor) {
            this.lastOutputPayload = payloadProcessor(this.payload());
          } else {
            this.lastOutputPayload = this.payload();
          }
          this.change.emit();
          this._asyncChange.emit();
        }
        return this.lastOutputPayload;
      }
    );

    effect(
      () => {
        const outputPayload = this.outputPayload();
        if (this._templateOutputComponent) {
          this._templateOutputComponent.setInput('payload', outputPayload);
        }
      }
    );

    this._asyncChange.subscribe(
      () => {
        this.liveSourceCode = this.outputContainer.nativeElement.innerHTML;
      }
    );
  }

  ngAfterViewInit(): void {
    const templateComponentType = this.outputDescriptor().templateComponentType || NonAngular;
    this._templateOutputComponent = this.templateOutputContainer.createComponent(
      templateComponentType,
      { environmentInjector: this._environmentInjector }
    );
    this._templateOutputComponent.setInput('payload', this.outputPayload());
    this._templateOutputComponent.setInput('outputDescriptor', this.outputDescriptor());
  }

  update(): boolean {
    this.autoUpdate.set(true);
    this.outputPayload();
    this.autoUpdate.set(false);
    return false;
  }
}
