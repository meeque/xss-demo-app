import { Component, Input } from "@angular/core";
import { NgStyle } from '@angular/common';


export interface AngularTemplateOutput {
  payload: any;
}



const TEMPLATE_CODE_ENCODED = '{{ payload }}';

@Component({
    selector: 'template-output-encoded',
    template: TEMPLATE_CODE_ENCODED,
    standalone: true,
    imports: []
})
export class Encoded implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_ENCODED;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_TEXT_CONTENT = '<div [textContent]="payload"></div>';

@Component({
  selector: 'template-output-text-content',
  template: TEMPLATE_CODE_TEXT_CONTENT,
  standalone: true,
  imports: []
})
export class TextContent implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_TEXT_CONTENT;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_INNER_TEXT = '<div [innerText]="payload"></div>';

@Component({
  selector: 'template-output-inner-text',
  template: TEMPLATE_CODE_INNER_TEXT,
  standalone: true,
  imports: []
})
export class InnerText implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_INNER_TEXT;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_INNER_HTML = '<div [innerHTML]="payload"></div>';

@Component({
  selector: 'template-output-inner-html',
  template: TEMPLATE_CODE_INNER_HTML,
  standalone: true,
  imports: []
})
export class InnerHtml implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_INNER_HTML;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_PARAGRAPH_TITLE = '<p [title]="payload">This paragraph has a title.</p>';

@Component({
  selector: 'template-output-paragraph-title',
  template: TEMPLATE_CODE_PARAGRAPH_TITLE,
  standalone: true,
  imports: []
})
export class ParagraphTitle implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_PARAGRAPH_TITLE;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_LINk_URL = '<a [href]="payload">Click here to test your payload as a URL!</a>';

@Component({
  selector: 'template-output-link-url',
  template: TEMPLATE_CODE_LINk_URL,
  standalone: true,
  imports: []
})
export class LinkUrl implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_LINk_URL;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_IFRAME_URL = '<iframe [src]="payload"></iframe>';

@Component({
  selector: 'template-output-iframe-url',
  template: TEMPLATE_CODE_IFRAME_URL,
  standalone: true,
  imports: []
})
export class IframeUrl implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_IFRAME_URL;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_STYLE_BLOCK = '<style type="text/css" [innerHTML]="payload"></style>';

@Component({
  selector: 'template-output-style-block',
  template: TEMPLATE_CODE_STYLE_BLOCK,
  standalone: true,
  imports: []
})
export class StyleBlock implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_STYLE_BLOCK;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_STYLE_ATTRIBUTE = '<div [style]="payload">Element with custom style</div>';

@Component({
  selector: 'template-output-style-attribute',
  template: TEMPLATE_CODE_STYLE_ATTRIBUTE,
  standalone: true,
  imports: []
})
export class StyleAttribute implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_STYLE_ATTRIBUTE;

  @Input()
  payload: any;
}



const TEMPLATE_CODE_STRUCTURED_STYLE_ATTRIBUTE = '<div [ngStyle]="payload">Element with custom style</div>';

@Component({
  selector: 'template-output-structured-style-attribute',
  template: TEMPLATE_CODE_STRUCTURED_STYLE_ATTRIBUTE,
  standalone: true,
  imports: [NgStyle]
})
export class StructuredStyleAttribute implements AngularTemplateOutput {

  static readonly templateCode = TEMPLATE_CODE_STRUCTURED_STYLE_ATTRIBUTE;

  @Input()
  payload: any;
}
