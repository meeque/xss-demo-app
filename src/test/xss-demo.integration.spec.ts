import { TestBed, ComponentFixture } from '@angular/core/testing';
import { timeout, domTreeAvailable, whenStableDetectChanges} from './lib.spec';

import { xssDemoConfig } from '../xss/xss-demo.config';
import { PayloadPresetService } from '../xss/payload-preset.service';
import { PayloadOutputQuality, PayloadOutputService } from '../xss/payload-output.service';
import { XssDemoComponent } from '../xss/xss-demo.component';



interface TestConfig {
  readonly setup?: () => Promise<void>;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
  readonly timeout?: number;
}

interface EnhancedTestConfig extends TestConfig {
  isSkip(): boolean;
  doSetup(): Promise<void>;
  doTrigger(): Promise<void>;
  isExpectXss(): boolean;
  doExpect(): Promise<void>;
  doCleanup(): Promise<void>;
  getTimeout(): number;
}

class DefaultTestConfig implements EnhancedTestConfig {

  private static defaultTimeout = 200;

  static fromRaw<T,C>(configs: (string | T)[], cnstrctr: new (data: (string | T)) => C ): C[] {
    return (configs || []).map(config => new cnstrctr(config));
  }

  static hasAnyXss(configs: EnhancedTestConfig[]): boolean {
    return null != (configs || []).find((config) => config.isExpectXss());
  }

  readonly setup?: () => Promise<void>;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
  readonly timeout?: number;

  public isSkip(): boolean {
    return false;
  }

  public async doSetup(): Promise<void> {
    if (this.setup) {
      return this.setup();
    }
  }

  public async doTrigger(): Promise<void> {
    if (this.trigger) {
      return this.trigger();
    }
  }

  public isExpectXss(): boolean {
    return this.expectXss !== false;
  }

  public async doExpect(): Promise<void> {
    if (this.expect) {
      return this.expect();
    }
  }

  public async doCleanup(): Promise<void> {
    if (this.cleanup) {
      return this
        .cleanup()
        .catch(err => console.error('Ignoring error in custom cleanup function: ' + err));
    }
  }

  public getTimeout(): number {
    return this.timeout ?? DefaultPresetTestConfig.defaultTimeout;
  }
}



interface PresetTestConfig extends TestConfig {
  readonly presetName: string;
  readonly skip?: boolean;
}

interface EnhancedPresetTestConfig extends PresetTestConfig, EnhancedTestConfig {
}

class DefaultPresetTestConfig extends DefaultTestConfig implements EnhancedPresetTestConfig {

  static getByName(configs: EnhancedPresetTestConfig[], name: string): EnhancedPresetTestConfig {
    return (configs || []).find((config) => config.presetName === name);
  }

  static getByNameOrDefault(configs: EnhancedPresetTestConfig[], name: string): EnhancedPresetTestConfig {
    return DefaultPresetTestConfig.getByName(configs, name) || new DefaultPresetTestConfig({presetName: name, expectXss: false});
  }

  readonly presetName: string;
  readonly skip?: boolean;

  constructor(config: string | PresetTestConfig) {
    super();
    if (typeof config === 'object') {
      Object.assign(this, config);
    }
    else if (typeof config === 'string') {
      this.presetName = config;
    }
    else {
      throw new Error('Failed to create PresetTest Config! Constructor arg must be either a string or an object, got ' + typeof config + ' instead.');
    }
  }

  public override isSkip(): boolean {
    return this.skip === true;
  }
}



interface PayloadTestConfig extends TestConfig {
  readonly payload: string;
}

interface EnhancedPayloadTestConfig extends PayloadTestConfig, EnhancedTestConfig {
}

class DefaultPayloadTestConfig extends DefaultTestConfig implements EnhancedPayloadTestConfig {

  readonly payload: string;

  constructor(config: string | PayloadTestConfig) {
    super();
    if (typeof config === 'object') {
      Object.assign(this, config);
    }
    else if (typeof config === 'string') {
      this.payload = config;
    }
    else {
      throw new Error('Failed to create PresetTest Config! Constructor arg must be either a string or an object, got ' + typeof config + ' instead.');
    }
  }
}



