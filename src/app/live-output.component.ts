import { Component, Type, ElementRef, InputSignal, input, effect } from "@angular/core";
import { NgStyle } from '@angular/common';

import { PayloadOutputDescriptor } from "./payload-output.service";


export interface LiveOutput {
  outputDescriptor: InputSignal<PayloadOutputDescriptor>;
  outputPayload: InputSignal<any>;
  readonly payload: any ;
  reload(): void;
}

export interface LiveOutputType extends Type<LiveOutput> {
  readonly templateCode: string;
}



@Component({
  template: ''
})
export abstract class LiveOutputComponent implements LiveOutput {

  outputDescriptor = input.required<PayloadOutputDescriptor>();
  outputPayload = input.required<any>();

  get payload() {
    return this.outputPayload();
  }

  reload() {
  };
}



@Component({
  selector: 'template-output-non-angular',
  template: NonAngular.templateCode,
  standalone: true
})
export class NonAngular extends LiveOutputComponent {
  static readonly templateCode = '';

  constructor(private readonly _element: ElementRef) {
    super();

    effect(() => {
      this.doReload();
    });
  }

  override reload() {
    this.doReload();
  };

  private doReload(): void {
    const payload = this.outputPayload();
    const descriptor = this.outputDescriptor();
    const element = this._element.nativeElement;
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
    selector: 'template-output-encoded',
    template: Encoded.templateCode,
    standalone: true
})
export class Encoded extends LiveOutputComponent {
  static readonly templateCode = '{{ payload }}';
}

@Component({
  selector: 'template-output-text-content',
  template: TextContent.templateCode,
  standalone: true
})
export class TextContent extends LiveOutputComponent {
  static readonly templateCode = '<div [textContent]="payload"></div>';
}

@Component({
  selector: 'template-output-inner-text',
  template: InnerText.templateCode,
  standalone: true
})
export class InnerText extends LiveOutputComponent {
  static readonly templateCode = '<div [innerText]="payload"></div>';
}

@Component({
  selector: 'template-output-inner-html',
  template: InnerHtml.templateCode,
  standalone: true
})
export class InnerHtml extends LiveOutputComponent {
  static readonly templateCode = '<div [innerHTML]="payload"></div>';
}

@Component({
  selector: 'template-output-paragraph-title',
  template: ParagraphTitle.templateCode,
  standalone: true
})
export class ParagraphTitle extends LiveOutputComponent {
  static readonly templateCode = '<p [title]="payload">This paragraph has a title.</p>';
}

@Component({
  selector: 'template-output-link-url',
  template: LinkUrl.templateCode,
  standalone: true
})
export class LinkUrl extends LiveOutputComponent {
  static readonly templateCode = '<a [href]="payload">Click here to test your payload as a URL!</a>';
}

@Component({
  selector: 'template-output-iframe-url',
  template: IframeUrl.templateCode,
  standalone: true
})
export class IframeUrl extends LiveOutputComponent {
  static readonly templateCode = '<iframe [src]="payload"></iframe>';
}

@Component({
  selector: 'template-output-style-block',
  template: StyleBlock.templateCode,
  standalone: true
})
export class StyleBlock extends LiveOutputComponent {
  static readonly templateCode = '<style type="text/css" [innerHTML]="payload"></style>';
}

@Component({
  selector: 'template-output-style-attribute',
  template: StyleAttribute.templateCode,
  standalone: true
})
export class StyleAttribute extends LiveOutputComponent {
  static readonly templateCode = '<div [style]="payload">Element with custom style</div>';
}

@Component({
  selector: 'template-output-structured-style-attribute',
  template: StructuredStyleAttribute.templateCode,
  standalone: true,
  imports: [NgStyle]
})
export class StructuredStyleAttribute extends LiveOutputComponent {
  static readonly templateCode = '<div [ngStyle]="payload">Element with custom style</div>';
}
