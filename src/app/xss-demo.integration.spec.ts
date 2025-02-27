import { TestBed, ComponentFixture } from '@angular/core/testing';

import { XssContext } from './xss-demo.common';
import { xssDemoConfig } from './xss-demo.config';
import { PayloadPresetService } from './payload-preset.service';
import { PayloadOutputQuality, PayloadOutputService } from './payload-output.service';
import { XssDemoComponent } from './xss-demo.component';


interface PresetTestConfig {
  readonly presetName: string;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
  readonly timeout?: number;
}

interface EnhancedPresetTestConfig extends PresetTestConfig {
  isExpectXss(): boolean;
  getTimeout(): number;
  doTrigger(): Promise<void>;
  doExpect(): Promise<void>;
  doCleanup(): Promise<void>;
}

class DefaultPresetTestConfig implements EnhancedPresetTestConfig {

  private static defaultTimeout = 200;

  readonly presetName: string;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
  readonly timeout?: number;

  static fromRaw(configs: (string | PresetTestConfig)[]): EnhancedPresetTestConfig[] {
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

  public isExpectXss(): boolean {
    return this.expectXss !== false;
  }

  public getTimeout(): number {
    return (this.timeout != null) ? this.timeout : DefaultPresetTestConfig.defaultTimeout;
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

interface PresetTestConfigFactory {
  [config: string]: (presetName: string) => EnhancedPresetTestConfig;
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



  const cf: PresetTestConfigFactory = {
    clickLink: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await timeout(250);
          queryOutput().querySelector('a').click();
        },
        timeout: 1000
      });
    },
    clickLinkNew: (name: string) => {
      const mockLinkTarget = 'xss-demo_integration-test_click-link-to-new-window';
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await timeout(500);
          const link = queryOutput().querySelector('a');
          if (link.target === '_blank') {
            console.log('Tweaking link with target "_blank" to use target "' + mockLinkTarget + '" instead.');
            link.target = mockLinkTarget;
          }
          link.click();
        },
        cleanup: async () => {
          await timeout(100);
          window.open('javascript:window.close();', mockLinkTarget);
        },
        timeout: 2000
      });
    },
    focusInput: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await timeout(200);
          queryOutput().querySelector('input').dispatchEvent(new Event('focus'));
        },
        timeout: 500
      });
    },
    mouseenter: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await timeout(200);
          queryOutput().querySelector('[onmouseenter]').dispatchEvent(new Event('mouseenter'));
        },
        timeout: 500
      });
    },
    deface: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
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
        },
        timeout: 1000
      });
    }
  }

  const presetsTestConfigsByContextAndOutput: {[context: string]: { [output: string]: (string|EnhancedPresetTestConfig)[] }} = {};

  presetsTestConfigsByContextAndOutput[XssContext.HtmlContent.toString()] = {
    'HtmlContent':          [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'DomInnerHtml':         [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'DomInnerHtmlNoOutput': [                                              'Image onerror', 'Image onerror (legacy flavors)',                                                                                                                                              'Mixed HTML Content'],
    'JQueryHtml':           ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryConstructor':    ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryPrepend':        ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryAppend':         ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryBefore':         ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryAfter':          ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryWrapInner':      [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryWrap':           ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'JQueryReplaceWith':    ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'NgTrusted':            [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
  };

  presetsTestConfigsByContextAndOutput[XssContext.HtmlAttribute.toString()] = {
    'HtmlAttribute':                 ['IFrame src', 'Image onerror', cf.mouseenter('onmouseenter attribute'),                                                     'Mixed HTML Content'],
    'HtmlUnquotedAttribute':         [                                                                        cf.mouseenter('onmouseenter attribute (unquoted)'),                     ],
    'HtmlEncodedUnquotedAttribute' : [                                                                        cf.mouseenter('onmouseenter attribute (unquoted)'),                     ],
  };

  presetsTestConfigsByContextAndOutput[XssContext.Url.toString()] = {
    'IframeDomTrusted': ['javascript URL (for parent)'                                ],
    'IframeNgTrusted':  ['javascript URL (for parent)'                                ],
    'LinkDomTrusted':   [                               cf.clickLink('javascript URL')],
    'LinkNgTrusted':    [                               cf.clickLink('javascript URL')],
  };

  presetsTestConfigsByContextAndOutput[XssContext.Css.toString()] = {
  };

  presetsTestConfigsByContextAndOutput[XssContext.JavaScript.toString()] = {
    'DqStringDomTrusted': ['JS code breaking "string"'                                                                                       ],
    'SqStringDomTrusted': [                             'JS code breaking \'string\''                                                        ],
    'BlockDomTrusted':    [                                                            'pure JS code', cf.deface('pure JS defacement attack')],
  };



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

          } else {

            it('should not be marked as "Insecure"', () => {
              expect(outputDescriptor.quality).not.toBe(PayloadOutputQuality.Insecure);
            });

          }

          for (const presetDescriptor of presetContextDescriptor.items) {

            const presetTestConfig = DefaultPresetTestConfig.getByNameOrDefault(presetTestConfigs, presetDescriptor.name);
            const expectXss = presetTestConfig.isExpectXss();

            it(
              'should '
                + (expectXss ? '' : 'NOT ')
                + 'trigger XSS for payload "' + presetDescriptor.name + '"'
                + (presetTestConfig.trigger ? ' with custom trigger' : '')
                + (presetTestConfig.expect ? ' with custom expectation' : ''),
              async () => {

                const xssPromise = nextXssPromise();
                await selectInputOutput(context.name, presetTestConfig.presetName, outputDescriptor.name);
                const triggerPromise = presetTestConfig.doTrigger();
                const timeoutPromise = timeout(presetTestConfig.getTimeout());
                await expectAsync(Promise.race([xssPromise, timeoutPromise]))
                  .withContext('call xss() probe before timeout')
                  .toBeResolvedTo(expectXss);

                expect(alertOverlay.querySelector('.alert-xss-triggered'))
                  .withContext('show XSS alert message')
                  .toEqual(expectXss ? jasmine.anything() : null);

                await expectAsync(presetTestConfig.doExpect())
                  .withContext('custom expectations')
                  .toBeResolved();

                const cleanupPromise = presetTestConfig.doCleanup();
                await Promise.all([timeoutPromise, triggerPromise, cleanupPromise, whenStableDetectChanges()]);
              });

          }
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

  function queryPayloadOutputComponent(): HTMLElement {
    return element.querySelector('section.output-area payload-output');
  }

  function queryOutput(): HTMLElement {
    return queryPayloadOutputComponent().querySelector('.output.fd-layout-panel .fd-layout-panel__body');
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
