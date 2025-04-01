import { Component, Input, Type, signal } from "@angular/core";
import { NgStyle } from '@angular/common';
import { PayloadOutputDescriptor } from "../payload-output.service";


export interface AngularTemplateOutput {
  readonly payload: any;
  readonly outputDescriptor: PayloadOutputDescriptor;
}

export interface AngularTemplateOutputType extends Type<AngularTemplateOutput> {
  readonly templateCode: string;
}



@Component({
  template: ''
})
abstract class AngularTemplateOutputBase implements AngularTemplateOutput {

  @Input()
  payloadSignal = signal(null);

  @Input()
  outputDescriptor = null;

  get payload() {
    return this.payloadSignal();
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
