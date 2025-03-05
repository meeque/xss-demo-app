
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

        // check empty storage table
        {
          expect(storageTable.classList).toContain('empty');
          const storageRows = storageTable.querySelectorAll('tr');
          expect(storageRows.length).toBe(3);
          expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
          expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
          expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['actions']));
        }

        // check "add new item" form
        const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
        addNewItemButton.click();
        expect(storageTable.querySelectorAll('tr').length).toBe(4);
        const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
        const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
        const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
        const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;

        // submit "add new item" form
        newKeyField.value = 'foo';
        newItemField.value = storageTestData.foo;
        saveButton.click();
        expectStorageToContain(testStorage, (({foo}) => ({foo}))(storageTestData));

        // re-check storage table
        expect(storageTable.classList).not.toContain('empty');
        const storageRows2 = storageTable.querySelectorAll('tr');
        expect(storageRows2.length).toBe(4);
        expect(storageRows2[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
        expect(storageRows2[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
        expect(storageRows2[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
        expect(storageRows2[3].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

        // check display of storage item foo
        const entryRow = queryAndExpectOne(storageTable, 'tr.entry') as HTMLTableRowElement;
        const entryKeyField = queryAndExpectOne(entryRow, 'td.key input[type=text]') as HTMLInputElement;
        const entryItemField = queryAndExpectOne(entryRow, 'td.item input[type=text]') as HTMLInputElement;
        expect(entryKeyField.value).toBe('foo');
        expect(entryItemField.value).toBe(storageTestData.foo);

        // use "add new item" form again
        const addNewItemButton2 = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
        addNewItemButton2.click();
        expect(storageTable.querySelectorAll('tr').length).toBe(5);
        const newItemRow2 = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
        const newKeyField2 = queryAndExpectOne(newItemRow2, 'td.key input[type=text]') as HTMLInputElement;
        const newItemField2 = queryAndExpectOne(newItemRow2, 'td.item input[type=text]') as HTMLInputElement;
        const cancelButton2 = queryAndExpectOne(newItemRow2, 'td.actions button[name=cancel]') as HTMLButtonElement;

        // cancel "add new item" form
        newKeyField2.value = 'bar';
        newItemField2.value = storageTestData.bar;
        cancelButton2.click();
        expectStorageToContain(testStorage, (({foo}) => ({foo}))(storageTestData));

        // re-check storage table
        expect(storageTable.classList).not.toContain('empty');
        const storageRows3 = storageTable.querySelectorAll('tr');
        expect(storageRows3.length).toBe(4);
        expect(storageRows3[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
        expect(storageRows3[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
        expect(storageRows3[2].classList).toEqual(jasmine.arrayWithExactContents(['entry']));
        expect(storageRows3[3].classList).toEqual(jasmine.arrayWithExactContents(['actions']));
      });

      function queryStorageTable(): HTMLTableElement {
        return mockPageDoc.body.querySelector('div.' + testStorageName + ' table.storage');
      }

      function expectStorageToContain(storage: Storage, data: {[key: string]: string}) {
        expect(storage.length).toBe(Object.values(data).length);
        for (const [key, item] of Object.entries(data)) {
          expect(storage.getItem(key)).toBe(item);
        }
      }
    }
  });

  function queryAndExpectOne(context: HTMLElement, selector: string): HTMLElement {
    const result = context.querySelectorAll(selector);
    expect(result.length).withContext('number of elements matching query "' + selector + '"').toBe(1);
    return result[0] as HTMLElement;
  }
});
