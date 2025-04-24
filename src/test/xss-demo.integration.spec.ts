import { TestBed, ComponentFixture } from '@angular/core/testing';
import { timeout, domTreeAvailable, whenStableDetectChanges} from './lib.spec';

import { XssContext } from '../app/xss-demo.common';
import { xssDemoConfig } from '../app/xss-demo.config';
import { PayloadPresetService } from '../app/payload-preset.service';
import { PayloadOutputQuality, PayloadOutputService } from '../app/payload-output.service';
import { XssDemoComponent } from '../app/xss-demo.component';


interface PresetTestConfig {
  readonly presetName: string;
  readonly skip?: boolean;
  readonly setup?: () => Promise<void>;
  readonly trigger?: () => Promise<void>;
  readonly expectXss?: boolean;
  readonly expect?: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
  readonly timeout?: number;
}

interface EnhancedPresetTestConfig extends PresetTestConfig {
  isSkip(): boolean;
  doSetup(): Promise<void>;
  doTrigger(): Promise<void>;
  isExpectXss(): boolean;
  doExpect(): Promise<void>;
  doCleanup(): Promise<void>;
  getTimeout(): number;
}

class DefaultPresetTestConfig implements EnhancedPresetTestConfig {

  private static defaultTimeout = 200;

  readonly presetName: string;
  readonly skip?: boolean;
  readonly setup?: () => Promise<void>;
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

