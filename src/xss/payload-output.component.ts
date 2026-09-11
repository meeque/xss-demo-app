import { Component, AfterViewInit, ElementRef, ViewContainerRef, EnvironmentInjector, signal, input, model, effect, inject, viewChild, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgbCollapseModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';
import { Descriptor, Quality, Technology, EmitterLabels } from './payload-output.service';
import { NonAngularLiveOutputComponent } from './live-output.component';



@Component({
  selector: 'xss-payload-output',
  templateUrl: './payload-output.component.html',
  styleUrls: ['./payload-output.component.css'],
  standalone: true,
  imports: [NgbCollapseModule, NgbPopoverModule, NgTemplateOutlet, FormsModule, StripExtraIndentPipe],
})
export class PayloadOutputComponent implements AfterViewInit {
  private static nextComponentId = 0;
  protected readonly componentId = PayloadOutputComponent.nextComponentId++;

  protected readonly $ = { Technology, Quality, EmitterLabels };


  private readonly environmentInjector = inject(EnvironmentInjector);

  readonly outputDescriptor = input<Descriptor>();
  readonly payload = input('');

  readonly autoUpdateEnabled = model(true);

  protected readonly liveSourceCode = signal('');

  readonly onbeforeupdate = output();

  private readonly liveOutputElement = viewChild<ElementRef>('liveOutputElement');
  private readonly liveOutputViewContainer = viewChild('liveOutputViewContainer', { read: ViewContainerRef });

  private lastOutputDescriptor: Descriptor;


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
    const payload = this.processedPayload;

    if (force || this.autoUpdateEnabled() || this.lastOutputDescriptor != descriptor) {
      this.onbeforeupdate.emit();
      this.lastOutputDescriptor = descriptor;

      const liveOutputViewContainer = this.liveOutputViewContainer();
      if (liveOutputViewContainer) {
        liveOutputViewContainer.clear();
        const liveOutputComponentType = descriptor.technology === Technology.Angular ? descriptor.payloadEmitter : NonAngularLiveOutputComponent;
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

  private get processedPayload() {
    const payloadProcessor = this.outputDescriptor()?.payloadProcessor;

    if (payloadProcessor) {
      return payloadProcessor(this.payload());
    }

    return this.payload();
  }

  protected get payloadEmitterCode(): string {
    const payloadEmitter = this.outputDescriptor().payloadEmitter;
    if ('templateCode' in payloadEmitter) {
      return payloadEmitter.templateCode;
    }
    return payloadEmitter.toString();
  }

  protected updateNow() {
    this.updateLiveOutput(true);
    return false;
  }

  protected toggleCard(event: MouseEvent) {
    const button = (event.target as Element).closest('.collapse-toggle') as HTMLElement;
    const isExpanded = button.ariaExpanded !== 'false';
    button.ariaExpanded = isExpanded ? 'false' : 'true';
  }
}
