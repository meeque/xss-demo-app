import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, Output, EventEmitter, EnvironmentInjector, ComponentRef, signal, input, model, effect, untracked } from '@angular/core';
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

  readonly autoUpdate = model(true);
  private lastOutputPayload = '';
  private readonly outputPayload = signal('' as any);
  readonly liveSourceCode = signal('');

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

  _liveOutputComponent : ComponentRef<LiveOutput> = null;

  constructor(private readonly _environmentInjector : EnvironmentInjector) {

    effect(
      () => {
        const outputDescriptor = this.outputDescriptor();
        untracked(() => this.switchLiveOutput(outputDescriptor));
      }
    );

    effect(
      () => this.updateOutputPayload()
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

  private processPayload(): any {
    const payloadProcessor = this.outputDescriptor()?.payloadProcessor;
    if (payloadProcessor) {
      return payloadProcessor(this.payload());
    }
    return this.payload();
  }

  private switchLiveOutput(outputDescriptor: PayloadOutputDescriptor): void {
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
        this.updateNow();
      }
    }
  }

  private updateOutputPayload(force?: boolean): void {
    if (force === true || this.autoUpdate()) {
      const processedPayload = this.processPayload();
      if (processedPayload != this.lastOutputPayload) {
        this.lastOutputPayload = processedPayload;
        this.outputPayload.set(this.lastOutputPayload);
      }
      else if (force === true) {
        this._liveOutputComponent?.instance?.update();
      }
      this.change.emit();
    }
  }

  updateNow(): boolean {
    this.updateOutputPayload(true);
    return false;
  }
}
