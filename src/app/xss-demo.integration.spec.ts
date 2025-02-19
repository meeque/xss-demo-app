import { TestBed, ComponentFixture } from '@angular/core/testing';

import { XssContext, XssContextCollection } from './xss-demo.common';
import { xssDemoConfig } from './xss-demo.config';
import { PayloadPresetDescriptor, PayloadPresetService } from './payload-preset.service';
import { PayloadOutputDescriptor, PayloadOutputService } from './payload-output.service';
import { XssDemoComponent } from './xss-demo.component';



describe('Xss Demo App', async () => {

  let fixture: ComponentFixture<XssDemoComponent>;
  let component: XssDemoComponent;
  let element: HTMLElement;

  let payloadInputCombobox: HTMLElement;
  let payloadOutputCombobox: HTMLElement;
  let alertOverlay: HTMLElement;

  let payloadPresetServiceStub = new PayloadPresetService(null);
  let payloadOutputServiceStub = new PayloadOutputService(null);

  let xssResolve = () => {};



  const xssTriggeringPresetsByContextAndOutput = {};

  xssTriggeringPresetsByContextAndOutput[XssContext.HtmlContent.toString()] = {
    'HtmlContent':          ['IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'DomInnerHtml':         ['IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'DomInnerHtmlNoOutput': ['Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryHtml':           ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryConstructor':    ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryPrepend':        ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryAppend':         ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryBefore':         ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryAfter':          ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryWrapInner':      ['IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryWrap':           ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'JQueryReplaceWith':    ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
    'NgTrusted':            ['IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', 'Mixed HTML Content'],
  }

  xssTriggeringPresetsByContextAndOutput[XssContext.HtmlAttribute.toString()] = {
    'HtmlAttribute':        ['IFrame src', 'Image onerror', 'Mixed HTML Content'],
  }

  xssTriggeringPresetsByContextAndOutput[XssContext.Url.toString()] = {
    'IframeDomTrusted': ['javascript URL'],
    'IframeNgTrusted': ['javascript URL'],
  }

  xssTriggeringPresetsByContextAndOutput[XssContext.Css.toString()] = {
  }

  xssTriggeringPresetsByContextAndOutput[XssContext.JavaScript.toString()] = {
    'DqStringDomTrusted': ['JS code breaking "string"'],
    'SqStringDomTrusted': ['JS code breaking \'string\''],
    'BlockDomTrusted': ['pure JS code'],
  }



  beforeEach(async () => {
    TestBed.configureTestingModule(xssDemoConfig);
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(XssDemoComponent);
    fixture.detectChanges();

    component = fixture.componentInstance;
    element = fixture.nativeElement;

    payloadInputCombobox = element.querySelector('section.input-area combobox-input');
    payloadOutputCombobox = element.querySelector('section.output-area combobox-input');
    alertOverlay = element.querySelector('.fd-shell__overlay.fd-overlay--alert');

    // ignore global errors caused by dynamically loaded scripts (e.g. script blocks from xss payloads)
    window.onerror = (message, source, lineno, colno, error) => {
      console.error(error);
    };

    const xssOriginal: () => any = (window as any).xss;
    (window as any).xss = () => {
      xssOriginal();
      xssResolve();
    };
  });

  it('should be created', async () => {
    expect(component).toBeDefined();
  });

  for (const contextDescriptor of payloadOutputServiceStub.descriptors) {

    describe('"' + contextDescriptor.name + '"', () => {

      const presetContextDescriptor = payloadPresetServiceStub.descriptors.find(descriptor => descriptor.id == contextDescriptor.id);

      for (const outputDescriptor of contextDescriptor.items) {

        const xssTriggeringPresetNames: string[] = xssTriggeringPresetsByContextAndOutput[contextDescriptor.id.toString()][outputDescriptor.id] || [];

        describe('payload output "' + outputDescriptor.name + '"', () => {

          for (const presetDescriptor of presetContextDescriptor.items) {

            if (xssTriggeringPresetNames.includes(presetDescriptor.name)) {

              it('should trigger XSS for payload "' + presetDescriptor.name + '"', async () => {
                await expectAsync(raceForXss(contextDescriptor, presetDescriptor, outputDescriptor)).withContext('invoke global xss() callback').toBeResolvedTo(true);
                expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('show XSS alert message').not.toBeNull();
              });

            } else {

              it('should NOT trigger xss for payload "' + presetDescriptor.name + '"', async () => {
                await expectAsync(raceForXss(contextDescriptor, presetDescriptor, outputDescriptor)).withContext('invoke global xss() callback').toBeResolvedTo(false);
                expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('show XSS alert message').toBeNull();
              });

            }
          }
        });
      }
    });
  }

  async function raceForXss(
    contextDescriptor: XssContextCollection<any>,
    presetDescriptor: PayloadPresetDescriptor,
    outputDescriptor: PayloadOutputDescriptor
  ): Promise<boolean> {
    const xssPromise = nextXssPromise();
    await selectInputOutput(contextDescriptor.name, presetDescriptor.name, outputDescriptor.name);
    const timeoutPromise = timeout(200);
    const result = await Promise.race([xssPromise, timeoutPromise]);
    await whenStableDetectChanges();
    return result;
  }

  async function selectInputOutput(context: string, input: string, output: string): Promise<void> {

    try {
      queryMenuLink(payloadInputCombobox, context, input).dispatchEvent(new Event('click'));
    } catch (err) {
      console.error(err);
    }

    try {
      queryMenuLink(payloadOutputCombobox, context, output).dispatchEvent(new Event('click'));
    } catch (err) {
      console.error(err);
    }

    await whenStableDetectChanges();
  }

  function queryMenuLink(combobox: HTMLElement, groupLabelText: string, linkText: string): HTMLLinkElement {
    const groupLabelElement = Array
      .from(combobox.querySelectorAll('div.fd-popover__body label'))
      .find((label: HTMLLabelElement) => label.textContent.trim() == groupLabelText) as HTMLElement;
    return Array
      .from(groupLabelElement.nextElementSibling.querySelectorAll('li a'))
      .find((a: HTMLLinkElement) => a.textContent.trim() == linkText) as HTMLLinkElement;
  }

  async function whenStableDetectChanges(): Promise<void> {
    try {
      await fixture.whenStable();
      fixture.detectChanges();
    } catch(err) {
      console.error(err);
    }
  }

  function timeout(millis: number): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => resolve(false), millis);
    });
  }

  function nextXssPromise(): Promise<boolean> {
    return new Promise(resolve => {
      xssResolve = () => resolve(true);
    });
  }
});
