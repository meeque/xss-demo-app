import { Component, Type, ElementRef, InputSignal, input, effect } from "@angular/core";
import { NgStyle } from '@angular/common';

import { PayloadOutputDescriptor } from "../payload-output.service";


export interface AngularTemplateOutput {
  outputDescriptor: InputSignal<PayloadOutputDescriptor>;
  outputPayload: InputSignal<any>;
  readonly payload: any ;
}

export interface AngularTemplateOutputType extends Type<AngularTemplateOutput> {
  readonly templateCode: string;
}



@Component({
  template: ''
})
abstract class AngularTemplateOutputBase implements AngularTemplateOutput {

  outputPayload = input.required<any>();
  outputDescriptor = input.required<PayloadOutputDescriptor>();
  get payload() {
    return this.outputPayload();
  }
}



@Component({
  selector: 'template-output-non-angular',
  template: NonAngular.templateCode,
  standalone: true
})
export class NonAngular extends AngularTemplateOutputBase {
  static readonly templateCode = '';

  constructor(private readonly _element: ElementRef) {
    super();

    effect(() => {
      const outputElement = this._element.nativeElement;
      const payloadString = '' + this.outputPayload();
      const outputDescriptor = this.outputDescriptor();
      if (outputDescriptor?.htmlSourceProvider) {
        try {
          outputElement.innerHTML = outputDescriptor.htmlSourceProvider(payloadString);
        } catch (err) {
          console.error(err);
        }
      }
      else if (outputDescriptor?.domInjector) {
        outputElement.textContent = '';
        try {
          outputDescriptor.domInjector(outputElement, payloadString);
        } catch (err) {
          console.error(err);
        }
      }
      else if (outputDescriptor?.jQueryInjector) {
        outputElement.textContent = '';
        try {
          outputDescriptor.jQueryInjector(outputElement, payloadString);
        } catch (err) {
          console.error(err);
        }
      }
    });
  }
}



@Component({
    selector: 'template-output-encoded',
    template: Encoded.templateCode,
    standalone: true
})
export class Encoded extends AngularTemplateOutputBase {
  static readonly templateCode = '{{ payload }}';
}

@Component({
  selector: 'template-output-text-content',
  template: TextContent.templateCode,
  standalone: true
})
export class TextContent extends AngularTemplateOutputBase {
  static readonly templateCode = '<div [textContent]="payload"></div>';
}

@Component({
  selector: 'template-output-inner-text',
  template: InnerText.templateCode,
  standalone: true
})
export class InnerText extends AngularTemplateOutputBase {
  static readonly templateCode = '<div [innerText]="payload"></div>';
}

@Component({
  selector: 'template-output-inner-html',
  template: InnerHtml.templateCode,
  standalone: true
})
export class InnerHtml extends AngularTemplateOutputBase {
  static readonly templateCode = '<div [innerHTML]="payload"></div>';
}

@Component({
  selector: 'template-output-paragraph-title',
  template: ParagraphTitle.templateCode,
  standalone: true
})
export class ParagraphTitle extends AngularTemplateOutputBase {
  static readonly templateCode = '<p [title]="payload">This paragraph has a title.</p>';
}

@Component({
  selector: 'template-output-link-url',
  template: LinkUrl.templateCode,
  standalone: true
})
export class LinkUrl extends AngularTemplateOutputBase {
  static readonly templateCode = '<a [href]="payload">Click here to test your payload as a URL!</a>';
}

@Component({
  selector: 'template-output-iframe-url',
  template: IframeUrl.templateCode,
  standalone: true
})
export class IframeUrl extends AngularTemplateOutputBase {
  static readonly templateCode = '<iframe [src]="payload"></iframe>';
}

@Component({
  selector: 'template-output-style-block',
  template: StyleBlock.templateCode,
  standalone: true
})
export class StyleBlock extends AngularTemplateOutputBase {
  static readonly templateCode = '<style type="text/css" [innerHTML]="payload"></style>';
}

@Component({
  selector: 'template-output-style-attribute',
  template: StyleAttribute.templateCode,
  standalone: true
})
export class StyleAttribute extends AngularTemplateOutputBase {
  static readonly templateCode = '<div [style]="payload">Element with custom style</div>';
}

@Component({
  selector: 'template-output-structured-style-attribute',
  template: StructuredStyleAttribute.templateCode,
  standalone: true,
  imports: [NgStyle]
})
export class StructuredStyleAttribute extends AngularTemplateOutputBase {
  static readonly templateCode = '<div [ngStyle]="payload">Element with custom style</div>';
}
