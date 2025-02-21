import { TestBed, ComponentFixture } from '@angular/core/testing';

import { XssContext, XssContextCollection } from './xss-demo.common';
import { xssDemoConfig } from './xss-demo.config';
import { PayloadPresetDescriptor, PayloadPresetService } from './payload-preset.service';
import { PayloadOutputDescriptor, PayloadOutputQuality, PayloadOutputService } from './payload-output.service';
import { XssDemoComponent } from './xss-demo.component';


interface PresetTestConfig {
  readonly presetName: string;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
}

interface EnhancedPresetTestConfig extends PresetTestConfig {
  doTrigger(): Promise<void>;
  doExpect(): Promise<void>;
  doCleanup(): Promise<void>;
}

class DefaultPresetTestConfig implements EnhancedPresetTestConfig {
  readonly presetName: string;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;

  static fromRaw(configs: string[] | PresetTestConfig[]): EnhancedPresetTestConfig[] {
    return (configs || []).map(config => new DefaultPresetTestConfig(config));
  }

  static hasAnyXss(configs: PresetTestConfig[]): boolean {
    return null != (configs || []).find((config) => config.expectXss !== false);
  }

  static getByName(configs: EnhancedPresetTestConfig[], name: string): EnhancedPresetTestConfig {
    return (configs || []).find((config) => config.presetName === name);
  }

  static getByNameOrDefault(configs: EnhancedPresetTestConfig[], name: string): EnhancedPresetTestConfig {
    return DefaultPresetTestConfig.getByName(configs, name) || new DefaultPresetTestConfig({presetName: name, expectXss: false});
  }

  constructor(config: string | PresetTestConfig) {
    if (typeof config === 'object') {
      Object.assign(this, config);
    } else if (typeof config === 'string') {
      this.presetName = config;
    } else {
      throw new Error('Failed to create PresetTest Config! Constructor arg must be either a string or an object, got ' + typeof config + ' instead.');
    }
  }

  public async doTrigger(): Promise<void> {
    if (this.trigger) {
      return this.trigger();
    }
  }

  public async doExpect(): Promise<void> {
    if (this.expect) {
      return this.expect();
    }
  }

