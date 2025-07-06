import { NgClass } from '@angular/common';
import { Component, AfterViewInit, ElementRef, ViewContainerRef, Output, EventEmitter, EnvironmentInjector, signal, input, model, effect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';
import { XssContext } from './xss-demo.common';
import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { NonAngularLiveOutputComponent } from './live-output.component';

@Component({
    selector: 'xss-payload-output',
    templateUrl: './payload-output.component.html',
    styleUrls: ['./payload-output.component.css'],
    standalone: true,
    imports: [NgClass, FormsModule, StripExtraIndentPipe]
})
export class PayloadOutputComponent implements AfterViewInit {
  private readonly _environmentInjector = inject(EnvironmentInjector);


  static nextComponentId = 0;
  componentId = PayloadOutputComponent.nextComponentId++;

  readonly XssContext = XssContext;
  readonly PayloadOutputQuality = PayloadOutputQuality;

  outputDescriptor = input<PayloadOutputDescriptor>();
  payload = input('');

  readonly autoUpdate = model(true);
  readonly liveSourceCode = signal('');

  @Output()
  update = new EventEmitter<void>(true);

  private readonly _liveOutputElement = viewChild<ElementRef>('liveOutputElement');

  private readonly _liveOutputViewContainer = viewChild('liveOutputViewContainer', { read: ViewContainerRef });

  lastOutputDescriptor : PayloadOutputDescriptor;

  constructor() {
    effect(
      () => {
        this.updateOutput();
      }
    );

    this.update.subscribe(
      () => {
        this.liveSourceCode.set(
          this._liveOutputElement().nativeElement.querySelector('*').innerHTML
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

      const _liveOutputViewContainer = this._liveOutputViewContainer();
      if (_liveOutputViewContainer) {
        _liveOutputViewContainer.clear();
        const liveOutputComponentType = descriptor.templateComponentType || NonAngularLiveOutputComponent;
        const liveOutputComponent = _liveOutputViewContainer.createComponent(
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

  private processedPayload() {
    const payloadProcessor = this.outputDescriptor()?.payloadProcessor;
    const payload = this.payload();

    if (payloadProcessor) {
      return payloadProcessor(payload);
    }
    return payload;
  }

  updateNow() {
    this.updateOutput(true);
    return false;
  }

  togglePanel(event: MouseEvent) {
    const panel = (event.target as Element).closest('.fd-layout-panel');
    panel.ariaExpanded = (panel.ariaExpanded == 'true') ? 'false' : 'true';
  }
}
