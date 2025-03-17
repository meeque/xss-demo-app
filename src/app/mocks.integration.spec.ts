import { AsymmetricEqualityTester, timeout, domTreeAvailable } from './lib.spec';

describe('XSS Demo Mocks', () => {

  let pageFixture: HTMLIFrameElement = null;
  let mockPageDoc: Document = null;

  afterEach(tearDownPageFixture);

  describe('Plain Page', () => {

    beforeEach(async () => await setUpPageFixture('/assets/mocks/plain.html'));

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

  });

  describe('Storage Page', () => {

    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    beforeEach(async () => await setUpPageFixture('/assets/mocks/storage.html'));

    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

    for (const testStorageName of ['localStorage', 'sessionStorage']) {

      const testStorage = window[testStorageName] as Storage;

      describe('for ' + testStorageName, () => {

        it('should manage storage contents through its web UI', async () => {

          const testData = {} as {[key: string]: string};

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
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry('FOO') !== null);
          expectStorageTable(testData);

          // add "BAR"
          testData.BAR = 'storage item with key "BAR"';
          testStorage.setItem('BAR', testData.BAR);
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry('BAR') !== null);
          expectStorageTable(testData);

          // delete "FOO"
          delete testData.FOO;
          testStorage.removeItem('FOO');
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry('FOO') === null);
          expectStorageTable(testData);

          // add ""
          testData[''] = 'storage item with empty key';
          testStorage.setItem('', testData['']);
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry('') !== null);
          expectStorageTable(testData);

          // change "BAR"
          testData.BAR = 'adjusted storage item with key "BAR"';
          testStorage.setItem('BAR', testData.BAR);
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry('BAR', testData.BAR) !== null);
          expectStorageTable(testData);

          // re-add "FOO"
          testData.FOO = 'another storage item with key "FOO"';
          testStorage.setItem('FOO', testData.FOO);
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry('FOO') !== null);
          expectStorageTable(testData);

          // add item with funky key
          const testKey = '<img src="." onerror="parent.fail(\'a storage item has triggered xss!\')">';
          testData[testKey] = 'they key of this storage item contains xss payload';
          testStorage.setItem(testKey, testData[testKey]);
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry(testKey) !== null);
          expectStorageTable(testData);

          // delete item with funky key
          delete testData[testKey];
          testStorage.removeItem(testKey);
          await domTreeAvailable(queryStorageTable(), () => queryStorageTableEntry(testKey) === null);
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
        const initialStorageTableRows = storageTable.querySelectorAll('tr');

        const addNewItemButton = queryAndExpectOne(storageTable, 'tr.actions button[name=new]');
        addNewItemButton.click();

        queryAndExpectCount(storageTable, 'tr', initialStorageTableRows.length + 1);
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

  describe('Cookies Page', () => {

    interface Cookie {
      domain?: string;
      path?: string;
      name: string;
      value: string;
      secure?: boolean;
      sameSite?: string;
      partitioned?: boolean;
      expires?: number;
    }

    interface CookieStore {
      getAll(): Promise<Cookie[]>;
      get(cookie: any): Promise<Cookie>;
      set(cookie: Cookie): Promise<undefined>;
      delete(cookie: any): Promise<undefined>;
    }

    const cookieStore: CookieStore = window['cookieStore'];

    beforeEach(clearCookies);

    beforeEach(async () => await setUpPageFixture('/assets/mocks/cookies.html'));

    afterEach(clearCookies);

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

    if (cookieStore === undefined) {

      xit('cannot be tested in this browser, because it does not support the CookieStore API');

    } else {

      it('should manage cookies through its web UI', async () => {

        const testCookies = [] as Cookie[];

        // check no cookies
        await expectCookies(testCookies);
        expectCookiesTable(testCookies);

        {
          // add  "foo"
          const testCookie = {
            name: 'foo',
            value: 'value of cookie with name "foo"'
          };
          testCookies.push(testCookie);
          await fillNewCookieForm(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // start adding "bar", but cancel
          const testCookie = {
            name: 'bar',
            value: 'value of cookie with name "bar"'
          };
          await fillNewCookieForm(testCookie, false);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);

        }

        {
          // add "xxx"
          const testCookie = {
            name: 'xxx',
            value: 'value of cookie with name "xxx"'
          };
          testCookies.push(testCookie);
          await fillNewCookieForm(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // delete "foo"
          const testCookie = {
            name: 'foo',
            value: null
          };
          testCookies.splice(0, 1);
          await deleteCookieTableCookie(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // add "bar"
          const testCookie = {
            name: 'bar',
            value: 'value of cookie with name "bar"'
          };
          testCookies.push(testCookie);
          await fillNewCookieForm(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // re-add "foo"
          const testCookie = {
            name: 'foo',
            value: 'value of another cookie with name "foo"'
          };
          testCookies.push(testCookie);
          await fillNewCookieForm(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // edit "bar"
          const testCookie = {
            name: 'bar',
            value: 'new value for cookie with name "bar"'
          };
          testCookies[0] = testCookie;
          await editCookieTableCookie(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // start editing "xxx", but cancel
          const testCookie = {
            name: 'xxx',
            value: 'unsaved value for item with key "xxx"'
          };
          await editCookieTableCookie(testCookie, false);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // edit "foo"
          const testCookie = {
            name: 'foo',
            value: 'new value for cookie with name "foo"'
          };
          testCookies[1] = testCookie;
          await editCookieTableCookie(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // delete "xxx"
          const testCookie = {
            name: 'xxx',
            value: null
          };
          testCookies.splice(2, 1);
          await deleteCookieTableCookie(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        {
          // edit "bar" again, with funky value
          const testCookie = {
            name: 'bar',
            value: 'payload <img src="." onerror="parent.fail(\'a storage item has triggered xss!\')"> for cookie with name "bar"'
          };
          testCookies[0] = testCookie;
          await editCookieTableCookie(testCookie);
          await expectCookies(testCookies);
          expectCookiesTable(testCookies);
        }

        // wait a bit for async failures
        await timeout(200);
      });

    }

    function queryCookiesTable(): HTMLTableElement {
      return queryAndExpectOne(mockPageDoc.body, 'div.cookies table.cookies') as HTMLTableElement;
    }

    function queryCookiesTableCookie(cookie: Cookie): HTMLTableRowElement {
      const storageTableCookieRows = queryCookiesTable().querySelectorAll('tr.cookie') as NodeListOf<HTMLTableRowElement>;
      for (const cookieRow of storageTableCookieRows) {
        const cookieNameField = queryAndExpectOne(cookieRow, 'td.name input[type=text]') as HTMLInputElement;
        if (cookieNameField.value === cookie.name) {
          return cookieRow;
        }
      }
      return null;
    }

    function fillNewCookieForm(testCookie: Cookie, save = true): Promise<void> {

      const cookiesTable = queryCookiesTable();
      const initialCookiesTableRows = cookiesTable.querySelectorAll('tr');

      const newCookieButton = queryAndExpectOne(cookiesTable, 'tr.actions button[name=new]');
      newCookieButton.click();

      queryAndExpectCount(cookiesTable, 'tr', initialCookiesTableRows.length + 1);
      const row = queryAndExpectOne(cookiesTable, 'tr.cookie.new') as HTMLTableRowElement;
      const domainField = queryAndExpectOne(row, 'td.domain input[type=text]') as HTMLInputElement;
      const pathField = queryAndExpectOne(row, 'td.path input[type=text]') as HTMLInputElement;
      const nameField = queryAndExpectOne(row, 'td.name input[type=text]') as HTMLInputElement;
      const valueField = queryAndExpectOne(row, 'td.value input[type=text]') as HTMLInputElement;
      const sameSiteSelect = queryAndExpectOne(row, 'td.sameSite select') as HTMLSelectElement;
      const expiresField = queryAndExpectOne(row, 'td.expires input[type=text]') as HTMLInputElement;
      const saveButton = queryAndExpectOne(row, 'td.actions button[name=save]') as HTMLButtonElement;
      const cancelButton = queryAndExpectOne(row, 'td.actions button[name=cancel]') as HTMLButtonElement;

      if (testCookie.domain) domainField.value = testCookie.domain;
      if (testCookie.path) pathField.value = testCookie.path;
      if (testCookie.name) nameField.value = testCookie.name;
      if (testCookie.value) valueField.value = testCookie.value;
      if (testCookie.sameSite) sameSiteSelect.value = testCookie.sameSite;
      if (typeof testCookie.expires === 'number') expiresField.value = testCookie.expires.toString();
      (save ? saveButton : cancelButton).dispatchEvent(new Event('click'));

      return timeout(100);
    }

    async function editCookieTableCookie(cookie: Cookie, save = true): Promise<void> {
      const initialCookiesTableRows = queryCookiesTable().querySelectorAll('tr');
      const cookieRow = queryCookiesTableCookie(cookie);
      const editButton = queryAndExpectOne(cookieRow, 'td.actions button[name=edit]') as HTMLButtonElement;

      editButton.click();
      await timeout(100);
      queryAndExpectCount(queryCookiesTable(), 'tr', initialCookiesTableRows.length);

      const cookieValueField = queryAndExpectOne(cookieRow, 'td.value input[type=text]') as HTMLInputElement;
      const saveButton = queryAndExpectOne(cookieRow, 'td.actions button[name=save]') as HTMLButtonElement;
      const cancelButton = queryAndExpectOne(cookieRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

      cookieValueField.value = cookie.value;
      save ? saveButton.click() : cancelButton.click();
      await timeout(100);
      queryAndExpectCount(queryCookiesTable(), 'tr', initialCookiesTableRows.length);
    }

    async function deleteCookieTableCookie(cookie: Cookie): Promise<void> {
      const initialCookiesTableRows = queryCookiesTable().querySelectorAll('tr');
      const cookieRow = queryCookiesTableCookie(cookie);
      const deleteButton = queryAndExpectOne(cookieRow, 'td.actions button[name=delete]') as HTMLButtonElement;

      deleteButton.click();
      await timeout(100);
      queryAndExpectCount(queryCookiesTable(), 'tr', initialCookiesTableRows.length - 1);
    }

    async function expectCookies(testCookies: Cookie[]) {
      const cookies = await cookieStore.getAll();
      expect(cookies.length).withContext('number of cookies').toBe(testCookies.length);

      sortCookies(cookies);
      sortCookies(testCookies);

      let i = 0;
      for (const cookie of cookies) {
        expect(cookie).toEqual(cookieProps(testCookies[i++]));
      }
    }

    function expectCookieRowValues(row: HTMLElement, cookie: Cookie) {
      const domainField = queryAndExpectOne(row, 'td.domain input[type=text]') as HTMLInputElement;
      const pathField = queryAndExpectOne(row, 'td.path input[type=text]') as HTMLInputElement;
      const nameField = queryAndExpectOne(row, 'td.name input[type=text]') as HTMLInputElement;
      const valueField = queryAndExpectOne(row, 'td.value input[type=text]') as HTMLInputElement;
      const secureCheckbox = queryAndExpectOne(row, 'td.secure input[type=checkbox]') as HTMLInputElement;
      const httpOnlyCheckbox = queryAndExpectOne(row, 'td.httpOnly input[type=checkbox]') as HTMLInputElement;
      const sameSiteSelect = queryAndExpectOne(row, 'td.sameSite select') as HTMLSelectElement;
      const expiresField = queryAndExpectOne(row, 'td.expires input[type=text]') as HTMLInputElement;

      expect(domainField.value).toBe(cookie.domain || '');
      expect(pathField.value).toBe(cookie.path || '/');
      expect(nameField.value).toBe(cookie.name || '');
      expect(valueField.value).toBe(cookie.value || '');
      expect(secureCheckbox.checked).toBe(typeof cookie.secure === 'boolean' ? cookie.secure : true );
      expect(httpOnlyCheckbox.checked).toBe(false);
      expect(sameSiteSelect.value).toBe(typeof cookie.sameSite === 'string' ? cookie.sameSite : 'strict');
      expect(expiresField.value).toBe(cookie.expires != null ? cookie.expires.toString() : 'session');
    }

    function expectCookiesTable(cookies: Cookie[]) {
      const cookiesTable = queryCookiesTable();

      sortCookies(cookies);
      const cookiesCount = cookies.length;
      const rowCount = cookiesCount + 3;

      if (cookiesCount === 0) {
        expect(cookiesTable.classList).withContext('cookies table classes').toContain('empty');
      } else {
        expect(cookiesTable.classList).withContext('cookies table classes').not.toContain('empty');
      }

      const cookieRows = queryAndExpectCount(cookiesTable, 'tr', rowCount);
      expect(cookieRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
      expect(cookieRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'empty']));
      expect(cookieRows[rowCount-1].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

      let index = 2;
      for (const cookie of cookies) {
        const cookieRow = cookieRows[index++];
        expect(cookieRow.classList).toEqual(jasmine.arrayWithExactContents(['cookie']));
        expectCookieRowValues(cookieRow, cookie);
      }
    }

    function cookieProps(expected: Cookie): AsymmetricEqualityTester<Cookie> {
      return {
        asymmetricMatch: function(actual) {
          if (typeof expected.domain === 'string') {
            if (actual.domain != expected.domain) return false;
          } else {
            if (actual.domain != null) return false;
          }
          if (typeof expected.path === 'boolean') {
            if (actual.path != expected.path) return false;
          } else {
            if (actual.path != '/') return false;
          }
          if (typeof expected.name === 'string') {
            if (actual.name != expected.name) return false;
          }
          if (typeof expected.value === 'string') {
            if (actual.value != expected.value) return false;
          }
          if (typeof expected.secure === 'boolean') {
            if (actual.secure !== expected.secure) return false;
          }
          if (typeof expected.sameSite === 'string') {
            if (actual.sameSite != expected.sameSite) return false;
          } else {
            if (actual.sameSite != 'strict') return false;
          }
          if (typeof expected.partitioned === 'boolean') {
            if (actual.partitioned != expected.partitioned) return false;
          }
          if (typeof expected.expires === 'number') {
            if (actual.expires != expected.expires) return false;
          } else {
            if (actual.expires != null) return false;
          }
          return true;
        },
        jasmineToString: function(pp) {
          return 'a cookie with properties ' + pp(expected);
        }
      };
    }

    function sortCookies(cookies: Cookie[]): Cookie[] {
      // this is just copied over from cookies.js
      // integration tests do not care about correct order too much, but sorting makes comparisons easier
      cookies.sort( (c1, c2) => c1.name == c2.name ? 0 : (c1.name < c2.name ? -1 : 1 ) );
      cookies.sort( (c1, c2) => c1.path == c2.path ? 0 : (c1.path < c2.path ? -1 : 1 ) );
      cookies.sort( (c1, c2) => c1.domain == c2.domain ? 0 : (c1.domain < c2.domain ? -1 : 1 ) );
      return cookies;
    }

    async function clearCookies(): Promise<any> {
      const cookieDeletePromises = [] as Promise<any>[];
      for (const cookie of await cookieStore.getAll()) {
        cookieDeletePromises.push(cookieStore.delete(cookie));
      }
      return Promise.all(cookieDeletePromises);
    }
  });

  async function setUpPageFixture(url: string): Promise<void> {
    const {promise: loadPromise, resolve: loadHandler} = Promise.withResolvers();
    pageFixture = document.createElement('iframe');
    pageFixture.style.width = '100%';
    pageFixture.style.height = '30em';
    pageFixture.style.overflow = 'scroll';
    pageFixture.style.border = 'none';
    pageFixture.addEventListener('load', loadHandler);
    pageFixture.src = url;
    document.body.insertAdjacentElement('beforeend', pageFixture);
    await loadPromise;
    mockPageDoc = pageFixture.contentDocument;
  }

  function tearDownPageFixture() {
    document.body.removeChild(pageFixture);
    pageFixture = null;
    mockPageDoc = null;
  }

  function queryAndExpectOne(context: HTMLElement, selector: string): HTMLElement {
    return queryAndExpectCount(context, selector)[0];
  }

  function queryAndExpectCount(context: HTMLElement, selector: string, count: number = 1): HTMLElement[] {
    const result = context.querySelectorAll(selector);
    expect(result.length).withContext('number of elements matching query "' + selector + '"').toBe(count);
    return Array.from(result) as HTMLElement[];
  }
});