  public isSkip(): boolean {
    return this.skip === true;
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
    return (this.timeout != null) ? this.timeout : DefaultPresetTestConfig.defaultTimeout;
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
          const link = await domTreeAvailable<HTMLElement>(queryOutput(), 'a');
          link.click();
        },
        timeout: 1000
      });
    },
    clickLinkNew: (name: string) => {
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
        cleanup: async () => {
          window.open('javascript:window.close();', link.target);
        },
        timeout: 2000
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
    newWindow: (name: string) => {
      let windowOpenSpy: jasmine.Spy;
      return new DefaultPresetTestConfig({
        presetName: name,
        setup: async () => {
          windowOpenSpy = spyOn(window, 'open').and.callThrough();
        },
        expectXss: false,
        cleanup: async () => {
          const openedWindow: WindowProxy = windowOpenSpy.calls.mostRecent()?.returnValue;
          openedWindow?.close();
        }
      })
    },
    newWindowXss: (name: string) => {
      let windowOpenSpy: jasmine.Spy;
      return new DefaultPresetTestConfig({
        presetName: name,
        setup: async () => {
          windowOpenSpy = spyOn(window, 'open').and.callThrough();
        },
        expectXss: true,
        cleanup: async () => {
          const openedWindow: WindowProxy = windowOpenSpy.calls.mostRecent()?.returnValue;
          openedWindow?.close();
        }
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
    },
    defaceIframe: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        expectXss: false,
        expect: async () => {
          const iframe = queryOutput().querySelector('iframe');
          expect(iframe.contentDocument.body.childElementCount).toBe(1);
          expect(iframe.contentDocument.body.querySelector('div.xss-demo-defacement')).not.toBeNull();
        },
        timeout: 1000
      });
    },
    defaceNewWindow: (name: string) => {
      let windowOpenSpy: jasmine.Spy;
      return new DefaultPresetTestConfig({
        presetName: name,
        setup: async () => {
          windowOpenSpy = spyOn(window, 'open').and.callThrough();
        },
        expectXss: false,
        expect: async () => {
          const openedWindow: WindowProxy = windowOpenSpy.calls.mostRecent()?.returnValue;
          expect(openedWindow.document.body.childElementCount).toBe(1);
          expect(openedWindow.document.body.querySelector('div.xss-demo-defacement')).not.toBeNull();
        },
        cleanup: async () => {
          const openedWindow: WindowProxy = windowOpenSpy.calls.mostRecent()?.returnValue;
          openedWindow?.close();
        },
        timeout: 1000
      });
    },
    skip: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        skip: true
      });
    }
  }

  const presetsTestConfigsByContextAndOutput: {[context: string]: { [output: string]: (string|EnhancedPresetTestConfig)[] }} = {};

  presetsTestConfigsByContextAndOutput[XssContext.HtmlContent.toString()] = {
    'HtmlContent':          [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'DomInnerHtml':         [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLinkNew('A link target content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    'DomInnerHtmlNoOutput': [                                              'Image onerror', 'Image onerror (legacy flavors)',                                                                                                                                                 'Mixed HTML Content'],
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
    'LinkDomTrusted':      [cf.clickLink('javascript URL')                               ],
    'LinkJQueryTrusted':   [cf.clickLink('javascript URL')                               ],
    'LinkNgTrusted':       [cf.clickLink('javascript URL')                               ],
    'IframeDomTrusted':    [                                'javascript URL (for parent)'],
    'IframeJQueryTrusted': [                                'javascript URL (for parent)'],
    'IframeNgTrusted':     [                                'javascript URL (for parent)'],
  };

  presetsTestConfigsByContextAndOutput[XssContext.Css.toString()] = {
  };

  presetsTestConfigsByContextAndOutput[XssContext.JavaScript.toString()] = {
    'DqStringDomTrusted':        [                                                                                     'JS code breaking "string" literal'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ],
    'SqStringDomTrusted':        [                                                                                                                                        'JS code breaking \'string\' literal'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 ],
    'BlockDomTrusted':           ['pure JS code',               'pure JS code for parent and opener',                                                                                                                          cf.newWindow('Inject JS into document (window)'),                                                         cf.newWindow('Interact with Plain HTML mock (window)'),                                                              cf.newWindow('Interact with Browser Storage mock (window)'),                                                      cf.newWindow('Interact with Cookies mock (window)'),                                                           cf.newWindow('Interact with Post Message mock (window)'), 'JSFuck',               cf.deface('pure JS defacement attack')         ],
    'BlockDomPlainMockIframe':   [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),                                                              cf.skip('Interact with Plain HTML mock (window)'),                                                                   cf.skip('Interact with Browser Storage mock (window)'),                                                           cf.skip('Interact with Cookies mock (window)'),                                                                cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceIframe('pure JS defacement attack')   ],
    'BlockDomPlainMockWindow':   [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),      cf.newWindow('Interact with Plain HTML mock (iframe)'), cf.skip('Interact with Plain HTML mock (window)'),      cf.newWindow('Interact with Browser Storage mock (iframe)'), cf.skip('Interact with Browser Storage mock (window)'),      cf.newWindow('Interact with Cookies mock (iframe)'), cf.skip('Interact with Cookies mock (window)'),      cf.newWindow('Interact with Post Message mock (iframe)'), cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceNewWindow('pure JS defacement attack')],
    'BlockDomStorageMockIframe': [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),                                                              cf.skip('Interact with Plain HTML mock (window)'),                                                                   cf.skip('Interact with Browser Storage mock (window)'),                                                           cf.skip('Interact with Cookies mock (window)'),                                                                cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceIframe('pure JS defacement attack')   ],
    'BlockDomStorageMockWindow': [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),      cf.newWindow('Interact with Plain HTML mock (iframe)'), cf.skip('Interact with Plain HTML mock (window)'),      cf.newWindow('Interact with Browser Storage mock (iframe)'), cf.skip('Interact with Browser Storage mock (window)'),      cf.newWindow('Interact with Cookies mock (iframe)'), cf.skip('Interact with Cookies mock (window)'),      cf.newWindow('Interact with Post Message mock (iframe)'), cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceNewWindow('pure JS defacement attack')],
    'BlockDomCookiesMockIframe': [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),                                                              cf.skip('Interact with Plain HTML mock (window)'),                                                                   cf.skip('Interact with Browser Storage mock (window)'),                                                           cf.skip('Interact with Cookies mock (window)'),                                                                cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceIframe('pure JS defacement attack')   ],
    'BlockDomCookiesMockWindow': [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),      cf.newWindow('Interact with Plain HTML mock (iframe)'), cf.skip('Interact with Plain HTML mock (window)'),      cf.newWindow('Interact with Browser Storage mock (iframe)'), cf.skip('Interact with Browser Storage mock (window)'),      cf.newWindow('Interact with Cookies mock (iframe)'), cf.skip('Interact with Cookies mock (window)'),      cf.newWindow('Interact with Post Message mock (iframe)'), cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceNewWindow('pure JS defacement attack')],
    'BlockDomMessageMockIframe': [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),                                                              cf.skip('Interact with Plain HTML mock (window)'),                                                                   cf.skip('Interact with Browser Storage mock (window)'),                                                           cf.skip('Interact with Cookies mock (window)'),                                                                cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceIframe('pure JS defacement attack')   ],
    'BlockDomMessageMockWindow': [cf.newWindow('pure JS code'), cf.newWindowXss('pure JS code for parent and opener'), cf.newWindow('JS code breaking "string" literal'), cf.newWindow('JS code breaking \'string\' literal'), cf.skip('Inject JS into document (window)'),      cf.newWindow('Interact with Plain HTML mock (iframe)'), cf.skip('Interact with Plain HTML mock (window)'),      cf.newWindow('Interact with Browser Storage mock (iframe)'), cf.skip('Interact with Browser Storage mock (window)'),      cf.newWindow('Interact with Cookies mock (iframe)'), cf.skip('Interact with Cookies mock (window)'),      cf.newWindow('Interact with Post Message mock (iframe)'), cf.skip('Interact with Post Message mock (window)'),      cf.newWindow('JSFuck'), cf.defaceNewWindow('pure JS defacement attack')],
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
            if (presetTestConfig.isSkip()) {
              continue;
            }
            const expectXss = presetTestConfig.isExpectXss();

            it(
              'should '
                + (expectXss ? '' : 'NOT ')
                + 'trigger XSS for payload "' + presetDescriptor.name + '"'
                + (presetTestConfig.trigger ? ' with custom trigger' : '')
                + (presetTestConfig.expect ? ' with custom expectation' : ''),
              async () => {
                await presetTestConfig.doSetup();
                const xssPromise = nextXssPromise();
                await selectInputOutput(context.name, presetTestConfig.presetName, outputDescriptor.name);
                const triggerPromise = presetTestConfig.doTrigger();
                const timeoutPromise = timeout(presetTestConfig.getTimeout(), false);
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
                await Promise.all([timeoutPromise, triggerPromise, cleanupPromise, whenStableDetectChanges(fixture)]);
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

    await whenStableDetectChanges(fixture);
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
    return queryPayloadOutputComponent().querySelector('.live-output.fd-layout-panel .fd-layout-panel__body');
  }

  function nextXssPromise(): Promise<boolean> {
    return new Promise(resolve => {
      xssResolve = () => resolve(true);
    });
  }
});
