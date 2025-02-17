import { TestBed, ComponentFixture } from '@angular/core/testing';
import { xssDemoConfig } from './xss-demo.config';
import { XssDemoComponent } from './xss-demo.component';
import { PayloadOutputContext, PayloadOutputService } from './payload-output.service';

describe('Xss Demo App', async () => {

  let payloadOutputService = new PayloadOutputService(null);

  let fixture: ComponentFixture<XssDemoComponent>;
  let component: XssDemoComponent;
  let element: HTMLElement;

  let payloadInputComboBox: HTMLElement;
  let payloadOutputComboBox: HTMLElement;
  let alertOverlay: HTMLElement;

  let xssResolve = (value: any) => {};

  function timeout(millis: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, millis));
  }

  function nextXssPromise(): Promise<any> {
    return new Promise<any>((resolve, reject) => xssResolve = resolve);
  }

  async function select(input: string, output: string) {
    const payloadInputMenuLink =
      Array.from(payloadInputComboBox.querySelectorAll('div.fd-popover__body a'))
      .find((a: HTMLLinkElement) => a.textContent == input) as HTMLLinkElement;
    const payloadOutputMenuLink =
      Array.from(payloadOutputComboBox.querySelectorAll('div.fd-popover__body a'))
      .find((a: HTMLLinkElement) => a.textContent.trim() == output) as HTMLLinkElement;
    payloadInputMenuLink.click();
    payloadOutputMenuLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule(xssDemoConfig);
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(XssDemoComponent);
    fixture.detectChanges();

    component = fixture.componentInstance;
    element = fixture.nativeElement;

    payloadInputComboBox = element.querySelector('section.input-area combobox-input');
    payloadOutputComboBox = element.querySelector('section.output-area combobox-input');
    alertOverlay = element.querySelector('.fd-shell__overlay.fd-overlay--alert');

    const xssOriginal: () => any = (window as any).xss;
    (window as any).xss = () => {
      xssOriginal();
      xssResolve(null);
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

  /*
  xssTriggeringPresetsByContextAndOutput[PayloadOutputContext.HtmlAttribute.toString()] = {
    'HtmlAttribute':                 ['IFrame src', 'Image onerror', 'Mixed HTML Content'],
    'HtmlEncodedUnquotedAttribute':  [],
    'HtmlUnquotedAttribute':         [],
  }
  */

  for (const contextDescriptor of payloadOutputService.descriptors) {

    // XXX ignore contexts that have not been configured yet
    if (!Object.hasOwn(xssTriggeringPresetsByContextAndOutput, contextDescriptor.id.toString())) {
      continue;
    }

    describe('in the context of "' + contextDescriptor.name + '"', () => {
      for (const outputDescriptor of contextDescriptor.payloadOutputs) {

        describe('with payload output "' + outputDescriptor.name + '"', () => {

          const xssTriggeringPresetNames: string[] = xssTriggeringPresetsByContextAndOutput[contextDescriptor.id.toString()][outputDescriptor.id] || [];
          const specExpectation =
            (xssTriggeringPresetNames.length == 0) ?
            'should NOT trigger XSS for any presets':
            'should only trigger XSS for presets ' + xssTriggeringPresetNames.map(presetName => '"' + presetName +'"').join(', ');

          it(specExpectation, async () => {
            const matchingPresetGroup = component.presetGroups.find(menuGroup => menuGroup.value == contextDescriptor.id);

            for (const matchingPreset of matchingPresetGroup.items) {
              const xssPromise = nextXssPromise();
              await select(matchingPreset.name, outputDescriptor.name);
              const timeoutPromise = timeout(500);
              await Promise.race([xssPromise, timeoutPromise]);

              if (xssTriggeringPresetNames.includes(matchingPreset.name)) {
                await expectAsync(xssPromise).withContext('preset "' + matchingPreset.name + '" should trigger XSS').toBeResolved();
                expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('preset "' + matchingPreset.name + '" should show XSS alert message').not.toBeNull();
              } else {
                await expectAsync(timeoutPromise).withContext('preset "' + matchingPreset.name + '" should NOT trigger XSS').toBeResolved();
                expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('preset "' + matchingPreset.name + '" should NOT show XSS alert message').toBeNull();
              }
            }
          }, 30000);
        });
      }
    });
  }
});