describe('Xss Demo App', async () => {

  const payloadPresetServiceStub = new PayloadPresetService(null);
  const payloadOutputServiceStub = new PayloadOutputService(null);

  let fixture: ComponentFixture<XssDemoComponent>;
  let component: XssDemoComponent;
  let element: HTMLElement;

  let payloadInputCombobox: HTMLElement;
  let payloadOutputCombobox: HTMLElement;
  let payloadInputTextArea: HTMLTextAreaElement;
  let alertOverlay: HTMLElement;

  let xssResolve: () => void;



  const cf: Record<string, (name: string, expectXss?: boolean) => EnhancedPresetTestConfig> = {

    clickLink: (name: string, expectXss = true) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          const link = await domTreeAvailable<HTMLElement>(queryOutput(), 'a');
          link.click();
        },
        expectXss,
        timeout: 500
      });
    },

    clickLinkNew: (name: string, expectXss = true) => {
      const MOCK_LINK_TARGET = 'xss-demo_integration-test_click-link-to-new-window';
      let link = null as HTMLLinkElement;
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          link = await domTreeAvailable<HTMLLinkElement>(queryOutput(), 'a');
          if (link.target === '_blank') {
            console.log('Tweaking link with target "_blank" to use target "' + MOCK_LINK_TARGET + '" instead.');
            link.target = MOCK_LINK_TARGET;
          }
          link.click();
        },
        expectXss,
        cleanup: async () => {
          window.open('javascript:window.close();', link.target);
        },
        timeout: 1000
      });
    },

    focusInput: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          const input = await domTreeAvailable<HTMLElement>(queryOutput(), 'input');
          input.dispatchEvent(new Event('focus'));
        },
        timeout: 500
      });
    },

    mouseenter: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          const element = await domTreeAvailable<HTMLElement>(queryOutput(), '[onmouseenter]');
          element.dispatchEvent(new Event('mouseenter'));
        },
        timeout: 500
      });
    },

    injectJsFrame: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await domTreeAvailable<HTMLElement>(queryOutput(), 'iframe.xss-demo-guest');
          const codeField = await domTreeAvailable<HTMLElement>(queryOutput(), 'textarea[name=code]') as HTMLTextAreaElement;
          const runButton = await domTreeAvailable<HTMLElement>(queryOutput(), 'button[name=run]') as HTMLButtonElement;
          codeField.value = 'parent.xss()';
          runButton.click();
        },
        timeout: 500
      });
    },

    injectJsWindow: (name: string) => {
      let windowOpenSpy: jasmine.Spy;
      return new DefaultPresetTestConfig({
        presetName: name,
        setup: async () => {
          windowOpenSpy = spyOn(window, 'open').and.callThrough();
        },
        trigger: async () => {
          const codeField = await domTreeAvailable<HTMLElement>(queryOutput(), 'textarea[name=code]') as HTMLTextAreaElement;
          const runButton = await domTreeAvailable<HTMLElement>(queryOutput(), 'button[name=run]') as HTMLButtonElement;
          codeField.value = 'opener.xss()';
          runButton.click();
        },
        expect: async () => {
          expect(windowOpenSpy).toHaveBeenCalled();
        },
        cleanup: async () => {
          const openedWindow: WindowProxy = windowOpenSpy.calls.mostRecent()?.returnValue;
          openedWindow?.close();
        },
        timeout: 500
      });
    },

    newWindow: (name: string) => {
      let windowOpenSpy: jasmine.Spy;
      return new DefaultPresetTestConfig({
        presetName: name,
        setup: async () => {
          windowOpenSpy = spyOn(window, 'open').and.callThrough();
        },
        expectXss: false,
        expect: async () => {
          expect(windowOpenSpy).toHaveBeenCalled();
        },
        cleanup: async () => {
          const openedWindow: WindowProxy = windowOpenSpy.calls.mostRecent()?.returnValue;
          openedWindow?.close();
        }
      })
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

  const presetsTestConfigsByContextAndOutput: Record<string, Record<string, (string|EnhancedPresetTestConfig)[]>> = {

    HtmlContent: {
      'HtmlContentRaw':          [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'DomInnerHtmlRaw':         [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'DomInnerHtmlRawNoInsert': [                                              'Image onerror', 'Image onerror (legacy flavors)',                                                                                                                                                      'Mixed HTML Content'],
      'JQueryHtmlRaw':           ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryConstructorRaw':    ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryPrependRaw':        ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryAppendRaw':         ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryBeforeRaw':         ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryAfterRaw':          ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryWrapInnerRaw':      [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryWrapRaw':           ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'JQueryReplaceWithRaw':    ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      'NgInnerHtmlTrusted':      [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    },

    HtmlAttribute: {
      'HtmlTitleAttributeRawQuoted':        ['IFrame src', 'IFrame content', 'Image onerror', cf.mouseenter('onmouseenter attribute'),                                                     'Mixed HTML Content'],
      'HtmlTitleAttributeRawUnquoted':      [                                                                                          cf.mouseenter('onmouseenter attribute (unquoted)'),                     ],
      'HtmlTitleAttributeEncodedUnquoted' : [                                                                                          cf.mouseenter('onmouseenter attribute (unquoted)'),                     ],
    },

    Url: {
      'DomLinkHrefRaw':           [cf.clickLinkNew('javascript URL', false), cf.clickLinkNew('javascript URL for parent', false), cf.clickLinkNew('javascript URL for opener'),        cf.clickLinkNew('URL resource content')                                                     ],
      'DomLinkHrefValidated':     [cf.clickLinkNew('javascript URL', false), cf.clickLinkNew('javascript URL for parent', false), cf.clickLinkNew('javascript URL for opener', false), cf.clickLinkNew('URL resource content')                                                     ],
      'JQueryLinkHrefRaw':        [cf.clickLinkNew('javascript URL', false), cf.clickLinkNew('javascript URL for parent', false), cf.clickLinkNew('javascript URL for opener'),        cf.clickLinkNew('URL resource content')                                                     ],
      'JQueryLinkHrefValidated':  [cf.clickLinkNew('javascript URL', false), cf.clickLinkNew('javascript URL for parent', false), cf.clickLinkNew('javascript URL for opener', false), cf.clickLinkNew('URL resource content')                                                     ],
      'NgLinkHrefTrusted':        [cf.clickLinkNew('javascript URL', false), cf.clickLinkNew('javascript URL for parent', false), cf.clickLinkNew('javascript URL for opener'),        cf.clickLinkNew('URL resource content')                                                     ],
      'NgLinkHrefSanitized':      [cf.clickLinkNew('javascript URL', false), cf.clickLinkNew('javascript URL for parent', false), cf.clickLinkNew('javascript URL for opener', false), cf.clickLinkNew('URL resource content')                                                     ],
      'DomIframeSrcRaw':          [                                                                                                                                                                                             'javascript URL for parent', 'URL resource content'],
      'DomIframeSrcValidated':    [                                                                                                                                                                                                                          'URL resource content'],
      'JQueryIframeSrcRaw':       [                                                                                                                                                                                             'javascript URL for parent', 'URL resource content'],
      'JQueryIframeSrcValidated': [                                                                                                                                                                                                                          'URL resource content'],
      'NgIframeSrcTrusted':       [                                                                                                                                                                                             'javascript URL for parent', 'URL resource content'],
    },

    JavaScript: {
      'DomScriptBlockStringLiteralDq': [                                                      'JS code breaking "string" literal'                                                                                                                                                                                                                                                                                                                                                                                                                                         ],
      'DomScriptBlockStringLiteralSq': [                                                                                           'JS code breaking \'string\' literal'                                                                                                                                                                                                                                                                                                                                                                                                  ],
      'DomScriptBlockRaw':             ['pure JS code', 'pure JS code for parent and opener',                                                                            cf.injectJsFrame('Inject JS into document (frame)'), cf.injectJsWindow('Inject JS into document (window)'), cf.newWindow('Interact with Plain HTML mock (window)'), cf.newWindow('Interact with Browser Storage mock (window)'), cf.newWindow('Interact with Cookies mock (window)'), cf.newWindow('Interact with Post Message mock (window)'), 'JSFuck', cf.deface('pure JS defacement attack') ],
    },
  }



  const cf2: Record<string, (name: string, expectXss?: boolean) => EnhancedPayloadTestConfig> = {

    noXss: (payload: string) => {
      return new DefaultPayloadTestConfig({
        payload: payload,
        expectXss: false
      });
    }

  }

  const payloadTestConfigsByContextAndOutput: Record<string, Record<string, (string|EnhancedPayloadTestConfig)[]>> = {

    null: {
      DoubleTrouble:        ['&lt;img src="." onerror="xss()"&gt;', cf2.noXss('<img src="." onerror="xss()">')],
      WhatsLeft:            ['<im<br>g src="." onerror="xss()">',   cf2.noXss('<img src="." onerror="xss()">')],
      LookMomNoParentheses: ['xss``',                               cf2.noXss('xss()')                        ],
      LikeLiterally:        ['${xss()}',                            cf2.noXss('xss()')                        ],
      TheGreatEscape:       ['\\"; xss(); //;',                     cf2.noXss('"; xss(); //;')                ],
    },
  }



  beforeEach(async () => {
    TestBed.configureTestingModule(xssDemoConfig);
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(XssDemoComponent);
    fixture.detectChanges();

    component = fixture.componentInstance;
    element = fixture.nativeElement;

    payloadInputTextArea = element.querySelector('section.input-area textarea.payload');
    payloadInputCombobox = element.querySelector('section.input-area xss-combobox-input');
    payloadOutputCombobox = element.querySelector('section.output-area xss-combobox-input');
    alertOverlay = element.querySelector('.fd-shell__overlay.fd-overlay--alert');

    // ignore global errors caused by dynamically loaded scripts (e.g. script blocks from xss payloads)
    window.onerror = (message, source, lineno, colno, error) => {
      console.error(error);
    };

    const xssOriginal: () => void = window['xss'];
    window['xss'] = () => {
      xssOriginal();
      xssResolve();
    };
  });

  it('should be created', async () => {
    expect(component).toBeDefined();
  });

  for (const outputCollection of payloadOutputServiceStub.descriptors) {

    const presetCollections = payloadPresetServiceStub.descriptors.filter(descriptor => descriptor.context == outputCollection.context);

    describe('with output collection  "' + outputCollection.name + '" (' + outputCollection.context + ')', () => {

      for (const outputDescriptor of outputCollection.items) {

        const rawPresetTestConfigs = presetsTestConfigsByContextAndOutput[String(outputCollection.context)] || {};
        const presetTestConfigs = DefaultTestConfig.fromRaw(rawPresetTestConfigs[outputDescriptor.id], DefaultPresetTestConfig);

        const rawPayloadTestConfigs = payloadTestConfigsByContextAndOutput[String(outputCollection.context)] || {};
        const payloadTestConfigs = DefaultTestConfig.fromRaw(rawPayloadTestConfigs[outputDescriptor.id], DefaultPayloadTestConfig);

        describe('and payload output "' + outputDescriptor.name + '"', () => {

          if(DefaultTestConfig.hasAnyXss([... presetTestConfigs, ... payloadTestConfigs])) {

            it('should not be marked as "Recommended", because some tests trigger XSS', () => {
              expect(outputDescriptor.quality).not.toBe(PayloadOutputQuality.Recommended);
            });

          }
          else {

            it('should not be marked as "Insecure", because no tests trigger XSS', () => {
              expect(outputDescriptor.quality).not.toBe(PayloadOutputQuality.Insecure);
            });

          }



          // payload output tests based on payload presets

          for (const presetCollection of presetCollections) {

            describe('with preset collection "' + presetCollection.name + '" (' + outputCollection.context + ')', () => {

              for (const presetDescriptor of presetCollection.items) {

                const presetTestConfig = DefaultPresetTestConfig.getByNameOrDefault(presetTestConfigs, presetDescriptor.name);
                if (presetTestConfig.isSkip()) {
                  continue;
                }

                describe('and payload preset "' + presetDescriptor.name + '"', () => {

                  runTestConfig(
                    presetTestConfig,
                    async () => {
                      await selectInputOutput(presetCollection.name, presetTestConfig.presetName, outputCollection.name, outputDescriptor.name);
                    }
                  );
                });
              }
            });
          }



          // payload output tests based on custom test payload

          for (const payloadTestConfig of payloadTestConfigs) {

            describe('with test payload "' + payloadTestConfig.payload + '"', () => {

              runTestConfig(
                payloadTestConfig,
                async () => {
                  payloadInputTextArea.value = '';
                  await selectInputOutput(null, null, outputCollection.name, outputDescriptor.name);
                  expect(alertOverlay.querySelector('.alert-xss-triggered'))
                    .withContext('show XSS alert message')
                    .toEqual(null);
                  payloadInputTextArea.value = payloadTestConfig.payload;
                  payloadInputTextArea.dispatchEvent(new Event('input'));
                  await whenStableDetectChanges(fixture);
                }
              );
            });
          }
        });
      }
    });
  }

  function runTestConfig(testConfig: EnhancedTestConfig, deployTestPayload: () => Promise<void>) {

    const expectXss = testConfig.isExpectXss();

    it(
      'should '
        + (expectXss ? '' : 'NOT ')
        + 'trigger XSS'
        + (testConfig.trigger ? ' with custom trigger' : '')
        + (testConfig.expect ? ' with custom expectation' : ''),
      async () => {
        await testConfig.doSetup();
        const xssPromise = nextXssPromise();

        await deployTestPayload();

        const triggerPromise = testConfig.doTrigger();
        const timeoutPromise = timeout(testConfig.getTimeout(), false);
        await expectAsync(Promise.race([xssPromise, timeoutPromise]))
          .withContext('call xss() probe before timeout')
          .toBeResolvedTo(expectXss);

        expect(alertOverlay.querySelector('.alert-xss-triggered'))
          .withContext('show XSS alert message')
          .toEqual(expectXss ? jasmine.anything() : null);

        await expectAsync(testConfig.doExpect())
          .withContext('custom expectations')
          .toBeResolved();

        const cleanupPromise = testConfig.doCleanup();
        await Promise.all([timeoutPromise, triggerPromise, cleanupPromise, whenStableDetectChanges(fixture)]);
      }
    );
  }

  async function selectInputOutput(inputContext: string, inputName: string, outputContext: string, outputName: string): Promise<void> {

    try {
      queryMenuLink(payloadInputCombobox, inputContext, inputName).dispatchEvent(new Event('click'));
    } catch (err) {
      console.error(err);
    }

    try {
      queryMenuLink(payloadOutputCombobox, outputContext, outputName).dispatchEvent(new Event('click'));
    } catch (err) {
      console.error(err);
    }

    await whenStableDetectChanges(fixture);
  }

  function queryMenuLink(combobox: HTMLElement, groupLabelText: string, linkText: string): HTMLLinkElement {
    const groupLabelElement = Array
      .from(combobox.querySelectorAll('div.fd-popover__body div.fd-list__group-header'))
      .find((label: HTMLLabelElement) => label.textContent.trim() == groupLabelText) as HTMLElement;
    return Array
      .from(groupLabelElement.nextElementSibling.querySelectorAll('li a'))
      .find((a: HTMLLinkElement) => a.textContent.trim() == linkText) as HTMLLinkElement;
  }

  function queryPayloadOutputComponent(): HTMLElement {
    return element.querySelector('section.output-area xss-payload-output');
  }

  function queryOutput(): HTMLElement {
    return queryPayloadOutputComponent().querySelector('.live-output.fd-layout-panel .fd-layout-panel__body');
  }

  function nextXssPromise(): Promise<boolean> {
    return new Promise(resolve => {
      xssResolve = () => resolve(true);
    });
  }
});
