import { NgIf, NgClass } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, Output, EventEmitter, EnvironmentInjector, signal, input, model, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';
import { XssContext } from './xss-demo.common';
import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { NonAngular } from './live-output.component';

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
  payload = input('');

  readonly autoUpdate = model(true);
  readonly liveSourceCode = signal('');

  @Output()
  update = new EventEmitter<void>(true);

  @ViewChild('liveOutputElement')
  private _liveOutputElement : ElementRef;

  @ViewChild('liveOutputViewContainer', {read: ViewContainerRef})
  private _liveOutputViewContainer : ViewContainerRef;

  lastOutputDescriptor : PayloadOutputDescriptor;

  constructor(private readonly _environmentInjector : EnvironmentInjector) {

    effect(
      () => {
        this.updateOutput();
      }
    );

    this.update.subscribe(
      () => {
        this.liveSourceCode.set(
          this._liveOutputElement.nativeElement.querySelector('*').innerHTML
        );
      }
    );
  }

  ngAfterViewInit(): void {
    this.updateOutput(true);
  }

  private updateOutput(force = false): void {
    const descriptor = this.outputDescriptor();
    const payload = this.processedPayload();

    if (force || this.autoUpdate() || this.lastOutputDescriptor != descriptor) {

      this.lastOutputDescriptor = descriptor;

      if (this._liveOutputViewContainer) {
        this._liveOutputViewContainer.clear();
        const liveOutputComponentType = descriptor.templateComponentType || NonAngular;
        const liveOutputComponent = this._liveOutputViewContainer.createComponent(
          liveOutputComponentType,
          {
            index: 0,
            environmentInjector: this._environmentInjector,
          }
        );

        liveOutputComponent.setInput('outputDescriptor', descriptor);
        liveOutputComponent.setInput('outputPayload', payload);
      }

      this.update.emit();
    }
  }

  private processedPayload(): any {
    const payloadProcessor = this.outputDescriptor()?.payloadProcessor;
    const payload = this.payload();

    if (payloadProcessor) {
      return payloadProcessor(payload);
    }
    return payload;
  }

  updateNow(): boolean {
    this.updateOutput(true);
    return false;
  }

  togglePanel(event: MouseEvent) {
    const panel = (event.target as Element).closest('.fd-layout-panel');
    panel.ariaExpanded = (panel.ariaExpanded == 'true') ? 'false' : 'true';
  }
}
