
describe('XSS Demo Mocks', () => {

  let pageFixture: HTMLIFrameElement = null;
  let mockPageDoc: Document = null;
  let mockUrl: string = null;

  beforeEach(async () => {
    const {promise: loadPromise, resolve: loadHandler} = Promise.withResolvers();
    pageFixture = document.createElement('iframe');
    pageFixture.addEventListener('load', loadHandler);
    pageFixture.src = mockUrl;
    document.body.insertAdjacentElement('beforeend', pageFixture);
    await loadPromise;
    mockPageDoc = pageFixture.contentDocument;
  });

  afterEach(() => {
    document.body.removeChild(pageFixture);
    pageFixture = null;
    mockPageDoc = null;
  });

  describe('Plain Page', () => {
    mockUrl = '/assets/mocks/plain.html'

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

  });

  describe('Storage Page', () => {
    mockUrl = '/assets/mocks/storage.html'

    for (const testStorageName of ['localStorage', 'sessionStorage']) {

      const testStorage = window[testStorageName] as Storage;

      describe('for ' + testStorageName, () => {

        beforeEach(() => {
          testStorage.clear();
        });

        afterEach(() => {
          testStorage.clear();
        });

        it('should manage storage contents through its web UI', async () => {

          const testData: {[key: string]: string} = {};

          // check empty storage and table
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // add  "foo"
          testData.foo = 'storage item with key "foo"';
          fillAddNewItemForm('foo', testData.foo);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // start adding "bar", but cancel
          fillAddNewItemForm('bar', 'wannabe storage item with key "bar"', false);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // add "xxx"
          testData.xxx = 'storage item with key "xxx"';
          fillAddNewItemForm('xxx', testData.xxx);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // delete "foo"
          delete testData.foo;
          deleteStorageTableEntry('foo');
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // add "bar"
          testData.bar = 'storage item with key "bar"';
          fillAddNewItemForm('bar', testData.bar);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // re-add "foo"
          testData.foo = 'another storage item with key "foo"';
          fillAddNewItemForm('foo', testData.foo);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // edit "bar"
          testData.bar = 'new value for item with key "bar"';
          editStorageTableEntry('bar', testData.bar);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // start editing "xxx", but cancel
          editStorageTableEntry('xxx', 'unsaved value for item with key "xxx"', false);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // edit "foo"
          testData.foo = 'new value for item with key "foo"';
          editStorageTableEntry('foo', testData.foo);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // delete "xxx"
          delete testData.xxx;
          deleteStorageTableEntry('xxx');
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // edit "bar" again, with funky value
          testData.bar = 'payload <img src="." onerror="parent.fail(\'a storage item has triggered xss!\')"> for item with key "bar"';
          editStorageTableEntry('bar', testData.bar);
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // wait a bit for async failures
          await timeout(500);
        });

        it('should reflect external storage changes in its web UI', async () => {

          const testData: {[key: string]: string} = {};

          // check empty storage and table
          expectStorageToContain(testData);
          expectStorageTable(testData);

          // add "FOO"
          testData.FOO = 'storage item with key "FOO"';
          testStorage.setItem('FOO', testData.FOO);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry('FOO') !== null);
          expectStorageTable(testData);

          // add "BAR"
          testData.BAR = 'storage item with key "BAR"';
          testStorage.setItem('BAR', testData.BAR);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry('BAR') !== null);
          expectStorageTable(testData);

          // delete "FOO"
          delete testData.FOO;
          testStorage.removeItem('FOO');
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry('FOO') === null);
          expectStorageTable(testData);

          // add ""
          testData[''] = 'storage item with empty key';
          testStorage.setItem('', testData['']);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry('') !== null);
          expectStorageTable(testData);

          // change "BAR"
          testData.BAR = 'adjusted storage item with key "BAR"';
          testStorage.setItem('BAR', testData.BAR);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry('BAR', testData.BAR) !== null);
          expectStorageTable(testData);

          // re-add "FOO"
          testData.FOO = 'another storage item with key "FOO"';
          testStorage.setItem('FOO', testData.FOO);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry('FOO') !== null);
          expectStorageTable(testData);

          // add item with funky key
          const testKey = '<img src="." onerror="parent.fail(\'a storage item has triggered xss!\')">';
          testData[testKey] = 'they key of this storage item contains xss payload';
          testStorage.setItem(testKey, testData[testKey]);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry(testKey) !== null);
          expectStorageTable(testData);

          // delete item with funky key
          delete testData[testKey];
          testStorage.removeItem(testKey);
          await waitForDom(queryStorageTable(), () => queryStorageTableEntry(testKey) === null);
          expectStorageTable(testData);

          // wait a bit for async failures
          await timeout(500);
        });
      });

      function queryStorageTable(): HTMLTableElement {
        return mockPageDoc.body.querySelector('div.' + testStorageName + ' table.storage');
      }

      function queryStorageTableEntry(key: string, item?: string): HTMLTableRowElement {
        const storageTableEntryRows = queryStorageTable().querySelectorAll('tr.entry') as NodeListOf<HTMLTableRowElement>;
        for (const entryRow of storageTableEntryRows) {
          const entryKeyField = queryAndExpectOne(entryRow, 'td.key input[type=text]') as HTMLInputElement;
          if (item === undefined) {
            if (entryKeyField.value === key) {
              return entryRow;
            }
          } else {
            const entryItemField = queryAndExpectOne(entryRow, 'td.item input[type=text]') as HTMLInputElement;
            if (entryKeyField.value === key && entryItemField.value === item) {
              return entryRow;
            }
          }
        }
        return null;
      }

      function fillAddNewItemForm(key: string, item: string, save = true) {
        const storageTable = queryStorageTable();
        const storageTableRows = storageTable.querySelectorAll('tr');

        const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
        addNewItemButton.click();

        queryAndExpectCount(storageTable, 'tr', storageTableRows.length + 1);
        const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
        const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
        const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
        const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;
        const cancelButton = queryAndExpectOne(newItemRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

        newKeyField.value = key;
        newItemField.value = item;
        save ? saveButton.click() : cancelButton.click();
      }

      function editStorageTableEntry(key: string, item: string, save = true) {
        const storageTableRows = queryStorageTable().querySelectorAll('tr');
        const entryRow = queryStorageTableEntry(key);
        const editButton = queryAndExpectOne(entryRow, 'td.actions button[name=edit]') as HTMLButtonElement;

        editButton.click();
        queryAndExpectCount(queryStorageTable(), 'tr', storageTableRows.length);

        const entryItemField = queryAndExpectOne(entryRow, 'td.item input[type=text]') as HTMLInputElement;
        const saveButton = queryAndExpectOne(entryRow, 'td.actions button[name=save]') as HTMLButtonElement;
        const cancelButton = queryAndExpectOne(entryRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

        entryItemField.value = item;
        save ? saveButton.click() : cancelButton.click();
      }

      function deleteStorageTableEntry(key: string) {
        const storageTableRows = queryStorageTable().querySelectorAll('tr');
        const entryRow = queryStorageTableEntry(key);
        const deleteButton = queryAndExpectOne(entryRow, 'td.actions button[name=delete]') as HTMLButtonElement;

        deleteButton.click();
        queryAndExpectCount(queryStorageTable(), 'tr', storageTableRows.length - 1);
      }

      function expectStorageToContain(data: {[key: string]: string}) {
        expect(testStorage.length).withContext('number of items in ' + testStorageName).toBe(Object.values(data).length);
        for (const [key, item] of Object.entries(data)) {
          expect(testStorage.getItem(key)).toBe(item);
        }
      }

      function expectEntryRowValues(row: HTMLElement, key: string, item: string) {
        const entryKeyField = queryAndExpectOne(row, 'td.key input[type=text]') as HTMLInputElement;
        const entryItemField = queryAndExpectOne(row, 'td.item input[type=text]') as HTMLInputElement;
        expect(entryKeyField.value).toBe(key);
        expect(entryItemField.value).toBe(item);
      }

      function expectStorageTable(data: {[key: string]: string}) {
        const dataKeys = Object.keys(data).sort();
        const entryCount = dataKeys.length;
        const rowCount = entryCount + 3;

        const storageTable = queryStorageTable();
        if (entryCount === 0) {
          expect(storageTable.classList).withContext('storage table "empty" class').toContain('empty');
        } else {
          expect(storageTable.classList).withContext('storage table "empty" class').not.toContain('empty');
        }

        const storageRows = queryAndExpectCount(storageTable, 'tr', rowCount);
        expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
        expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
        expect(storageRows[rowCount-1].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

        let index = 2;
        for (const dataKey of dataKeys) {
          const dataItem = data[dataKey];

          const entryRow = storageRows[index++];
          expect(entryRow.classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expectEntryRowValues(entryRow, dataKey, dataItem);
        }
      }
    }
  });

  function queryAndExpectOne(context: HTMLElement, selector: string): HTMLElement {
    return queryAndExpectCount(context, selector)[0];
  }

  function queryAndExpectCount(context: HTMLElement, selector: string, count: number = 1): HTMLElement[] {
    const result = context.querySelectorAll(selector);
    expect(result.length).withContext('number of elements matching query "' + selector + '"').toBe(count);
    return Array.from(result) as HTMLElement[];
  }

  function waitForDom(context: HTMLElement, condition: () => boolean): Promise<void> {

    if (condition()) {
      return Promise.resolve();
    }

    const {promise, resolve} = Promise.withResolvers<void>();
    const observer = new MutationObserver(() => {
      if (condition()) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(context, {childList: true, subtree: true});

    return promise;
  }

  function timeout(millis: number): Promise<void> {
    const {promise, resolve} = Promise.withResolvers<void>();
    setTimeout(resolve, millis);
    return promise;
  }
});
