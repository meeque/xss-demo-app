import { By, WebElement, until } from 'selenium-webdriver';
import { findAndExpectOne, findAndExpectCount, getClasses, getValue } from './test-lib';



interface TestEvent {
  data: unknown
  expectTrusted?: boolean
}

interface TestOriginConfig {
  origins: string[]
  expectTrusted?: boolean
}



describe('Post Message Mock', () => {
  let mockPageBody: WebElement = null;

  beforeEach(async () => {
    await driver.get(xssDemoAppUrl + 'assets/mocks/message.html');
    mockPageBody = await driver.wait(until.elementLocated(By.css('body')), 2500);
  });

  test('should sort origins alphabethically', async () => {
    await expect(sortOrigins([])).resolves.toEqual([]);

    await expect(sortOrigins([null])).resolves.toEqual([null]);
    await expect(sortOrigins([undefined])).resolves.toEqual([null]);
    await expect(sortOrigins([''])).resolves.toEqual(['']);
    await expect(sortOrigins(['foo'])).resolves.toEqual(['foo']);
    await expect(sortOrigins(['https://xss.example'])).resolves.toEqual(['https://xss.example']);
    await expect(sortOrigins(['http://xss.example:8080'])).resolves.toEqual(['http://xss.example:8080']);
    await expect(sortOrigins([null, 'origin'])).resolves.toEqual([null, 'origin']);
    await expect(sortOrigins(['origin', null])).resolves.toEqual([null, 'origin']);
    await expect(sortOrigins([undefined, 'value'])).resolves.toEqual([null, 'value']);
    await expect(sortOrigins(['value', undefined])).resolves.toEqual([null, 'value']);
    await expect(sortOrigins(['', 'test'])).resolves.toEqual(['', 'test']);
    await expect(sortOrigins(['test', ''])).resolves.toEqual(['', 'test']);
    await expect(sortOrigins(['foo', 'bar'])).resolves.toEqual(['bar', 'foo']);
    await expect(sortOrigins(['bar', 'foo'])).resolves.toEqual(['bar', 'foo']);
    await expect(sortOrigins(['http://xss.example', 'https://xss.example'])).resolves.toEqual(['http://xss.example', 'https://xss.example']);
    await expect(sortOrigins(['https://xss.example', 'http://xss.example'])).resolves.toEqual(['http://xss.example', 'https://xss.example']);
    await expect(sortOrigins(['https://xss.example', 'https://yss.example'])).resolves.toEqual(['https://xss.example', 'https://yss.example']);
    await expect(sortOrigins(['https://yss.example', 'https://xss.example'])).resolves.toEqual(['https://xss.example', 'https://yss.example']);
    await expect(sortOrigins(['one', 'three', 'two'])).resolves.toEqual(['one', 'three', 'two']);
    await expect(sortOrigins(['one', 'two', 'three'])).resolves.toEqual(['one', 'three', 'two']);
    await expect(sortOrigins(['three', 'one', 'two'])).resolves.toEqual(['one', 'three', 'two']);
    await expect(sortOrigins(['three', 'two', 'one'])).resolves.toEqual(['one', 'three', 'two']);
    await expect(sortOrigins(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443'])).resolves.toEqual(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443']);
    await expect(sortOrigins(['https://yss.example', 'http://yss.example', 'http://xss.example:8080', 'http://yss.example:8080', 'https://xss.example', 'https://yss.example:8443', 'http://xss.example', 'https://xss.example:8443'])).resolves.toEqual(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443']);
    await expect(sortOrigins(['http://yss.example', 'https://xss.example:8443', 'http://xss.example:8080', 'http://yss.example:8080', 'https://yss.example', 'https://xss.example', 'https://yss.example:8443', 'http://xss.example'])).resolves.toEqual(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443']);
  });

  test('is loaded', () => {
    expect(mockPageBody).toEqual(expect.anything());
  });

  describe('"Trusted Origins" table', () => {
    test('should initially contain own origin', () => {
      return expectOriginsTable([xssDemoAppOrigin]);
    });

    test('should manage trusted origins', async () => {
      const origins = new Set<string>([xssDemoAppOrigin]);
      await expectOriginsTable(origins);

      {
        const origin = 'https://xss.example';
        origins.add(origin);
        await fillNewOriginForm(origin);
        await expectOriginsTable(origins);
      }

      {
        const origin = 'https://yss.example';
        origins.add(origin);
        await fillNewOriginForm(origin);
        await expectOriginsTable(origins);
      }

      {
        const origin = xssDemoAppOrigin;
        origins.delete(origin);
        await untrustOrigin(origin);
        await expectOriginsTable(origins);
      }

      {
        // start adding origin, but do not save
        const origin = 'https://zss.example';
        await fillNewOriginForm(origin, false);
        await expectOriginsTable(origins);
      }

      {
        const origin = 'lololo';
        origins.add(origin);
        await fillNewOriginForm(origin);
        await expectOriginsTable(origins, true);

        origins.delete(origin);
        await untrustOrigin(origin);
        await expectOriginsTable(origins);
      }

      {
        // re-add existing origin
        const origin = 'https://xss.example';
        await fillNewOriginForm(origin);
        await expectOriginsTable(origins);
      }

      {
        const origin = xssDemoAppOrigin;
        origins.add(origin);
        await fillNewOriginForm(origin);
        await expectOriginsTable(origins);
      }

      {
        const origin = 'https://yss.example';
        origins.delete(origin);
        await untrustOrigin(origin);
        await expectOriginsTable(origins);
      }

      {
        const origin = 'https://xss.example';
        origins.delete(origin);
        await untrustOrigin(origin);
        await expectOriginsTable(origins);
      }

      {
        const origin = xssDemoAppOrigin;
        origins.delete(origin);
        await untrustOrigin(origin);
        await expectOriginsTable(origins);
      }

      await expectOriginsTable([]);
    });
  });

  describe('"Received Post-Message Events" table', () => {
    const testOriginConfigs: TestOriginConfig[] = [
      {
        origins: [xssDemoAppOrigin],
        expectTrusted: true,
      },
      {
        origins: ['https://xss.example', xssDemoAppOrigin],
        expectTrusted: true,
      },
      {
        origins: [xssDemoAppOrigin, 'http://yss.example'],
        expectTrusted: true,
      },
      {
        origins: [],
        expectTrusted: false,
      },
      {
        origins: ['https://xss.example'],
        expectTrusted: false,
      },
      {
        origins: ['http://yss.example', 'http://zss.example'],
        expectTrusted: false,
      },
    ];

    test('should initially be empty', async () => {
      await expectEventsTable();
    });

    for (const testOriginConfig of testOriginConfigs) {
      test(
        'should '
        + (testOriginConfig.expectTrusted ? '' : 'NOT ')
        + 'trust events from '
        + xssDemoAppOrigin
        + ' when trusted origns are [ '
        + testOriginConfig.origins.join(', ')
        + ' ]',
        async () => {
          const postedEvents = [] as TestEvent[];
          await configureTrustedOrigins(testOriginConfig.origins);

          await postMessageAndExpectEventsTable('first', postedEvents, testOriginConfig);
          await postMessageAndExpectEventsTable('second', postedEvents, testOriginConfig);
          await postMessageAndExpectEventsTable('third', postedEvents, testOriginConfig);
          await postMessageAndExpectEventsTable('fourth', postedEvents, testOriginConfig);

          postedEvents.splice(0);
          const eventsTable = await findEventsTable();
          const clearButton = await findAndExpectOne(eventsTable, 'tr.actions button[name=clear]');
          await clearButton.click();
          await expectEventsTable();

          await postMessageAndExpectEventsTable('foo', postedEvents, testOriginConfig);
          await postMessageAndExpectEventsTable('bar', postedEvents, testOriginConfig);
          await postMessageAndExpectEventsTable('baz', postedEvents, testOriginConfig);
          await postMessageAndExpectEventsTable('qux', postedEvents, testOriginConfig);
        },
      );
    }
  });



  function findOriginsTable(): Promise<WebElement> {
    return findAndExpectOne(mockPageBody, 'table.origins');
  }

  async function findOriginsTableOrigin(origin: string): Promise<WebElement> {
    const originsTable = await findOriginsTable();
    const originRows = await originsTable.findElements(By.css('tr.origin'));

    for (const originRow of originRows) {
      const originField = await findAndExpectOne(originRow, 'td.origin input[name=origin]');
      if (origin === (await originField.getAttribute('value'))) {
        return originRow;
      }
    }
    return null;
  }

  async function fillNewOriginForm(origin: string, save = true): Promise<void> {
    const isExistingOrigin = null != await findOriginsTableOrigin(origin);

    const originsTable = await findOriginsTable();
    const initialOriginsTableRows = await originsTable.findElements(By.css('tr'));

    const newOriginButton = await findAndExpectOne(originsTable, 'tr.actions button[name=new]');
    await expect(newOriginButton.isEnabled()).resolves.toBe(true);
    await newOriginButton.click();

    await findAndExpectCount(originsTable, 'tr', initialOriginsTableRows.length + 1);
    await expect(getClasses(originsTable)).resolves.not.toContain('empty');
    await expect(newOriginButton.isEnabled()).resolves.toBe(false);
    const warningMessageCell = await findAndExpectOne(originsTable, 'tr.actions td.message.warning');
    const warningMessage = await warningMessageCell.getText();
    expect(warningMessage.trim()).toBe('');

    const originRow = await findAndExpectOne(originsTable, 'tr.origin.new');
    const originField = await findAndExpectOne(originRow, 'td.origin input[name=origin]');
    const untrustButton = await findAndExpectOne(originRow, 'td.actions button[name=untrust]');
    const trustButton = await findAndExpectOne(originRow, 'td.actions button[name=trust]');
    const cancelButton = await findAndExpectOne(originRow, 'td.actions button[name=cancel]');

    await expect(getValue(originField)).resolves.toBe('');
    await expect(originField.isEnabled()).resolves.toBe(true);
    await expect(untrustButton.isEnabled()).resolves.toBe(false);
    await expect(trustButton.isEnabled()).resolves.toBe(true);
    await expect(cancelButton.isEnabled()).resolves.toBe(true);

    await originField.sendKeys(origin);
    await (save ? trustButton : cancelButton).click();

    await findAndExpectCount(await findOriginsTable(), 'tr', initialOriginsTableRows.length + ((save && !isExistingOrigin) ? 1 : 0));
  }

  async function untrustOrigin(origin: string): Promise<void> {
    const originsTable = await findOriginsTable();
    const initialOriginsTableRows = await originsTable.findElements(By.css('tr'));

    const originRow = await findOriginsTableOrigin(origin);
    expect(originRow).not.toBe(null);
    const untrustButton = await findAndExpectOne(originRow, 'td.actions button[name=untrust]');
    await expect(untrustButton.isEnabled()).resolves.toBe(true);
    await untrustButton.click();

    await expect(findOriginsTableOrigin(origin)).resolves.toBe(null);
    await findAndExpectCount(await findOriginsTable(), 'tr', initialOriginsTableRows.length - 1);
  }

  async function configureTrustedOrigins(origins: string[]): Promise<void> {
    await untrustOrigin(xssDemoAppOrigin);
    for (const trustedOrigin of origins) {
      await fillNewOriginForm(trustedOrigin);
    }
  }

  async function expectOriginsTable(origins = [] as Iterable<string>, expectWarning = false) {
    const originsTable = await findOriginsTable();

    const sortedOrigins = await sortOrigins(origins);
    const originsCount = sortedOrigins.length;
    const rowCount = originsCount + 3;

    const originRows = await findAndExpectCount(originsTable, 'tr', rowCount);
    await expect(getClasses(originRows[0])).resolves.toEqual(['head']);
    await expect(getClasses(originRows[1])).resolves.toEqual(['message', 'info', 'empty']);
    await expect(getClasses(originRows[rowCount - 1])).resolves.toEqual(['actions']);

    const newOriginButton = await findAndExpectOne(originRows[rowCount - 1], 'button[name=new]');
    await expect(newOriginButton.isEnabled()).resolves.toBe(true);

    const warningMessageCell = await findAndExpectOne(originsTable, 'tr.actions td.message.warning');
    const warningMessage = await warningMessageCell.getText();
    if (expectWarning) {
      expect(warningMessage.trim()).not.toBe('');
    }
    else {
      expect(warningMessage.trim()).toBe('');
    }

    let index = 2;
    for (const origin of sortedOrigins) {
      const originRow = originRows[index++];

      const originField = await findAndExpectOne(originRow, 'td.origin input[name=origin]');
      const untrustButton = await findAndExpectOne(originRow, 'td.actions button[name=untrust]');
      const trustButton = await findAndExpectOne(originRow, 'td.actions button[name=trust]');
      const cancelButton = await findAndExpectOne(originRow, 'td.actions button[name=cancel]');

      await expect(getClasses(originRow)).resolves.not.toContain('new');
      await expect(getValue(originField)).resolves.toBe(origin);
      await expect(originField.isEnabled()).resolves.toBe(false);
      await expect(untrustButton.isEnabled()).resolves.toBe(true);
      await expect(trustButton.isEnabled()).resolves.toBe(false);
      await expect(cancelButton.isEnabled()).resolves.toBe(false);
    }
  }

  function sortOrigins(origins: Iterable<string>): Promise<string[]> {
    return driver.executeScript(
      'return sortOrigins(' + JSON.stringify(Array.from(origins)) + ');',
    );
  }

  function findEventsTable(): Promise<WebElement> {
    return findAndExpectOne(mockPageBody, 'table.events');
  }

  async function postMessageAndExpectEventsTable(newEventData: string, postedEvents: TestEvent[], testOriginConfig: TestOriginConfig) {
    await driver.executeScript('window.postMessage(' + JSON.stringify(newEventData) + ', window.origin);');

    postedEvents.push({
      data: newEventData,
      expectTrusted: testOriginConfig.expectTrusted,
    });

    const eventsTable = await findEventsTable();
    await findAndExpectOne(eventsTable, ':nth-child(' + postedEvents.length + ' of tr.event)');
    await expectEventsTable(
      postedEvents,
      !testOriginConfig.expectTrusted,
    );
  }

  async function expectEventsTable(events = [] as TestEvent[], expectError = false) {
    const eventsTable = await findEventsTable();
    const rowCount = events.length + 3;

    await expect(getClasses(eventsTable)).resolves.toEqual(events.length > 0 ? ['events'] : ['events', 'empty']);

    const eventRows = await findAndExpectCount(eventsTable, 'tr', rowCount);
    await expect(getClasses(eventRows[0])).resolves.toEqual(['head']);
    await expect(getClasses(eventRows[1])).resolves.toEqual(['message', 'info', 'empty']);
    await expect(getClasses(eventRows[rowCount - 1])).resolves.toEqual(['actions']);

    const clearButton = await findAndExpectOne(eventRows[rowCount - 1], 'button[name=clear]');
    await expect(clearButton.isEnabled()).resolves.toBe(true);

    const errorMessageCell = await findAndExpectOne(eventsTable, 'tr.actions td.message.error');
    const errorMessage = await errorMessageCell.getText();
    if (expectError) {
      expect(errorMessage.trim()).not.toBe('');
    }
    else {
      expect(errorMessage.trim()).toBe('');
    }

    let index = 2;
    for (const event of events) {
      const eventRow = eventRows[index++];

      const trustElement = await findAndExpectOne(eventRow, 'td.trust');
      const originElement = await findAndExpectOne(eventRow, 'td.origin code');
      const timeStampElement = await findAndExpectOne(eventRow, 'td.timestamp code');
      const dataElement = await findAndExpectOne(eventRow, 'td.data code');

      await expect(getClasses(eventRow)).resolves.toContain(event.expectTrusted ? 'trusted' : 'untrusted');
      await expect(trustElement.getAttribute('title')).resolves.not.toBe('');
      await expect(originElement.getText()).resolves.toBe(xssDemoAppOrigin);
      await expect(timeStampElement.getText().then(ts => Number.parseFloat(ts))).resolves.not.toBeNaN();
      await expect(dataElement.getText()).resolves.toBe(JSON.stringify(event.data));
    }
  }
});
