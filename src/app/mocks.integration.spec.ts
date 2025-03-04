
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

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

    it('is empty', () => {
      const storageTable = queryStorageTable();
      expect(storageTable.classList).toContain('empty');

      const storageRows = storageTable.querySelectorAll('tr');
      expect(storageRows.length).toBe(3);

      expect(storageRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
      expect(storageRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
      expect(storageRows[2].classList).toEqual(jasmine.arrayWithExactContents(['actions']));
    });
  });

  function queryStorageTable(): HTMLTableElement {
    return mockPageDoc.body.querySelector('div.localStorage table.storage');
  }
});
