/* eslint @stylistic/no-multi-spaces: ['off'] */
/* eslint @stylistic/array-bracket-spacing: ['off'] */
/* eslint @stylistic/key-spacing: ['off'] */



import { By, WebElement, WebElementPromise, until } from 'selenium-webdriver';

import { findAndExpectOne, WindowTracker } from './test-lib';

import '@angular/compiler';

import { PayloadPresetService } from '../xss/payload-preset.service';
import { PayloadOutputQuality, PayloadOutputService } from '../xss/payload-output.service';



interface TestConfig {
  readonly setup?: () => Promise<void>
  readonly trigger?: () => Promise<void>
  readonly expectXss?: boolean
  readonly expect?: () => Promise<void>
  readonly cleanup?: () => Promise<void>
  readonly timeout?: number
}

interface EnhancedTestConfig extends TestConfig {
  isSkip(): boolean
  doSetup(): Promise<void>
  doTrigger(): Promise<void>
  isExpectXss(): boolean
  doExpect(): Promise<void>
  doCleanup(): Promise<void>
  getTimeout(): number
}

class DefaultTestConfig implements EnhancedTestConfig {
  private static defaultTimeout = 200;

  static fromRaw<T, C>(configs: (string | T)[], cnstrctr: new (data: (string | T)) => C): C[] {
    return (configs || []).map(config => new cnstrctr(config));
  }

  static hasAnyXss(configs: EnhancedTestConfig[]): boolean {
    return null != (configs || []).find(config => config.isExpectXss());
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
  readonly presetName: string
  readonly skip?: boolean
}

interface EnhancedPresetTestConfig extends PresetTestConfig, EnhancedTestConfig {
}

class DefaultPresetTestConfig extends DefaultTestConfig implements EnhancedPresetTestConfig {
  static getByName(configs: EnhancedPresetTestConfig[], name: string): EnhancedPresetTestConfig {
    return (configs || []).find(config => config.presetName === name);
  }

  static getByNameOrDefault(configs: EnhancedPresetTestConfig[], name: string): EnhancedPresetTestConfig {
    return DefaultPresetTestConfig.getByName(configs, name) || new DefaultPresetTestConfig({ presetName: name, expectXss: false });
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
  readonly payload: string
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



describe('Xss Demo App', () => {
  const payloadPresetServiceStub = new PayloadPresetService(null);
  const payloadOutputServiceStub = new PayloadOutputService(null);

  let windowTracker: WindowTracker;
  let app: WebElement;

  let payloadInputCombobox: WebElement;
  let payloadOutputCombobox: WebElement;
  let payloadInputTextArea: WebElement;
  let alertOverlay: WebElement;

  const presetTestConfigFactory: Record<string, (name: string, expectXss?: boolean) => EnhancedPresetTestConfig> = {
    clickLink: (name: string, expectXss = true) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await findOutput().findElement((By.css('a'))).click();
        },
        expectXss,
        timeout: 500,
      });
    },

