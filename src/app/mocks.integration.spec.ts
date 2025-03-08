
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

    const storageTestData = {
      foo: 'storage item with key "foo"',
      bar: 'storage item with key "bar"',
      xxx: 'storage item with key "xxx"'
    }

    for (const testStorageName of ['localStorage', 'sessionStorage']) {

      const testStorage = window[testStorageName] as Storage;

      beforeEach(() => {
        testStorage.clear();
      });

      afterEach(() => {
        testStorage.clear();
      });

      it('should manage ' + testStorageName, () => {

        // check empty storage and table
        expectStorageToContain({});
        expectStorageTable({});

        {
          // add  "foo"
          fillAddNewItemForm('foo', storageTestData.foo);
          const expectedData = pick(storageTestData, 'foo');
          expectStorageToContain(expectedData);
          expectStorageTable(expectedData);
        }

        {
          // add "bar", but cancel
          fillAddNewItemForm('bar', storageTestData.bar, false);
          const expectedData = pick(storageTestData, 'foo');
          expectStorageToContain(expectedData);
          expectStorageTable(expectedData);
        }

        {
          // add "xxx"
          fillAddNewItemForm('xxx', storageTestData.xxx);
          const expectedData = pick(storageTestData, 'foo', 'xxx');
          expectStorageToContain(expectedData);
          expectStorageTable(expectedData);
        }

        {
          // delete "foo"
          deleteStorageTableEntry('foo');
          const expectedData = pick(storageTestData, 'xxx');
          expectStorageToContain(expectedData);
          expectStorageTable(expectedData);
        }

        {
          // add "bar"
          fillAddNewItemForm('bar', storageTestData.bar);
          const expectedData = pick(storageTestData, 'bar', 'xxx');
          expectStorageToContain(expectedData);
          expectStorageTable(expectedData);
        }

        {
          // re-add "foo"
          fillAddNewItemForm('foo', storageTestData.foo);
          expectStorageToContain(storageTestData);
          expectStorageTable(storageTestData);
        }

        {
          // edit "bar"
          const adjustedTestData = Object.assign({}, storageTestData);
          adjustedTestData.bar = 'new value for item with key "bar"';
          editStorageTableEntry('bar', adjustedTestData.bar);
          expectStorageToContain(adjustedTestData);
          expectStorageTable(adjustedTestData);
        }
      });

      function queryStorageTable(): HTMLTableElement {
        return mockPageDoc.body.querySelector('div.' + testStorageName + ' table.storage');
      }

      function queryStorageTableEntry(key: string): HTMLTableRowElement {
        const storageTableEntryRows = queryStorageTable().querySelectorAll('tr.entry') as NodeListOf<HTMLTableRowElement>;
        for (const entryRow of storageTableEntryRows) {
          const entryKeyField = queryAndExpectOne(entryRow, 'td.key input[type=text]') as HTMLInputElement;
          if (entryKeyField.value === key) {
            return entryRow;
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

  function pick(obj: {[key: string]: string}, ... props: string[]): {[key: string]: string} {
    return Object.fromEntries(
      props
        .filter(prop => prop in obj)
        .map(prop => [prop, obj[prop]])
    );
  };
});
