import { By, ThenableWebDriver, WebElement, until } from 'selenium-webdriver';
import { timeout, findAndExpectOne, findAndExpectCount, getClasses, getValue } from './test-lib';



enum StorageType {
  local = 'localStorage',
  session = 'sessionStorage',
}

class StorageProxy {
  constructor(private readonly driver: ThenableWebDriver, private readonly storage: StorageType) {
  }

  public get length(): Promise<number> {
    return this.invokeStorage('length');
  }

  public getItem(key: string): Promise<string> {
    return this.invokeStorage('getItem(' + JSON.stringify(key) + ')');
  }

  public setItem(key: string, value: string): Promise<void> {
    return this.invokeStorage(
      'setItem(' + JSON.stringify(key) + ', ' + JSON.stringify(value) + ')',
      true,
    );
  }

  public removeItem(key: string): Promise<void> {
    return this.invokeStorage(
      'removeItem(' + JSON.stringify(key) + ')',
      true,
    );
  }

  public clear(): Promise<void> {
    return this.invokeStorage(
      'clear()',
      true,
    );
  }

  private invokeStorage<R>(invocation: string, change = false): Promise<R> {
    return this.driver.executeScript(
      change
        ? this.storage + '.' + invocation + ';\n' + 'window.dispatchEvent(new StorageEvent("storage", { storageArea: ' + this.storage + ' }));\n'
        : 'return ' + this.storage + '.' + invocation + ';\n',
    );
  }
}