    focusInput: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          const input = await findOutput().findElement((By.css('input')));
          await input.click();
        },
        timeout: 500,
      });
    },

    mouseenter: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          const element = await findOutput().findElement((By.css('[onmouseenter]')));
          const actions = driver.actions({ async: true });
          await actions.move({ origin: element }).perform();
        },
        timeout: 500,
      });
    },

    injectJsFrame: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          await findOutput().findElement((By.css('iframe.xss-demo-guest')));
          const codeField = await findOutput().findElement((By.css('textarea[name=code]')));
          const runButton = await findOutput().findElement((By.css('button[name=run]')));
          await codeField.clear();
          await codeField.sendKeys('parent.xss()');
          await runButton.click();
        },
        timeout: 500,
      });
    },

    injectJsWindow: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        trigger: async () => {
          const codeField = await findOutput().findElement((By.css('textarea[name=code]')));
          const runButton = await findOutput().findElement((By.css('button[name=run]')));
          await codeField.clear();
          await codeField.sendKeys('opener.xss()');
          await runButton.click();
        },
        expect: async () => {
          await expect(windowTracker.getNewWindows()).resolves.toHaveLength(1);
        },
        timeout: 500,
      });
    },

    newWindow: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        expectXss: false,
        expect: async () => {
          await expect(windowTracker.getNewWindows()).resolves.toHaveLength(1);
        },
        timeout: 500,
      });
    },

    deface: (name: string) => {
      return new DefaultPresetTestConfig({
        presetName: name,
        expectXss: false,
        expect: async () => {
          const appElement = await driver.wait(until.elementLocated(By.css('article.fd-shell__app')), 2500);
          const appChildElements = await appElement.findElements(By.css(':scope > *'));
          expect(appChildElements.length).toBe(1);
          await expect(appElement.findElement(By.css('div.xss-demo-defacement'))).resolves.not.toEqual(null);
        },
        timeout: 1000,
      });
    },
  };

  const cf = presetTestConfigFactory;

  const presetsTestConfigsByContextAndOutput: Record<string, Record<string, (string | EnhancedPresetTestConfig)[]>> = {
    HtmlContent: {
      HtmlContentRaw:          [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      DomInnerHtmlRaw:         [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      DomInnerHtmlRawNoInsert: [                                              'Image onerror', 'Image onerror (legacy flavors)',                                                                                                                                                      'Mixed HTML Content'],
      JQueryHtmlRaw:           ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryConstructorRaw:    ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryPrependRaw:        ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryAppendRaw:         ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryBeforeRaw:         ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryAfterRaw:          ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryWrapInnerRaw:      [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryWrapRaw:           ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      JQueryReplaceWithRaw:    ['Script tag', 'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
      NgInnerHtmlTrusted:      [              'IFrame src', 'IFrame content', 'Image onerror', 'Image onerror (legacy flavors)', cf.clickLink('A link href'), cf.clickLink('A link destination content'), cf.focusInput('Input field onfocus'), cf.mouseenter('Div onmouseenter'), 'Mixed HTML Content'],
    },

    HtmlAttribute: {
      HtmlTitleAttributeRawQuoted:       ['IFrame src', 'IFrame content', 'Image onerror', cf.mouseenter('onmouseenter attribute'),                                                     'Mixed HTML Content'],
      HtmlTitleAttributeRawUnquoted:     [                                                                                          cf.mouseenter('onmouseenter attribute (unquoted)')                      ],
      HtmlTitleAttributeEncodedUnquoted: [                                                                                          cf.mouseenter('onmouseenter attribute (unquoted)')                      ],
    },

    Url: {
      DomLinkHrefRaw:           [cf.clickLink('javascript URL', false), cf.clickLink('javascript URL for parent', false), cf.clickLink('javascript URL for opener'),        cf.clickLink('URL resource content')                                                     ],
      DomLinkHrefValidated:     [cf.clickLink('javascript URL', false), cf.clickLink('javascript URL for parent', false), cf.clickLink('javascript URL for opener', false), cf.clickLink('URL resource content')                                                     ],
      JQueryLinkHrefRaw:        [cf.clickLink('javascript URL', false), cf.clickLink('javascript URL for parent', false), cf.clickLink('javascript URL for opener'),        cf.clickLink('URL resource content')                                                     ],
      JQueryLinkHrefValidated:  [cf.clickLink('javascript URL', false), cf.clickLink('javascript URL for parent', false), cf.clickLink('javascript URL for opener', false), cf.clickLink('URL resource content')                                                     ],
      NgLinkHrefTrusted:        [cf.clickLink('javascript URL', false), cf.clickLink('javascript URL for parent', false), cf.clickLink('javascript URL for opener'),        cf.clickLink('URL resource content')                                                     ],
      NgLinkHrefSanitized:      [cf.clickLink('javascript URL', false), cf.clickLink('javascript URL for parent', false), cf.clickLink('javascript URL for opener', false), cf.clickLink('URL resource content')                                                     ],
      DomIframeSrcRaw:          [                                                                                                                                                                                             'javascript URL for parent', 'URL resource content'],
      DomIframeSrcValidated:    [                                                                                                                                                                                                                          'URL resource content'],
      JQueryIframeSrcRaw:       [                                                                                                                                                                                             'javascript URL for parent', 'URL resource content'],
      JQueryIframeSrcValidated: [                                                                                                                                                                                                                          'URL resource content'],
      NgIframeSrcTrusted:       [                                                                                                                                                                                             'javascript URL for parent', 'URL resource content'],
    },

    JavaScript: {
      DomScriptBlockStringLiteralDq: [                                                      'JS code breaking "string" literal'                                                                                                                                                                                                                                                                                                                                                                                                                                         ],
      DomScriptBlockStringLiteralSq: [                                                                                           'JS code breaking \'string\' literal'                                                                                                                                                                                                                                                                                                                                                                                                  ],
      DomScriptBlockRaw:             ['pure JS code', 'pure JS code for parent and opener',                                                                            cf.injectJsFrame('Inject JS into document (frame)'), cf.injectJsWindow('Inject JS into document (window)'), cf.newWindow('Interact with Plain HTML mock (window)'), cf.newWindow('Interact with Browser Storage mock (window)'), cf.newWindow('Interact with Cookies mock (window)'), cf.newWindow('Interact with Post Message mock (window)'), 'JSFuck', cf.deface('pure JS defacement attack') ],
    },
  };

  const payloadTestConfigFactory: Record<string, (name: string, expectXss?: boolean) => EnhancedPayloadTestConfig> = {
    noXss: (payload: string) => {
      return new DefaultPayloadTestConfig({
        payload: payload,
        expectXss: false,
      });
    },
  };

  const cf2 = payloadTestConfigFactory;

  const payloadTestConfigsByContextAndOutput: Record<string, Record<string, (string | EnhancedPayloadTestConfig)[]>> = {
    null: {
      DoubleTrouble:        ['&lt;img src="." onerror="xss()"&gt;', cf2.noXss('<img src="." onerror="xss()">')],
      WhatsLeft:            ['<im<br>g src="." onerror="xss()">',   cf2.noXss('<img src="." onerror="xss()">')],
      LookMomNoParentheses: ['xss``',                               cf2.noXss('xss()')                        ],
      LikeLiterally:        ['${xss()}',                            cf2.noXss('xss()')                        ],
      TheGreatEscape:       ['\\"; xss(); //;',                     cf2.noXss('"; xss(); //;')                ],
    },
  };

  beforeEach(async () => {
    await driver.get(xssDemoAppUrl);
    windowTracker = await WindowTracker.track(driver);

    app = await driver.wait(until.elementLocated(By.css('xss-demo-root')), 2500);

    payloadInputTextArea = await app.findElement(By.css('section.input-area textarea.payload'));
    payloadInputCombobox = await app.findElement(By.css('section.input-area xss-combobox-input'));
    payloadOutputCombobox = await app.findElement(By.css('section.output-area xss-combobox-input'));
    alertOverlay = await app.findElement(By.css('.fd-shell__overlay.fd-overlay--alert'));
  });

  afterEach(async () => {
    await windowTracker.closeAllNewWindows();
  });

  test('should be created', async () => {
    expect(app).toBeDefined();
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
          if (DefaultTestConfig.hasAnyXss([...presetTestConfigs, ...payloadTestConfigs])) {
            test('should not be marked as "Recommended", because some tests trigger XSS', () => {
              expect(outputDescriptor.quality).not.toBe(PayloadOutputQuality.Recommended);
            });
          }
          else {
            test('should not be marked as "Insecure", because no tests trigger XSS', () => {
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
                    () => selectInputOutput(presetCollection.name, presetTestConfig.presetName, outputCollection.name, outputDescriptor.name),
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
                  await payloadInputTextArea.clear();
                  await selectInputOutput(null, null, outputCollection.name, outputDescriptor.name);
                  await expect(alertOverlay.findElement(By.css('.alert-xss-triggered'))).rejects.toEqual(expect.anything());
                  await payloadInputTextArea.sendKeys(payloadTestConfig.payload);
                },
              );
            });
          }
        });
      }
    });
  }

  function runTestConfig(testConfig: EnhancedTestConfig, deployTestPayload: () => Promise<void>) {
    const expectXss = testConfig.isExpectXss();

    test(
      'should '
      + (expectXss ? '' : 'NOT ')
      + 'trigger XSS'
      + (testConfig.trigger ? ' with custom trigger' : '')
      + (testConfig.expect ? ' with custom expectation' : ''),
      async () => {
        await testConfig.doSetup();
        await deployTestPayload();
        await testConfig.doTrigger();

        const xssAlertPromise = findAndExpectOne(app, '.alert-xss-triggered', testConfig.getTimeout());
        if (expectXss) {
          await expect(xssAlertPromise).resolves.toEqual(expect.anything());
        }
        else {
          await expect(xssAlertPromise).rejects.toThrow();
        }

        await testConfig.doExpect();
        await testConfig.doCleanup();
      },
      testConfig.getTimeout() + 5000,
    );
  }

  async function selectInputOutput(inputContext: string, inputName: string, outputContext: string, outputName: string): Promise<void> {
    if (inputContext != null && inputName != null) {
      await clickMenuItem(payloadInputCombobox, inputContext, inputName);
    }

    if (outputContext != null && outputName != null) {
      await clickMenuItem(payloadOutputCombobox, outputContext, outputName);
    }
  }

  async function findMenuItem(combobox: WebElement, groupLabel: string, itemLabel: string): Promise<WebElement> {
    const groups = await combobox.findElements(By.css('div.fd-popover__body div.fd-list__group-header'));

    let group: WebElement;
    for (const g of groups) {
      const text = await g.getText();
      if (text.trim() == groupLabel) {
        group = g;
        break;
      }
    }
    if (group == null) {
      return null;
    }

    const itemList = await group.findElement(By.xpath('following-sibling::ul[1]'));
    if (itemList == null) {
      return null;
    }

    const items = await itemList.findElements(By.css('li.fd-list__item'));

    let item = null as WebElement;
    for (const i of items) {
      const text = await i.getText();
      if (text.trim() == itemLabel) {
        item = i;
        break;
      }
    }

    return item;
  }

  async function clickMenuItem(combobox: WebElement, groupLabel: string, itemLabel: string): Promise<void> {
    const comboboxControlInput = await combobox.findElement(By.css('.fd-popover__control input'));
    await comboboxControlInput.click();

    // we need multiple click attempts due to a weird UI glitch in the ComboboxInputComponent
    while (true) {
      let item: WebElement;
      await windowTracker.switchToOwnWindow();
      try {
        item = await findMenuItem(combobox, groupLabel, itemLabel);
      }
      catch (err) {
        return;
      }

      if (await item?.isDisplayed()) {
        try {
          await item.click();
        }
        catch (err) {
          return;
        }
      }
      else {
        return;
      }
    }
  }

  function findPayloadOutputComponent(): WebElementPromise {
    return app.findElement(By.css('section.output-area xss-payload-output'));
  }

  function findOutput(): WebElementPromise {
    return findPayloadOutputComponent().findElement(By.css('.live-output.fd-layout-panel .fd-layout-panel__body'));
  }
});