  public async doCleanup(): Promise<void> {
    if (this.cleanup) {
      try {
        return this.cleanup();
      } catch(err) {
        console.error('Ignoring error in custom cleanup function: ' + err);
      }
    }
  }
}

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



  const presetTestConfigsLib: {[prop: string]: PresetTestConfig} = {
    link: {
      presetName: 'A link href',
      trigger: async () => {
        await timeout(200);
        queryPayloadOutput().querySelector('.output.fd-layout-panel .fd-layout-panel__body').querySelector('a').click();
      }
    },
    focus: {
      presetName: 'Input field onfocus',
      trigger: async () => {
        await timeout(200);
        queryPayloadOutput().querySelector('.output.fd-layout-panel .fd-layout-panel__body').querySelector('input').dispatchEvent(new Event('focus'));
      }
    },
    mouseenter: {
      presetName: 'Div onmouseenter',
      trigger: async() => {
        await timeout(200);
        queryPayloadOutput().querySelector('.output.fd-layout-panel .fd-layout-panel__body').querySelector('div[onmouseenter]').dispatchEvent(new Event('mouseenter'));
      }
    },
    defacement: {
      presetName: 'pure JS defacement attack',
      expectXss: false,
      expect: async () => {
        const element = document.querySelector('article.fd-shell__app');
        expect(element.childElementCount).toBe(1);
        expect(element.querySelector('div.xss-demo-defacement')).not.toBeNull();
      },
      cleanup: async () => {
        const element = document.querySelector('div.xss-demo-defacement');
        element.parentNode.removeChild(element);
        document.body.style.background = null;
      }
    },
  };

  const presetsTestConfigsByContextAndOutput = {};

  presetsTestConfigsByContextAndOutput[XssContext.HtmlContent.toString()] = {
    'HtmlContent':          [              'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'DomInnerHtml':         [              'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'DomInnerHtmlNoOutput': [                            'Image onerror', 'Image onerror (legacy flavors)',                                                                                         'Mixed HTML Content'],
    'JQueryHtml':           ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryConstructor':    ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryPrepend':        ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryAppend':         ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryBefore':         ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryAfter':          ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryWrapInner':      [              'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryWrap':           ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'JQueryReplaceWith':    ['Script tag', 'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
    'NgTrusted':            [              'IFrame src', 'Image onerror', 'Image onerror (legacy flavors)', presetTestConfigsLib.link, presetTestConfigsLib.focus, presetTestConfigsLib.mouseenter, 'Mixed HTML Content'],
  }

  presetsTestConfigsByContextAndOutput[XssContext.HtmlAttribute.toString()] = {
    'HtmlAttribute': ['IFrame src', 'Image onerror', 'Mixed HTML Content'],
  }

  presetsTestConfigsByContextAndOutput[XssContext.Url.toString()] = {
    'IframeDomTrusted': ['javascript URL'],
    'IframeNgTrusted':  ['javascript URL'],
  }

  presetsTestConfigsByContextAndOutput[XssContext.Css.toString()] = {
  }

  presetsTestConfigsByContextAndOutput[XssContext.JavaScript.toString()] = {
    'DqStringDomTrusted': ['JS code breaking "string"'],
    'SqStringDomTrusted': ['JS code breaking \'string\''],
    'BlockDomTrusted':    ['pure JS code', presetTestConfigsLib.defacement],
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

  for (const context of payloadOutputServiceStub.descriptors) {

    describe('"' + context.name + '"', () => {

      const presetContextDescriptor = payloadPresetServiceStub.descriptors.find(descriptor => descriptor.id == context.id);

      for (const outputDescriptor of context.items) {

        const presetTestConfigs = DefaultPresetTestConfig.fromRaw(presetsTestConfigsByContextAndOutput[context.id.toString()][outputDescriptor.id]);

        describe('payload output "' + outputDescriptor.name + '"', () => {

          if(DefaultPresetTestConfig.hasAnyXss(presetTestConfigs)) {

            it('should not be marked as "Recommended"', () => {
              expect(outputDescriptor.quality).not.toBe(PayloadOutputQuality.Recommended);
            });

          }

          for (const presetDescriptor of presetContextDescriptor.items) {

            const presetTestConfig = DefaultPresetTestConfig.getByNameOrDefault(presetTestConfigs, presetDescriptor.name);

            if (presetTestConfig.expectXss !== false) {

              it('should trigger XSS for payload "' + presetDescriptor.name + '"', async () => {
                await expectAsync(raceForXss(context, presetTestConfig, outputDescriptor)).withContext('invoke global xss() callback').toBeResolvedTo(true);
                expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('show XSS alert message').not.toBeNull();
                await expectAsync(presetTestConfig.doExpect()).withContext('run custom except handler').toBeResolved();
                await presetTestConfig.doCleanup();
              });

            } else {

              it('should NOT trigger xss for payload "' + presetDescriptor.name + '"', async () => {
                await expectAsync(raceForXss(context, presetTestConfig, outputDescriptor)).withContext('invoke global xss() callback').toBeResolvedTo(false);
                expect(alertOverlay.querySelector('.alert-xss-triggered')).withContext('show XSS alert message').toBeNull();
                await expectAsync(presetTestConfig.doExpect()).withContext('run custom except handler').toBeResolved();
                await presetTestConfig.doCleanup();
              });

            }
          }
        });
      }
    });
  }



  async function raceForXss(
    context: XssContextCollection<any>,
    presetTestConfig: EnhancedPresetTestConfig,
    outputDescriptor: PayloadOutputDescriptor
  ): Promise<boolean> {
    const xssPromise = nextXssPromise();
    await selectInputOutput(context.name, presetTestConfig.presetName, outputDescriptor.name);
    const triggerPromise = presetTestConfig.doTrigger();
    const timeoutPromise = timeout(500);
    const result = await Promise.race([xssPromise, timeoutPromise]);
    await Promise.all([timeoutPromise, triggerPromise, whenStableDetectChanges()]);
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

  function queryPayloadOutput(): HTMLLinkElement {
    return element.querySelector('section.output-area payload-output');
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