describe('Storage Mock', () => {
  let mockPageBody: WebElement = null;

  let storageType: StorageType;
  let testStorage: StorageProxy;

  beforeEach(async () => {
    await driver.get(xssDemoAppUrl + 'assets/mocks/storage.html');
    mockPageBody = await driver.wait(until.elementLocated(By.css('body')), 2500);
  });

  test('is loaded', () => {
    expect(mockPageBody).toBeDefined();
    expect(mockPageBody).not.toBeNull();
  });

  const storageTypes = [StorageType.local, StorageType.session];

  describe.each(storageTypes)('for %s', (type) => {
    beforeEach(() => {
      storageType = type;
      testStorage = new StorageProxy(driver, type);
      return testStorage.clear();
    });

    afterEach(() => {
      return testStorage.clear();
    });

    test('should manage storage contents through its web UI', async () => {
      const testData = {} as Record<string, string>;

      // check empty storage and table
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // add "foo"
      testData.foo = 'storage item with key "foo"';
      await fillAddNewItemForm('foo', testData.foo);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // start adding "bar", but cancel
      await fillAddNewItemForm('bar', 'wannabe storage item with key "bar"', false);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // add "xxx"
      testData.xxx = 'storage item with key "xxx"';
      await fillAddNewItemForm('xxx', testData.xxx);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // delete "foo"
      delete testData.foo;
      await deleteStorageTableEntry('foo');
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // add "bar"
      testData.bar = 'storage item with key "bar"';
      await fillAddNewItemForm('bar', testData.bar);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // re-add "foo"
      testData.foo = 'another storage item with key "foo"';
      await fillAddNewItemForm('foo', testData.foo);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // edit "bar"
      testData.bar = 'new value for item with key "bar"';
      await editStorageTableEntry('bar', testData.bar);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // start editing "xxx", but cancel
      await editStorageTableEntry('xxx', 'unsaved value for item with key "xxx"', false);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // edit "foo"
      testData.foo = 'new value for item with key "foo"';
      await editStorageTableEntry('foo', testData.foo);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // delete "xxx"
      delete testData.xxx;
      await deleteStorageTableEntry('xxx');
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // edit "bar" again, with funky value
      testData.bar = 'payload <img src="." onerror="parent.fail(\'a storage item has triggered xss!\')"> for item with key "bar"';
      await editStorageTableEntry('bar', testData.bar);
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // wait a bit for async failures
      await timeout(500);
    });

    test('should reflect external storage changes in its web UI', async () => {
      const testData = {} as Record<string, string>;

      // check empty storage and table
      await expectStorageToContain(testData);
      await expectStorageTable(testData);

      // add "FOO"
      testData.FOO = 'storage item with key "FOO"';
      await testStorage.setItem('FOO', testData.FOO);
      await waitForStorageTableEntry('FOO');
      await expectStorageTable(testData);

      // add "BAR"
      testData.BAR = 'storage item with key "BAR"';
      await testStorage.setItem('BAR', testData.BAR);
      await findStorageTableEntry('BAR');
      await expectStorageTable(testData);

      // delete "FOO"
      delete testData.FOO;
      await testStorage.removeItem('FOO');
      await findStorageTableEntry('FOO');
      await expectStorageTable(testData);

      // add ""
      testData[''] = 'storage item with empty key';
      await testStorage.setItem('', testData['']);
      await findStorageTableEntry('', testData['']);
      await expectStorageTable(testData);

      // change "BAR"
      testData.BAR = 'adjusted storage item with key "BAR"';
      await testStorage.setItem('BAR', testData.BAR);
      await findStorageTableEntry('BAR', testData.BAR);
      await expectStorageTable(testData);

      // re-add "FOO"
      testData.FOO = 'another storage item with key "FOO"';
      await testStorage.setItem('FOO', testData.FOO);
      await findStorageTableEntry('FOO');
      await expectStorageTable(testData);

      // add item with funky key
      const testKey = '<img src="." onerror="parent.fail(\'a storage item has triggered xss!\')">';
      testData[testKey] = 'the key of this storage item contains xss payload';
      await testStorage.setItem(testKey, testData[testKey]);
      await findStorageTableEntry(testKey);
      await expectStorageTable(testData);

      // delete item with funky key
      delete testData[testKey];
      await testStorage.removeItem(testKey);
      await findStorageTableEntry(testKey);
      await expectStorageTable(testData);

      // wait a bit for async failures
      await timeout(500);
    });
  });



  function findStorageTable(): Promise<WebElement> {
    return findAndExpectOne(mockPageBody, 'main article.' + storageType + ' table.storage');
  }

  function waitForStorageTableEntry(key: string, item?: string): Promise<WebElement> {
    return driver.wait(
      async () => null !== await findStorageTableEntry(key, item),
      2500,
    );
  }

  async function findStorageTableEntry(key: string, item?: string): Promise<WebElement> {
    const storageTable = await findStorageTable();
    const storageTableEntryRows = await storageTable.findElements(By.css('tr.entry'));

    for (const entryRow of storageTableEntryRows) {
      const entryKeyField = await findAndExpectOne(entryRow, 'td.key input[type=text]');
      if (item === undefined) {
        if (key === await getValue(entryKeyField)) {
          return entryRow;
        }
      }
      else {
        const entryItemField = await findAndExpectOne(entryRow, 'td.item input[type=text]');
        if (
          (key === await getValue(entryKeyField))
          && (item === await getValue(entryItemField))
        ) {
          return entryRow;
        }
      }
    }
    return null;
  }

  async function fillAddNewItemForm(key: string, item: string, save = true): Promise<void> {
    const storageTable = await findStorageTable();
    const initialStorageTableRows = await storageTable.findElements(By.css('tr'));

    const addNewItemButton = await findAndExpectOne(storageTable, 'tr.actions button[name=new]');
    await addNewItemButton.click();

    await findAndExpectCount(storageTable, 'tr', initialStorageTableRows.length + 1);
    const newItemRow = await findAndExpectOne(storageTable, 'tr.entry.new');
    const newKeyField = await findAndExpectOne(newItemRow, 'td.key input[type=text]');
    const newItemField = await findAndExpectOne(newItemRow, 'td.item input[type=text]');
    const saveButton = await findAndExpectOne(newItemRow, 'td.actions button[name=save]');
    const cancelButton = await findAndExpectOne(newItemRow, 'td.actions button[name=cancel]');

    await newKeyField.clear();
    await newKeyField.sendKeys(key);
    await newItemField.clear();
    await newItemField.sendKeys(item);
    await (save ? saveButton : cancelButton).click();
  }

  async function editStorageTableEntry(key: string, item: string, save = true): Promise<void> {
    const storageTable = await findStorageTable();
    const storageTableRows = await storageTable.findElements(By.css('tr'));

    const entryRow = await findStorageTableEntry(key);
    const editButton = await findAndExpectOne(entryRow, 'td.actions button[name=edit]');

    await editButton.click();
    await findAndExpectCount(storageTable, 'tr', storageTableRows.length);

    const entryItemField = await findAndExpectOne(entryRow, 'td.item input[type=text]');
    const saveButton = await findAndExpectOne(entryRow, 'td.actions button[name=save]');
    const cancelButton = await findAndExpectOne(entryRow, 'td.actions button[name=cancel]');

    await entryItemField.clear();
    await entryItemField.sendKeys(item);
    await (save ? saveButton : cancelButton).click();
  }

  async function deleteStorageTableEntry(key: string) {
    const storageTable = await findStorageTable();
    const storageTableRows = await storageTable.findElements(By.css('tr'));

    const entryRow = await findStorageTableEntry(key);
    const deleteButton = await findAndExpectOne(entryRow, 'td.actions button[name=delete]');

    await deleteButton.click();
    await findAndExpectCount(storageTable, 'tr', storageTableRows.length - 1);
  }

  async function expectStorageToContain(data: Record<string, string>): Promise<void> {
    await expect(testStorage.length).resolves.toBe(Object.values(data).length);
    for (const [key, item] of Object.entries(data)) {
      await expect(testStorage.getItem(key)).resolves.toBe(item);
    }
  }

  async function expectStorageTable(data: Record<string, string>) {
    const dataKeys = Object.keys(data).sort();
    const entryCount = dataKeys.length;
    const rowCount = entryCount + 3;

    const storageTable = await findStorageTable();
    if (entryCount === 0) {
      await expect(getClasses(storageTable)).resolves.toContain('empty');
    }
    else {
      await expect(getClasses(storageTable)).resolves.not.toContain('empty');
    }

    const storageRows = await findAndExpectCount(storageTable, 'tr', rowCount);
    await expect(getClasses(storageRows[0])).resolves.toEqual(['head']);
    await expect(getClasses(storageRows[1])).resolves.toEqual(['message', 'empty']);
    await expect(getClasses(storageRows[rowCount - 1])).resolves.toEqual(['actions']);

    let index = 2;
    for (const dataKey of dataKeys) {
      const dataItem = data[dataKey];

      const entryRow = storageRows[index++];
      await expect(getClasses(entryRow)).resolves.toEqual(['entry']);
      await expectEntryRowValues(entryRow, dataKey, dataItem);
    }
  }

  async function expectEntryRowValues(row: WebElement, key: string, item: string): Promise<void> {
    const entryKeyField = await findAndExpectOne(row, 'td.key input[type=text]');
    const entryItemField = await findAndExpectOne(row, 'td.item input[type=text]');
    await expect(getValue(entryKeyField)).resolves.toBe(key);
    await expect(getValue(entryItemField)).resolves.toBe(item);
  }
});
