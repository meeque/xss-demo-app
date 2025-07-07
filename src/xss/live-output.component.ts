import { Component, Type, ElementRef, InputSignal, input, AfterViewInit, inject } from "@angular/core";
import { NgStyle } from '@angular/common';

import { PayloadOutputDescriptor } from "./payload-output.service";


export interface LiveOutput {
  outputDescriptor: InputSignal<PayloadOutputDescriptor>;
  outputPayload: InputSignal<unknown>;
}

export interface LiveOutputType extends Type<LiveOutput> {
  readonly templateCode: string;
}



@Component({
  template: ''
})
export abstract class LiveOutputComponent implements LiveOutput {
  outputDescriptor = input.required<PayloadOutputDescriptor>();
  outputPayload = input.required();

  /**
   * Getter for the value of the `outputPayload` input.
   * Makes it easier to read the value in Angular templates by simply referencing the `payload` property.
   */
  get payload() {
    return this.outputPayload();
  }
}



@Component({
  selector: 'xss-live-output-non-angular',
  template: NonAngularLiveOutputComponent.templateCode,
  standalone: true
})
export class NonAngularLiveOutputComponent extends LiveOutputComponent implements AfterViewInit {
  private readonly containerElement = inject(ElementRef);

  static readonly templateCode = '';

  ngAfterViewInit(): void {
    const payload = this.outputPayload();
    const descriptor = this.outputDescriptor();
    const element = this.containerElement.nativeElement;
    if (descriptor?.htmlSourceProvider) {
      try {
        element.innerHTML = descriptor.htmlSourceProvider(payload);
      } catch (err) {
        console.error(err);
      }
    }
    else if (descriptor?.domInjector) {
      element.textContent = '';
      try {
        descriptor.domInjector(element, payload);
      } catch (err) {
        console.error(err);
      }
    }
    else if (descriptor?.jQueryInjector) {
      element.textContent = '';
      try {
        descriptor.jQueryInjector(element, payload);
      } catch (err) {
        console.error(err);
      }
    }
  }
}



@Component({
    selector: 'xss-live-output-encoded',
    template: EncodedLiveOutputComponent.templateCode,
    standalone: true
})
export class EncodedLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '{{ payload }}';
}

@Component({
  selector: 'xss-live-output-text-content',
  template: TextContentLiveOutputComponent.templateCode,
  standalone: true
})
export class TextContentLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<div [textContent]="payload"></div>';
}

@Component({
  selector: 'xss-live-output-inner-text',
  template: InnerTextLiveOutputComponent.templateCode,
  standalone: true
})
export class InnerTextLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<div [innerText]="payload"></div>';
}

@Component({
  selector: 'xss-live-output-inner-html',
  template: InnerHtmlLiveOutputComponent.templateCode,
  standalone: true
})
export class InnerHtmlLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<div [innerHTML]="payload"></div>';
}

@Component({
  selector: 'xss-live-output-paragraph-title',
  template: ParagraphTitleLiveOutputComponent.templateCode,
  standalone: true
})
export class ParagraphTitleLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<p [title]="payload">This paragraph has a title.</p>';
}

@Component({
  selector: 'xss-live-output-link-url',
  template: LinkUrlLiveOutputComponent.templateCode,
  standalone: true
})
export class LinkUrlLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<a [href]="payload" target="xss-demo-xss-probe" rel="opener">Click here to test your payload as a URL!</a>';
}

@Component({
  selector: 'xss-live-output-iframe-url',
  template: IframeUrlLiveOutputComponent.templateCode,
  standalone: true
})
export class IframeUrlLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<iframe [src]="payload"></iframe>';
}

@Component({
  selector: 'xss-live-output-style-block',
  template: StyleBlockLiveOutputComponent.templateCode,
  standalone: true
})
export class StyleBlockLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<style type="text/css" [innerHTML]="payload"></style>';
}

@Component({
  selector: 'xss-live-output-style-attribute',
  template: StyleAttributeLiveOutputComponent.templateCode,
  standalone: true
})
export class StyleAttributeLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<div [style]="payload">Element with custom style</div>';
}

@Component({
  selector: 'xss-live-output-structured-style-attribute',
  template: StructuredStyleAttributeLiveOutputComponent.templateCode,
  standalone: true,
  imports: [NgStyle]
})
export class StructuredStyleAttributeLiveOutputComponent extends LiveOutputComponent {
  static readonly templateCode = '<div [ngStyle]="payload">Element with custom style</div>';
}
