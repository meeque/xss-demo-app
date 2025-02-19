import { TestBed, ComponentFixture } from '@angular/core/testing';
import { xssDemoConfig } from './xss-demo.config';
import { XssDemoComponent } from './xss-demo.component';
import { PayloadOutputContext, PayloadOutputService } from './payload-output.service';

describe('Xss Demo App', async () => {

  let payloadOutputService = new PayloadOutputService(null);

  let fixture: ComponentFixture<XssDemoComponent>;
  let component: XssDemoComponent;
  let element: HTMLElement;

  let payloadInputCombobox: HTMLElement;
  let payloadOutputCombobox: HTMLElement;
  let alertOverlay: HTMLElement;

  let xssResolve = (value?: any) => {};

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

  const xssTriggeringPresetsByContextAndOutput = {};

  xssTriggeringPresetsByContextAndOutput[PayloadOutputContext.HtmlContent.toString()] = {
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

  xssTriggeringPresetsByContextAndOutput[PayloadOutputContext.HtmlAttribute.toString()] = {
    'HtmlAttribute':        ['IFrame src', 'Image onerror', 'Mixed HTML Content'],
  }

  xssTriggeringPresetsByContextAndOutput[PayloadOutputContext.Url.toString()] = {
    'IframeDomTrusted': ['javascript URL'],
    'IframeNgTrusted': ['javascript URL'],
  }

  xssTriggeringPresetsByContextAndOutput[PayloadOutputContext.Css.toString()] = {
  }

  xssTriggeringPresetsByContextAndOutput[PayloadOutputContext.JavaScript.toString()] = {
    'DqStringDomTrusted': ['JS code breaking "string"'],
    'SqStringDomTrusted': ['JS code breaking \'string\''],
    'BlockDomTrusted': ['pure JS code'],
  }

  for (const contextDescriptor of payloadOutputService.descriptors) {

    describe('"' + contextDescriptor.name + '"', () => {

      for (const outputDescriptor of contextDescriptor.payloadOutputs) {

        describe('payload output "' + outputDescriptor.name + '"', () => {

          const xssTriggeringPresetNames: string[] = xssTriggeringPresetsByContextAndOutput[contextDescriptor.id.toString()][outputDescriptor.id] || [];

          it(
            xssTriggeringPresetNames.length == 0
              ? 'should NOT trigger XSS for any presets'
              : 'should trigger XSS for presets ' + xssTriggeringPresetNames.map(presetName => '"' + presetName + '"').join(', '),
            async () => {
              const matchingPresetGroup = component.presetGroups.find(menuGroup => menuGroup.value == contextDescriptor.id);

              for (const matchingPreset of matchingPresetGroup.items) {
                const xssPromise = nextXssPromise();
                await selectInputOutput(contextDescriptor.name, matchingPreset.name, outputDescriptor.name);
                const timeoutPromise = timeout(200);
                await Promise.race([xssPromise, timeoutPromise]);

                await whenStableDetectChanges();

                if (xssTriggeringPresetNames.includes(matchingPreset.name)) {
                  await expectAsync(xssPromise).withContext('preset "' + matchingPreset.name + '" should trigger XSS').toBeResolved();
                  await whenStableDetectChanges();
                  expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('preset "' + matchingPreset.name + '" should show XSS alert message').not.toBeNull();
                } else {
                  await expectAsync(timeoutPromise).withContext('preset "' + matchingPreset.name + '" should NOT trigger XSS').toBeResolved();
                  await whenStableDetectChanges();
                  expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('preset "' + matchingPreset.name + '" should NOT show XSS alert message').toBeNull();
                }
              }
            },
            30000
          );
        });
      }
    });
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

  function timeout(millis: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, millis);
    });
  }

  function nextXssPromise(): Promise<any> {
    return new Promise<any>(resolve => {
      xssResolve = resolve;
    });
  }
});
