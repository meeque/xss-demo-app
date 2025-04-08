import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, Output, EventEmitter, EnvironmentInjector, ComponentRef, Signal, signal, input, model, computed, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';
import { XssContext } from './xss-demo.common';
import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { LiveOutput, NonAngular } from './live-output.component';

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

  outputDescriptor = input<PayloadOutputDescriptor>();
  payload = input<any>('');

  autoUpdate = model(true);
  private lastOutputPayload = '';
  private readonly outputPayload: Signal<any>;
  liveSourceCode = signal('');

  showPayloadProcessor = true;
  showHtmlSourceProvider = true;
  showDomInjector = true;
  showJQueryInjector = true;
  showTemplateCode = true;
  showLiveSourceCode = true;

  @Output()
  change = new EventEmitter<void>(true);

  @ViewChild('liveOutputElement')
  private _liveOutputElement : ElementRef;

  @ViewChild('liveOutputViewContainer', {read: ViewContainerRef})
  private _liveOutputViewContainer : ViewContainerRef;

  private _liveOutputComponent : ComponentRef<LiveOutput> = null;

  constructor(private readonly _environmentInjector : EnvironmentInjector) {

    effect(
      () => {
        const outputDescriptor = this.outputDescriptor();
        untracked(() => this.switchLiveOutput(outputDescriptor));
      }
    );

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
        }
        return this.lastOutputPayload;
      }
    );

    effect(
      () => {
        const outputPayload = this.outputPayload();
        if (this._liveOutputComponent) {
          this._liveOutputComponent.setInput('outputPayload', outputPayload);
        }
      }
    );

    this.change.subscribe(
      () => {
        this.liveSourceCode.set(
          this._liveOutputElement.nativeElement.querySelector('*').innerHTML
        );
      }
    );
  }

  ngAfterViewInit(): void {
    this.switchLiveOutput(this.outputDescriptor());
  }

  switchLiveOutput(outputDescriptor: PayloadOutputDescriptor): void {
    if (this._liveOutputViewContainer) {
      this._liveOutputViewContainer.clear();
      const liveOutputComponentType = outputDescriptor.templateComponentType || NonAngular;
      this._liveOutputComponent = this._liveOutputViewContainer.createComponent(
        liveOutputComponentType,
        {
          index: 0,
          environmentInjector: this._environmentInjector,
        }
      );
      this._liveOutputComponent.setInput('outputDescriptor', this.outputDescriptor());
      this._liveOutputComponent.setInput('outputPayload', this.outputPayload());
      if (!this.autoUpdate()) {
        this.update();
      }
    }
  }

  update(): boolean {
    this.autoUpdate.set(true);
    this.outputPayload();
    this.autoUpdate.set(false);
    return false;
  }
}
