
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

        const storageTable = queryStorageTable();

        {
          // check empty storage table
          expect(storageTable.classList).toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 3);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['actions']));
        }

        {
          // use "add new item" form
          const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
          addNewItemButton.click();
          queryAndExpectCount(storageTable, 'tr', 4);
          const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
          const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
          const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
          const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;

          // submit "add new item" form for storage item "foo"
          newKeyField.value = 'foo';
          newItemField.value = storageTestData.foo;
          saveButton.click();
          expectStorageToContain(pick(storageTestData, 'foo'));

          // re-check storage table
          expect(storageTable.classList).not.toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 4);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[3].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

          expectEntryRowValues(storageRows[2], 'foo', storageTestData.foo);
        }

        {
          // use "add new item" form again
          const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
          addNewItemButton.click();
          expect(storageTable.querySelectorAll('tr').length).toBe(5);
          const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
          const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
          const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
          const cancelButton = queryAndExpectOne(newItemRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

          // cancel "add new item" form
          newKeyField.value = 'bar';
          newItemField.value = storageTestData.bar;
          cancelButton.click();
          expectStorageToContain(pick(storageTestData, 'foo'));

          // re-check storage table
          expect(storageTable.classList).not.toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 4);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[3].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

          expectEntryRowValues(storageRows[2], 'foo', storageTestData.foo);
        }

        {
          // use "add new item" form once again
          const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
          addNewItemButton.click();
          queryAndExpectCount(storageTable, 'tr', 5);
          const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
          const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
          const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
          const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;

          // submit "add new item" form for storage item "xxx"
          newKeyField.value = 'xxx';
          newItemField.value = storageTestData.xxx;
          saveButton.click();
          expectStorageToContain(pick(storageTestData, 'foo', 'xxx'));

          // re-check storage table
          expect(storageTable.classList).not.toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 5);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[3].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[4].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

          expectEntryRowValues(storageRows[2], 'foo', storageTestData.foo);
          expectEntryRowValues(storageRows[3], 'xxx', storageTestData.xxx);
        }

        {
          // delete storage item "foo"
          const entryRowFoo = storageTable.querySelectorAll('tr')[2];
          const deleteButtonFoo = queryAndExpectOne(entryRowFoo, 'td.actions button[name=delete]') as HTMLButtonElement;
          deleteButtonFoo.click();
          expectStorageToContain(pick(storageTestData, 'xxx'));

          // re-check storage table
          expect(storageTable.classList).not.toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 4);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[3].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

          expectEntryRowValues(storageRows[2], 'xxx', storageTestData.xxx);
        }

        {
          // use "add new item" form yet again
          const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
          addNewItemButton.click();
          queryAndExpectCount(storageTable, 'tr', 5);
          const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
          const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
          const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
          const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;

          // submit "add new item" form for storage item "bar"
          newKeyField.value = 'bar';
          newItemField.value = storageTestData.bar;
          saveButton.click();
          expectStorageToContain(pick(storageTestData, 'bar', 'xxx'));

          // re-check storage table
          expect(storageTable.classList).not.toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 5);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[3].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[4].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

          expectEntryRowValues(storageRows[2], 'bar', storageTestData.bar);
          expectEntryRowValues(storageRows[3], 'xxx', storageTestData.xxx);
        }

        {
          // use "add new item" form yet again
          const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
          addNewItemButton.click();
          queryAndExpectCount(storageTable, 'tr', 6);
          const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
          const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
          const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
          const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;

          // submit "add new item" form for storage item "bar"
          newKeyField.value = 'foo';
          newItemField.value = storageTestData.foo;
          saveButton.click();
          expectStorageToContain(storageTestData);

          // re-check storage table
          expect(storageTable.classList).not.toContain('empty');
          const storageRows = queryAndExpectCount(storageTable, 'tr', 6);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[3].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[4].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
          expect(storageRows[5].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

          expectEntryRowValues(storageRows[2], 'bar', storageTestData.bar);
          expectEntryRowValues(storageRows[3], 'foo', storageTestData.foo);
          expectEntryRowValues(storageRows[4], 'xxx', storageTestData.xxx);
        }
      });

      function queryStorageTable(): HTMLTableElement {
        return mockPageDoc.body.querySelector('div.' + testStorageName + ' table.storage');
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
