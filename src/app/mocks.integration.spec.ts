
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

  describe('Plain', () => {
    mockUrl = '/assets/mocks/plain.html'

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

  });

  describe('Storage Mock', () => {
    mockUrl = '/assets/mocks/storage.html'

    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should be loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

    it('should initially be empty', () => {
      const storageTable = queryStorageTable();
      expect(storageTable.classList).toContain('empty');

      const storageRows = storageTable.querySelectorAll('tr');
      expect(storageRows.length).toBe(3);

      expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
      expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
      expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['actions']));
    });

    it('should have "add new item" button', () => {
      queryAndExpectOne(queryStorageTable(), 'tr.actions button[name=new]');
    });

    it('should show "add new item" form', async () => {
      const storageTable = queryStorageTable();
      const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');

      addNewItemButton.click();

      expect(storageTable.querySelectorAll('tr').length).toBe(4);

      const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new');
      queryAndExpectOne(newItemRow, 'td.key input[type=text]');
      queryAndExpectOne(newItemRow, 'td.item input[type=text]');
      queryAndExpectOne(newItemRow, 'td.actions button[name=save]');
      queryAndExpectOne(newItemRow, 'td.actions button[name=cancel]');
    });

    it('should add new storage item', () => {
      const storageTable = queryStorageTable();
      const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]') as HTMLButtonElement;

      addNewItemButton.click();

      const newItemRow = queryAndExpectOne(storageTable, 'tr.entry.new') as HTMLTableRowElement;
      const newKeyField = queryAndExpectOne(newItemRow, 'td.key input[type=text]') as HTMLInputElement;
      const newItemField = queryAndExpectOne(newItemRow, 'td.item input[type=text]') as HTMLInputElement;
      const saveButton = queryAndExpectOne(newItemRow, 'td.actions button[name=save]') as HTMLButtonElement;

      newKeyField.value = 'xss-demo-storage-mock-item-foo';
      newItemField.value = 'Mock Value for storage item with key "xss-demo-storage-mock-item-foo"';
      saveButton.click();

      expect(storageTable.querySelectorAll('tr').length).toBe(4);
      expect(storageTable.classList).not.toContain('empty');

      const entryRow = queryAndExpectOne(storageTable, 'tr.entry') as HTMLTableRowElement;
      const entryKeyField = queryAndExpectOne(entryRow, 'td.key input[type=text]') as HTMLInputElement;
      const entryItemField = queryAndExpectOne(entryRow, 'td.item input[type=text]') as HTMLInputElement;

      expect(entryKeyField.value).toBe('xss-demo-storage-mock-item-foo');
      expect(entryItemField.value).toBe('Mock Value for storage item with key "xss-demo-storage-mock-item-foo"');
    });

    function queryStorageTable(): HTMLTableElement {
      return mockPageDoc.body.querySelector('div.localStorage table.storage');
    }
  });

  function queryAndExpectOne(context: HTMLElement, selector: string): HTMLElement {
    const result = context.querySelectorAll(selector);
    expect(result.length).withContext('number of elements matching query "' + selector + '"').toBe(1);
    return result[0] as HTMLElement;
  }
});
