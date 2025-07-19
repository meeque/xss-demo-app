import { Component, AfterViewInit, ElementRef, ViewContainerRef, EnvironmentInjector, signal, input, model, effect, inject, viewChild, output } from '@angular/core';
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
  imports: [FormsModule, StripExtraIndentPipe],
})
export class PayloadOutputComponent implements AfterViewInit {
  private static nextComponentId = 0;
  protected readonly componentId = PayloadOutputComponent.nextComponentId++;

  protected readonly XssContext = XssContext;
  protected readonly PayloadOutputQuality = PayloadOutputQuality;


  private readonly environmentInjector = inject(EnvironmentInjector);

  readonly outputDescriptor = input<PayloadOutputDescriptor>();
  readonly payload = input('');

  readonly autoUpdateEnabled = model(true);

  protected readonly liveSourceCode = signal('');

  readonly onbeforeupdate = output();

  private readonly liveOutputElement = viewChild<ElementRef>('liveOutputElement');
  private readonly liveOutputViewContainer = viewChild('liveOutputViewContainer', { read: ViewContainerRef });

  private lastOutputDescriptor: PayloadOutputDescriptor;


  constructor() {
    effect(
      () => {
        this.updateLiveOutput();
      },
    );
  }


  ngAfterViewInit(): void {
    this.updateLiveOutput(true);
  }


  private updateLiveOutput(force = false): void {
    const descriptor = this.outputDescriptor();
    const payload = this.getProcessedPayload();

    if (force || this.autoUpdateEnabled() || this.lastOutputDescriptor != descriptor) {
      this.onbeforeupdate.emit();
      this.lastOutputDescriptor = descriptor;

      const liveOutputViewContainer = this.liveOutputViewContainer();
      if (liveOutputViewContainer) {
        liveOutputViewContainer.clear();
        const liveOutputComponentType = descriptor.templateComponentType || NonAngularLiveOutputComponent;
        const liveOutputComponent = liveOutputViewContainer.createComponent(
          liveOutputComponentType,
          {
            index: 0,
            environmentInjector: this.environmentInjector,
          },
        );

        liveOutputComponent.setInput('outputDescriptor', descriptor);
        liveOutputComponent.setInput('outputPayload', payload);
      }

      setTimeout(this.updateLiveSourceCode);
    }
  }

  private updateLiveSourceCode = () => {
    this.liveSourceCode.set(
      this.liveOutputElement().nativeElement.querySelector('*').innerHTML,
    );
  };

  private getProcessedPayload() {
    const payloadProcessor = this.outputDescriptor()?.payloadProcessor;

    if (payloadProcessor) {
      return payloadProcessor(this.payload());
    }

    return this.payload();
  }


  protected updateNow() {
    this.updateLiveOutput(true);
    return false;
  }

  protected togglePanel(event: MouseEvent) {
    const panel = (event.target as Element).closest('.fd-layout-panel');
    panel.ariaExpanded = (panel.ariaExpanded == 'true') ? 'false' : 'true';
  }
}
