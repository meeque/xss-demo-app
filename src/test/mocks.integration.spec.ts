import { AsymmetricEqualityTester, anyOf, timeout, domTreeAvailable, queryAndExpectCount, queryAndExpectOne } from './lib.spec';

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

          // add "foo"
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
          testData[testKey] = 'the key of this storage item contains xss payload';
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
        return mockPageDoc.body.querySelector('main article.' + testStorageName + ' table.storage');
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

    const enum SameSite {
      strict = 'strict',
      lax    = 'lax',
      none   = 'none',
    }

    interface CookieId {
      domain?: string;
      path?: string;
      name: string;
      partitioned?: boolean;
    }

    interface Cookie extends CookieId {
      value: string;
      secure?: boolean;
      sameSite?: SameSite;
      expires?: number;
    }

    interface CookieStore {
      getAll(options?: any): Promise<Cookie[]>;
      get(cookie: CookieId): Promise<Cookie>;
      set(cookie: Cookie): Promise<undefined>;
      delete(cookie: CookieId): Promise<undefined>;
    }

    const cookieStore: CookieStore = window['cookieStore'];

    beforeEach(async () => await setUpPageFixture('/assets/mocks/cookies.html'));

    beforeEach(clearCookies);

    afterEach(clearCookies);

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

    describe('sortCookies() function', () => {

      it('should pass through empty cookies array', async () => {
        return expectSortedCookies([], []);
      });

      it('should sort cookies without domain and path by name', async () => {
        return expectSortedCookies(
          [
            {name: 'foo'  },
            {name: 'BAR'  },
            {name: 'baR'  },
            {name: ''     },
            {name: 'Foo'  },
            {name: '42'   },
            {name: 'baaar'},
            {name: 'bar'  },
            {name: 'fooo' },
            {name: '!'    },
            {name: 'fOo'  }
          ],
          [
            {name: ''     },
            {name: '!'    },
            {name: '42'   },
            {name: 'BAR'  },
            {name: 'Foo'  },
            {name: 'baR'  },
            {name: 'baaar'},
            {name: 'bar'  },
            {name: 'fOo'  },
            {name: 'foo'  },
            {name: 'fooo' }
          ]
        );
      });

      it('should sort cookies without domain by path and by name', async () => {
        return expectSortedCookies(
          [
            {path: '',           name: 'foo'},
            {path: '/test',      name: 'BAR'},
            {path: '',           name: '23' },
            {path: '/test',      name: 'BAR'},
            {path: '/',          name: '42' },
            {path: '',           name: 'bar'},
            {path: '/test',      name: 'BAR'},
            {path: '/path/',     name: 'foo'},
            {path: '',           name: '!'  },
            {path: '/',          name: 'BAR'},
            {path: '/test/path', name: 'foo'},
            {path: '/test',      name: 'BAR'},
            {path: '',           name: ''   },
            {path: '/test',      name: 'foo'},
            {path: '/path/',     name: '42' },
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'bar'},
            {path: '/path/',     name: 'bar'},
            {path: '/test',      name: 'BAR'},
            {path: '/',          name: 'foo'},
            {path: '/test/path', name: 'foo'},
            {path: '',           name: 'BAR'},
          ],
          [
            {path: '',           name: ''   },
            {path: '',           name: '!'  },
            {path: '',           name: '23' },
            {path: '',           name: 'BAR'},
            {path: '',           name: 'bar'},
            {path: '',           name: 'foo'},
            {path: '/',          name: '42' },
            {path: '/',          name: 'BAR'},
            {path: '/',          name: 'foo'},
            {path: '/path/',     name: '42' },
            {path: '/path/',     name: 'bar'},
            {path: '/path/',     name: 'foo'},
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'BAR'},
            {path: '/test',      name: 'bar'},
            {path: '/test',      name: 'foo'},
            {path: '/test/path', name: 'foo'},
            {path: '/test/path', name: 'foo'}
          ]
        );
      });

      it('should sort cookies by domain and path and name', async () => {
        return expectSortedCookies(
          [
            {domain: '',            path: '/test/', name: 'foo'},
            {domain: 'xss.example', path: '/test/', name: 'BAR'},
            {domain: '',            path: '/',      name: '23' },
            {domain: 'xss.example', path: '/',      name: 'foo'},
            {domain: 'yss.example', path: '/path/', name: '42' },
            {domain: '',            path: '/',      name: 'bar'},
            {domain: 'xss.example', path: '/test/', name: ''   },
            {domain: '',            path: '/path/', name: 'foo'},
            {domain: '',            path: '/',      name: '!'  },
            {domain: 'yss.example', path: '/path/', name: 'BAR'},
            {domain: 'xss',         path: '/',      name: 'foo'},
            {domain: 'xss.example', path: '/path/', name: 'BAR'},
            {domain: '',            path: '/',      name: ''   },
            {domain: 'xss.example', path: '/test/', name: 'foo'},
            {domain: '',            path: '/path/', name: '42' },
            {domain: 'xss.example', path: '/',      name: 'BAR'},
            {domain: 'xss.example', path: '/path/', name: 'bar'},
            {domain: '',            path: '/path/', name: 'bar'},
            {domain: 'xss.example', path: '/test/', name: '42'},
            {domain: 'yss.example', path: '/',      name: 'foo'},
            {domain: 'xss',         path: '/path/', name: 'bar'},
            {domain: '',            path: '/',      name: 'foo'}
          ],
          [
            {domain: '',            path: '/',      name: ''   },
            {domain: '',            path: '/',      name: '!'  },
            {domain: '',            path: '/',      name: '23' },
            {domain: '',            path: '/',      name: 'bar'},
            {domain: '',            path: '/',      name: 'foo'},
            {domain: '',            path: '/path/', name: '42' },
            {domain: '',            path: '/path/', name: 'bar'},
            {domain: '',            path: '/path/', name: 'foo'},
            {domain: '',            path: '/test/', name: 'foo'},
            {domain: 'xss',         path: '/',      name: 'foo'},
            {domain: 'xss',         path: '/path/', name: 'bar'},
            {domain: 'xss.example', path: '/',      name: 'BAR'},
            {domain: 'xss.example', path: '/',      name: 'foo'},
            {domain: 'xss.example', path: '/path/', name: 'BAR'},
            {domain: 'xss.example', path: '/path/', name: 'bar'},
            {domain: 'xss.example', path: '/test/', name: ''   },
            {domain: 'xss.example', path: '/test/', name: '42' },
            {domain: 'xss.example', path: '/test/', name: 'BAR'},
            {domain: 'xss.example', path: '/test/', name: 'foo'},
            {domain: 'yss.example', path: '/',      name: 'foo'},
            {domain: 'yss.example', path: '/path/', name: '42' },
            {domain: 'yss.example', path: '/path/', name: 'BAR'},
          ]
        );
      });

      async function expectSortedCookies(testCookies: CookieId[], expectedSortedCookies: CookieId[]): Promise<CookieId[]> {
        const sortedCookies = await sortCookies(testCookies as Cookie[]);
        expect(await sortCookies(testCookies as Cookie[])).toEqual(expectedSortedCookies as Cookie[]);
        return sortedCookies;
      }
    });

    describe('getCookieDomainsHierarchy() function', () => {

      it('should pass through simple host names', async () => {
        await expectCookieDomainsHierarchy('localhost', ['localhost']);
        await expectCookieDomainsHierarchy('container-js-dev', ['container-js-dev']);
        await expectCookieDomainsHierarchy('xss', ['xss']);
        await expectCookieDomainsHierarchy('local.',['local.']);
      });

      it('should pass through IPv4 addresses', async () => {
        await expectCookieDomainsHierarchy('127.0.0.1', ['127.0.0.1']);
        await expectCookieDomainsHierarchy('192.168.42.23', ['192.168.42.23']);
        await expectCookieDomainsHierarchy('0.0.0.0', ['0.0.0.0']);
        await expectCookieDomainsHierarchy('1.1.1.1.', ['1.1.1.1.']);
      });

      it('should pass through IPv6 addresses', async () => {
        await expectCookieDomainsHierarchy('[::1]', ['[::1]']);
        await expectCookieDomainsHierarchy('[::]', ['[::]']);
        await expectCookieDomainsHierarchy('[FF:AA::23::42]', ['[FF:AA::23::42]']);
        await expectCookieDomainsHierarchy('[23:42::ab:cd:0e:f0]', ['[23:42::ab:cd:0e:f0]']);
      });

      it('should pass through IP addresses-like invalid DNS names', async () => {
        await expectCookieDomainsHierarchy('foo.bar.23', ['foo.bar.23']);
        await expectCookieDomainsHierarchy('last.domain.label.must.not.be.numeric.42', ['last.domain.label.must.not.be.numeric.42']);
        await expectCookieDomainsHierarchy('sub.42.', ['sub.42.']);
      });

      it('should return the domain itself and all parent domains except for the top-level domain', async () => {
        await expectCookieDomainsHierarchy(
          'xss.dev.meeque.local',
          [
            'xss.dev.meeque.local',
            'dev.meeque.local',
            'meeque.local',
          ]
        );
        await expectCookieDomainsHierarchy(
          'yss.meeque.de',
          [
            'yss.meeque.de',
            'meeque.de'
          ]
        );
        await expectCookieDomainsHierarchy(
          'do.not.treat.public.suffixes.specially.for.now.co.uk',
          [
            'do.not.treat.public.suffixes.specially.for.now.co.uk',
            'not.treat.public.suffixes.specially.for.now.co.uk',
            'treat.public.suffixes.specially.for.now.co.uk',
            'public.suffixes.specially.for.now.co.uk',
            'suffixes.specially.for.now.co.uk',
            'specially.for.now.co.uk',
            'for.now.co.uk',
            'now.co.uk',
            'co.uk'
          ]
        );
      });

      async function expectCookieDomainsHierarchy(testDomain: string, expectedHierarchy: string[]) {
        // test both the getCookieDomainsHierarchy function in the cookies mock page and a local copy
        expect(await getCookieDomainsHierarchy(testDomain)).toEqual(expectedHierarchy);
        expect(getCookieDomainsHierarchySyncCopy(testDomain)).toEqual(expectedHierarchy);
      }
    });

    if (cookieStore === undefined) {

      xit('cannot be tested in this browser, because it does not support the CookieStore API');

    } else {

      describe('should manage cookies', () => {

        for (const testDomain of getCookieDomainsHierarchySyncCopy(document.location.hostname)) {
          for (const testPath of [undefined, '/', '/assets/', '/assets/mocks/']) {

            it('with domain "' + testDomain + '" and path "' + testPath + '"', async () => {

              const testCookies = [] as Cookie[];

              // check no cookies
              await expectCookies(testCookies);
              await expectCookiesTable(testCookies);

              {
                // add  "foo"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'foo',
                  value: 'value of cookie with name "foo"'
                };
                await addCookie(testCookies, testCookie);
                await fillNewCookieForm(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // start adding "bar", but cancel
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'bar',
                  value: 'value of cookie with name "bar"'
                };
                await fillNewCookieForm(testCookie, false);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // add "xxx"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'xxx',
                  value: 'value of cookie with name "xxx"',
                  sameSite: SameSite.lax
                };
                await addCookie(testCookies, testCookie);
                await fillNewCookieForm(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // delete "foo"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'foo'
                };
                removeCookie(testCookies, testCookie);
                await deleteCookieTableCookie(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // add "bar"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'bar',
                  value: 'value of cookie with name "bar"',
                  sameSite: SameSite.none,
                  expires: Date.now() + (60 * 1000)
                };
                await addCookie(testCookies, testCookie);
                await fillNewCookieForm(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // re-add "foo"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'foo',
                  value: 'value of another cookie with name "foo"',
                  sameSite: SameSite.none,
                };
                await addCookie(testCookies, testCookie);
                await fillNewCookieForm(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // edit "bar"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'bar',
                  value: 'new value for cookie with name "bar"',
                  sameSite: SameSite.strict,
                  expires: Date.now() + (60 * 1000)
                };
                await addCookie(testCookies, testCookie);
                await editCookieTableCookie(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // start editing "xxx", but cancel
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'xxx',
                  value: 'unsaved value for item with key "xxx"',
                  sameSite: SameSite.lax,
                  expires: null
                };
                await editCookieTableCookie(testCookie, false);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // edit "foo"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'foo',
                  value: 'new value for cookie with name "foo"',
                  sameSite: SameSite.strict,
                  expires: Date.now() + (10 * 60 * 1000)
                };
                await addCookie(testCookies, testCookie);
                await editCookieTableCookie(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // delete "xxx"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'xxx'
                };
                removeCookie(testCookies, testCookie);
                await deleteCookieTableCookie(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // edit "bar" again, with funky value
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'bar',
                  value: 'payload <img src="." onerror="parent.fail(\'a storage item has triggered xss!\')"> for cookie with name "bar"',
                  sameSite: SameSite.strict,
                  expires: null
                };
                await addCookie(testCookies, testCookie);
                await editCookieTableCookie(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // try adding "" with empty value
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: '',
                  value: '',
                  sameSite: SameSite.none,
                };
                await fillNewCookieForm(testCookie, true, true);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies, true);
              }

              {
                // add ""
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: '',
                  value: 'value of a cookie with an empty name',
                  sameSite: SameSite.none,
                };
                await addCookie(testCookies, testCookie);
                await fillNewCookieForm(testCookie, true);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // try changing value of "" to an empty string
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: '',
                  value: '',
                  sameSite: SameSite.none,
                };
                await editCookieTableCookie(testCookie, true);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies, true);
              }

              {
                // start editing "foo", but cancel
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'foo',
                  value: 'unsaved value for cookie with name "foo"',
                  sameSite: SameSite.none,
                  expires: Date.now() + (60 * 1000)
                };
                await editCookieTableCookie(testCookie, false);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              // wait a bit for async failures
              await timeout(200);
            });

          }
        }

      });

      describe('should reflect external cookie changes', () => {

        for (const testDomain of getCookieDomainsHierarchySyncCopy(document.location.hostname)) {
          for (const testPath of [undefined, '/', '/assets/', '/assets/mocks/']) {

            it('with domain "' + testDomain + '" and path "' + testPath + '"', async () => {

              const testCookies = [] as Cookie[];

              // check no cookies
              await expectCookies(testCookies);
              await expectCookiesTable(testCookies);
      
              {
                // add "FOO"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'FOO',
                  value: 'cookie with name "FOO"'
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) !== null);
                await expectCookiesTable(testCookies);
              }
      
              {
                // add "BAR"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'BAR',
                  value: 'cookie with name "BAR"'
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) !== null);
                await expectCookiesTable(testCookies);
              }
      
              {
                // delete "FOO"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'FOO'
                };
                removeCookie(testCookies, testCookie);
                await cookieStore.delete(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) === null && queryCookiesTableCookie(testCookies[0]) !== null);
                await expectCookiesTable(testCookies);
              }
      
              {
                // add ""
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: '',
                  value: 'cookie with empty name'
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) !== null);
                await expectCookiesTable(testCookies);
              }
      
              {
                // change "BAR"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'BAR',
                  value: 'adjusted cookie with name "BAR"'
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie, testCookie.value) !== null);
                await expectCookiesTable(testCookies);
              }
      
              {
                // re-add "FOO"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'FOO',
                  value: 'another cookie with key "FOO"'
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) !== null);
                await expectCookiesTable(testCookies);
              }
      
              {
                // add item with funky key
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: encodeURIComponent('<img src="." onerror="parent.fail(\'a storage item has triggered xss!\')">'),
                  value: 'the name of this cookie contains xss payload (when url-decoded)'
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) !== null);
                await expectCookiesTable(testCookies);
      
                // delete item with funky key
                removeCookie(testCookies, testCookie);
                await cookieStore.delete(testCookie);
                await domTreeAvailable(queryCookiesTable(), () => queryCookiesTableCookie(testCookie) === null && queryCookiesTableCookie(testCookies[0]) !== null);
                await expectCookiesTable(testCookies);
              }
      
              // wait a bit for async failures
              await timeout(500);
            });

          }
        }

      });

    }

    function queryCookiesTable(): HTMLTableElement {
      return queryAndExpectOne(mockPageDoc.body, 'main article.cookies table.cookies') as HTMLTableElement;
    }

    function queryCookiesTableCookie(cookie: CookieId, value?: string): HTMLTableRowElement {
      const storageTableCookieRows = queryCookiesTable().querySelectorAll('tr.cookie') as NodeListOf<HTMLTableRowElement>;
      for (const cookieRow of storageTableCookieRows) {
        if (typeof cookie.domain === 'string') {
          const cookieDomainField = queryAndExpectOne(cookieRow, 'td.domain input[type=text]') as HTMLInputElement;
          if (cookie.domain === document.location.hostname) {
            if (cookieDomainField.value != cookie.domain && cookieDomainField.value != '') {
              continue;
            }
          } else {
            if (cookieDomainField.value != cookie.domain) {
              continue;
            }
          }
        }
        if (typeof cookie.path === 'string') {
          const cookiePathField = queryAndExpectOne(cookieRow, 'td.path input[type=text]') as HTMLInputElement;
          if (cookiePathField.value != cookie.path) {
            continue;
          }
        }
        if (typeof cookie.name === 'string') {
          const cookieNameField = queryAndExpectOne(cookieRow, 'td.name input[type=text]') as HTMLInputElement;
          if (cookieNameField.value != cookie.name) {
            continue;
          }
        }
        if (typeof value === 'string') {
          const cookieValueField = queryAndExpectOne(cookieRow, 'td.value input[type=text]') as HTMLInputElement;
          if (cookieValueField.value != value) {
            continue;
          }
        }
        return cookieRow;
      }
      return null;
    }

    async function fillNewCookieForm(testCookie: Cookie, save = true, expectError = false): Promise<void> {

      const cookiesTable = queryCookiesTable();
      const initialCookiesTableRows = cookiesTable.querySelectorAll('tr');

      const newCookieButton = queryAndExpectOne(cookiesTable, 'tr.actions button[name=new]') as HTMLButtonElement;
      newCookieButton.click();

      queryAndExpectCount(cookiesTable, 'tr', initialCookiesTableRows.length + 1);
      expect(cookiesTable.classList).withContext('cookies table classes').not.toContain('empty');
      expect(newCookieButton.disabled).withContext('"create new cookie" button disabled').toBeTrue();
      const errorMessageCell = queryAndExpectOne(cookiesTable, 'tr.actions td.message.error');
      expect(errorMessageCell.textContent.trim()).toBe('');

      const cookieRow = queryAndExpectOne(cookiesTable, 'tr.cookie.new') as HTMLTableRowElement;
      const domainField = queryAndExpectOne(cookieRow, 'td.domain input[type=text]') as HTMLInputElement;
      const pathField = queryAndExpectOne(cookieRow, 'td.path input[type=text]') as HTMLInputElement;
      const nameField = queryAndExpectOne(cookieRow, 'td.name input[type=text]') as HTMLInputElement;
      const valueField = queryAndExpectOne(cookieRow, 'td.value input[type=text]') as HTMLInputElement;
      const secureCheckbox = queryAndExpectOne(cookieRow, 'td.secure input[type=checkbox]') as HTMLInputElement;
      const httpOnlyCheckbox = queryAndExpectOne(cookieRow, 'td.httpOnly input[type=checkbox]') as HTMLInputElement;
      const sameSiteSelect = queryAndExpectOne(cookieRow, 'td.sameSite select') as HTMLSelectElement;
      const expiresField = queryAndExpectOne(cookieRow, 'td.expires input[type=text]') as HTMLInputElement;
      const editButton = queryAndExpectOne(cookieRow, 'td.actions button[name=edit]') as HTMLButtonElement;
      const deleteButton = queryAndExpectOne(cookieRow, 'td.actions button[name=delete]') as HTMLButtonElement;
      const saveButton = queryAndExpectOne(cookieRow, 'td.actions button[name=save]') as HTMLButtonElement;
      const cancelButton = queryAndExpectOne(cookieRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

      expect(domainField.value).toBe('');
      expect(pathField.value).toBe('/');
      expect(nameField.value).toBe('');
      expect(valueField.value).toBe('');
      expect(secureCheckbox.checked).toBeTrue();
      expect(httpOnlyCheckbox.checked).toBeFalse();
      expect(sameSiteSelect.value).toBe(SameSite.strict);
      expect(expiresField.value).toBe('');
      expect(editButton.disabled).toBeTrue();
      expect(deleteButton.disabled).toBeTrue();
      expect(saveButton.disabled).toBeFalse();
      expect(cancelButton.disabled).toBeFalse();

      if (testCookie.domain !== undefined) domainField.value = testCookie.domain;
      if (testCookie.path !== undefined) pathField.value = testCookie.path;
      if (testCookie.name !== undefined) nameField.value = testCookie.name;
      if (testCookie.value !== undefined) valueField.value = testCookie.value;
      if (testCookie.sameSite !== undefined) sameSiteSelect.value = testCookie.sameSite;
      if (testCookie.expires !== undefined) {
        expiresField.value = (typeof testCookie.expires === 'number') ? testCookie.expires.toString() : '';
      }

      (save ? saveButton : cancelButton).dispatchEvent(new Event('click'));
      await timeout(100);
      queryAndExpectCount(queryCookiesTable(), 'tr', initialCookiesTableRows.length + (save && !expectError ? 1 : 0));
    }

    async function editCookieTableCookie(testCookie: Cookie, save = true): Promise<void> {

      const cookiesTable = queryCookiesTable();
      const initialCookiesTableRows = cookiesTable.querySelectorAll('tr');
      const cookieRow = queryCookiesTableCookie(testCookie);
      const editButton = queryAndExpectOne(cookieRow, 'td.actions button[name=edit]') as HTMLButtonElement;

      editButton.click();
      await timeout(100);

      queryAndExpectCount(cookiesTable, 'tr', initialCookiesTableRows.length);
      expect(cookiesTable.classList).withContext('cookies table classes').not.toContain('empty');
      const newCookieButton = queryAndExpectOne(cookiesTable, 'tr.actions button[name=new]') as HTMLButtonElement;
      expect(newCookieButton.disabled).withContext('"create new cookie" button disabled').toBeTrue();
      const errorMessageCell = queryAndExpectOne(cookiesTable, 'tr.actions td.message.error');
      expect(errorMessageCell.textContent.trim()).toBe('');

      const domainField = queryAndExpectOne(cookieRow, 'td.domain input[type=text]') as HTMLInputElement;
      const pathField = queryAndExpectOne(cookieRow, 'td.path input[type=text]') as HTMLInputElement;
      const nameField = queryAndExpectOne(cookieRow, 'td.name input[type=text]') as HTMLInputElement;
      const valueField = queryAndExpectOne(cookieRow, 'td.value input[type=text]') as HTMLInputElement;
      const sameSiteSelect = queryAndExpectOne(cookieRow, 'td.sameSite select') as HTMLSelectElement;
      const expiresField = queryAndExpectOne(cookieRow, 'td.expires input[type=text]') as HTMLInputElement;
      const deleteButton = queryAndExpectOne(cookieRow, 'td.actions button[name=delete]') as HTMLButtonElement;
      const saveButton = queryAndExpectOne(cookieRow, 'td.actions button[name=save]') as HTMLButtonElement;
      const cancelButton = queryAndExpectOne(cookieRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

      expect(domainField.value).toBe(testCookie.domain || '');
      expect(pathField.value).toBe(testCookie.path || '/');
      expect(nameField.value).toBe(testCookie.name || '');
      expect(editButton.disabled).toBeTrue();
      expect(deleteButton.disabled).toBeTrue();
      expect(saveButton.disabled).toBeFalse();
      expect(cancelButton.disabled).toBeFalse();

      if (testCookie.value !== undefined) valueField.value = testCookie.value;
      if (testCookie.sameSite !== undefined) sameSiteSelect.value = testCookie.sameSite;
      if (testCookie.expires !== undefined) {
        expiresField.value = (typeof testCookie.expires === 'number') ? testCookie.expires.toString() : '';
      }

      save ? saveButton.click() : cancelButton.click();
      await timeout(100);
      queryAndExpectCount(queryCookiesTable(), 'tr', initialCookiesTableRows.length);
    }

    async function deleteCookieTableCookie(cookie: CookieId): Promise<void> {
      const initialCookiesTableRows = queryCookiesTable().querySelectorAll('tr');
      const cookieRow = queryCookiesTableCookie(cookie);
      const deleteButton = queryAndExpectOne(cookieRow, 'td.actions button[name=delete]') as HTMLButtonElement;

      deleteButton.click();
      await timeout(100);
      queryAndExpectCount(queryCookiesTable(), 'tr', initialCookiesTableRows.length - 1);
    }

    async function expectCookies(testCookies: Cookie[]) {
      const cookies = await getAllCookies();
      expect(cookies.length).withContext('number of cookies').toBe(testCookies.length);

      let i = 0;
      for (const cookie of cookies) {
        expect(cookie).toEqual(cookieProps(testCookies[i++]));
      }
    }

    function expectCookieRowValues(cookieRow: HTMLElement, cookie: Cookie) {
      const domainField = queryAndExpectOne(cookieRow, 'td.domain input[type=text]') as HTMLInputElement;
      const pathField = queryAndExpectOne(cookieRow, 'td.path input[type=text]') as HTMLInputElement;
      const nameField = queryAndExpectOne(cookieRow, 'td.name input[type=text]') as HTMLInputElement;
      const valueField = queryAndExpectOne(cookieRow, 'td.value input[type=text]') as HTMLInputElement;
      const secureCheckbox = queryAndExpectOne(cookieRow, 'td.secure input[type=checkbox]') as HTMLInputElement;
      const httpOnlyCheckbox = queryAndExpectOne(cookieRow, 'td.httpOnly input[type=checkbox]') as HTMLInputElement;
      const sameSiteSelect = queryAndExpectOne(cookieRow, 'td.sameSite select') as HTMLSelectElement;
      const expiresField = queryAndExpectOne(cookieRow, 'td.expires input[type=text]') as HTMLInputElement;
      const editButton = queryAndExpectOne(cookieRow, 'td.actions button[name=edit]') as HTMLButtonElement;
      const deleteButton = queryAndExpectOne(cookieRow, 'td.actions button[name=delete]') as HTMLButtonElement;
      const saveButton = queryAndExpectOne(cookieRow, 'td.actions button[name=save]') as HTMLButtonElement;
      const cancelButton = queryAndExpectOne(cookieRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

      if (cookie.domain === document.location.hostname) {
        expect(domainField.value).toEqual(anyOf([cookie.domain, '']));
      } else {
        expect(domainField.value).toBe(cookie.domain || '');
      }
      expect(pathField.value).toBe(cookie.path || '/');
      expect(nameField.value).toBe(cookie.name || '');
      expect(valueField.value).toBe(cookie.value || '');
      expect(secureCheckbox.checked).toBe(typeof cookie.secure === 'boolean' ? cookie.secure : true);
      expect(httpOnlyCheckbox.checked).toBeFalse();
      expect(sameSiteSelect.value).toBe(typeof cookie.sameSite === 'string' ? cookie.sameSite : 'strict');
      expect(expiresField.value).toBe(cookie.expires != null ? cookie.expires.toString() : 'session');
      expect(editButton.disabled).toBeFalse();
      expect(deleteButton.disabled).toBeFalse();
      expect(saveButton.disabled).toBeTrue();
      expect(cancelButton.disabled).toBeTrue();
    }

    async function expectCookiesTable(cookies: Cookie[], expectError=false) {
      const cookiesTable = queryCookiesTable();

      await sortCookies(cookies);
      const cookiesCount = cookies.length;
      const rowCount = cookiesCount + 3;

      if (cookiesCount === 0) {
        expect(cookiesTable.classList).withContext('cookies table classes').toContain('empty');
      } else {
        expect(cookiesTable.classList).withContext('cookies table classes').not.toContain('empty');
      }
      const newCookieButton = queryAndExpectOne(cookiesTable, 'tr.actions button[name=new]') as HTMLButtonElement;
      expect(newCookieButton.disabled).withContext('"create new cookie" button disabled').toBeFalse();
      const errorMessageCell = queryAndExpectOne(queryCookiesTable(), 'tr.actions td.message.error');
      expect(errorMessageCell.textContent.trim()).toEqual(expectError ? jasmine.stringContaining('Error') : '');

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
            if (expected.domain === document.location.hostname) {
              if (actual.domain != expected.domain && actual.domain != null) return false;
            } else {
              if (actual.domain != expected.domain) return false;
            }
          } else {
            if (actual.domain != null) return false;
          }
          if (typeof expected.path === 'string') {
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

    async function sortCookies(cookies: Cookie[]): Promise<Cookie[]> {
      const sortedCookies = await runInPageFixture(
        'return sortCookies(' + JSON.stringify(cookies) +');'
      ) as Cookie[];
      cookies.splice(0, cookies.length, ... sortedCookies);
      return cookies;
    }

    function getCookieIndex(cookies: Cookie[], id: CookieId): number {
      for (let i = 0; i < cookies.length; i++) {
        if (id.domain !== undefined && cookies[i].domain != id.domain) continue;
        if (id.path !== undefined && cookies[i].path != id.path) continue;
        if (id.name !== undefined && cookies[i].name != id.name) continue;
        return i;
      }
      return -1;
    }

    function addCookie(cookies: Cookie[], cookie: Cookie): Promise<Cookie[]> {
      const index = getCookieIndex(cookies, cookie);
      if (index >= 0) {
        cookies[index] = cookie;
      } else {
        cookies.push(cookie);
      }
      return sortCookies(cookies);
    }

    function removeCookie(cookies: Cookie[], id: CookieId): Cookie[] {
      const index = getCookieIndex(cookies, id);
      if (index >= 0) {
        cookies.splice(index, 1);
      }
      return cookies;
    }

    async function getAllCookies(): Promise<Cookie[]> {
      return sortCookies(
        await runInPageFixture(
          'return cookieStore.getAll();'
        )
      );
    }

    function clearCookies(): Promise<void> {
      return runInPageFixture(
        'const cookieDeletePromises = [];',
        'for (const cookie of await cookieStore.getAll()) {',
        '  cookieDeletePromises.push(cookieStore.delete(cookie));',
        '}',
        'return Promise.all(cookieDeletePromises);'
      );
    }

    function getCookieDomainsHierarchy(domain: string): Promise<string[]> {
      return runInPageFixture(
        'return getCookieDomainsHierarchy(' + JSON.stringify(domain) +');'
      ) as Promise<string[]>;
    }

    // this is a copy of getCookieDomainsHierarchy()
    // this copy is necessary, because the async original cannot be used during test generation
    // this test suite has tests that assert that both flawors work in an equal manner
    function getCookieDomainsHierarchySyncCopy(domain: string): string[] {
      const domainLabels = domain.split('.').filter((label) => label !== '');

      if (domainLabels.length === 1) {
        return [domain];
      }

      if (/^[0-9]+$/.test(domainLabels.at(-1))) {
        return [domain];
      }

      const domains = [] as string[];
      for (let i = 0; i < domainLabels.length; i++)
      {
        domains.push(domainLabels.slice(i, domainLabels.length).join('.'));
      }
      domains.pop();
      return domains;
    }
  });

  describe('Post Message Page', () => {

    interface TestEvent {
      data: any;
      expectTrusted?: boolean;
    }

    interface TestOriginConfig {
      origins: string[];
      expectTrusted?: boolean;
    }

    beforeEach(async () => await setUpPageFixture('/assets/mocks/message.html'));

    it('should sort origins alphabethically', async () => {
      await expectAsync(sortOrigins([])).toBeResolvedTo([]);

      await expectAsync(sortOrigins([null])).toBeResolvedTo([null]);
      await expectAsync(sortOrigins([undefined])).toBeResolvedTo([null]);
      await expectAsync(sortOrigins([''])).toBeResolvedTo(['']);
      await expectAsync(sortOrigins(['foo'])).toBeResolvedTo(['foo']);
      await expectAsync(sortOrigins(['https://xss.example'])).toBeResolvedTo(['https://xss.example']);
      await expectAsync(sortOrigins(['http://xss.example:8080'])).toBeResolvedTo(['http://xss.example:8080']);

      await expectAsync(sortOrigins([null, 'origin'])).toBeResolvedTo([null, 'origin']);
      await expectAsync(sortOrigins(['origin', null])).toBeResolvedTo([null, 'origin']);
      await expectAsync(sortOrigins([undefined, 'value'])).toBeResolvedTo([null, 'value']);
      await expectAsync(sortOrigins(['value', undefined])).toBeResolvedTo([null, 'value']);
      await expectAsync(sortOrigins(['', 'test'])).toBeResolvedTo(['', 'test']);
      await expectAsync(sortOrigins(['test', ''])).toBeResolvedTo(['', 'test']);
      await expectAsync(sortOrigins(['foo', 'bar'])).toBeResolvedTo(['bar', 'foo']);
      await expectAsync(sortOrigins(['bar', 'foo'])).toBeResolvedTo(['bar', 'foo']);
      await expectAsync(sortOrigins(['http://xss.example', 'https://xss.example'])).toBeResolvedTo(['http://xss.example', 'https://xss.example']);
      await expectAsync(sortOrigins(['https://xss.example', 'http://xss.example'])).toBeResolvedTo(['http://xss.example', 'https://xss.example']);
      await expectAsync(sortOrigins(['https://xss.example', 'https://yss.example'])).toBeResolvedTo(['https://xss.example', 'https://yss.example']);
      await expectAsync(sortOrigins(['https://yss.example', 'https://xss.example'])).toBeResolvedTo(['https://xss.example', 'https://yss.example']);

      await expectAsync(sortOrigins(['one', 'three', 'two'])).toBeResolvedTo(['one', 'three', 'two']);
      await expectAsync(sortOrigins(['one', 'two', 'three'])).toBeResolvedTo(['one', 'three', 'two']);
      await expectAsync(sortOrigins(['three', 'one', 'two'])).toBeResolvedTo(['one', 'three', 'two']);
      await expectAsync(sortOrigins(['three', 'two', 'one'])).toBeResolvedTo(['one', 'three', 'two']);

      await expectAsync(sortOrigins(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443'])).toBeResolvedTo(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443']);
      await expectAsync(sortOrigins(['https://yss.example', 'http://yss.example', 'http://xss.example:8080', 'http://yss.example:8080', 'https://xss.example', 'https://yss.example:8443', 'http://xss.example', 'https://xss.example:8443'])).toBeResolvedTo(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443']);
      await expectAsync(sortOrigins(['http://yss.example', 'https://xss.example:8443', 'http://xss.example:8080', 'http://yss.example:8080', 'https://yss.example', 'https://xss.example', 'https://yss.example:8443', 'http://xss.example'])).toBeResolvedTo(['http://xss.example', 'http://xss.example:8080', 'http://yss.example', 'http://yss.example:8080', 'https://xss.example', 'https://xss.example:8443', 'https://yss.example', 'https://yss.example:8443']);
    });

    it('is loaded', () => {
      expect(mockPageDoc).toEqual(jasmine.anything());
    });

    describe('"Trusted Origins" table', () => {

      it('should initially contain own origin', () => {
        return expectOriginsTable([window.origin]);
      });

      it('should manage trusted origins', async () => {

        const origins = new Set<string>([window.origin]);
        await expectOriginsTable(origins);

        {
          const origin = 'https://xss.example';
          origins.add(origin);
          fillNewOriginForm(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = 'https://yss.example';
          origins.add(origin);
          fillNewOriginForm(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = window.origin;
          origins.delete(origin);
          untrustOrigin(origin);
          await expectOriginsTable(origins);
        }

        {
          // start adding origin, but do not save
          const origin = 'https://zss.example';
          fillNewOriginForm(origin, false);
          await expectOriginsTable(origins);
        }

        {
          const origin = 'lololo';
          origins.add(origin);
          fillNewOriginForm(origin);
          await expectOriginsTable(origins, true);

          origins.delete(origin);
          untrustOrigin(origin);
          await expectOriginsTable(origins);
        }

        {
          // re-add existing origin
          const origin = 'https://xss.example';
          fillNewOriginForm(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = window.origin;
          origins.add(origin);
          fillNewOriginForm(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = 'https://zss.example';
          origins.delete(origin);
          untrustOrigin(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = 'https://yss.example';
          origins.delete(origin);
          untrustOrigin(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = 'https://xss.example';
          origins.delete(origin);
          untrustOrigin(origin);
          await expectOriginsTable(origins);
        }

        {
          const origin = window.origin;
          origins.delete(origin);
          untrustOrigin(origin);
          await expectOriginsTable(origins);
        }

        await expectOriginsTable([]);
      });

    });

    describe('"Received Post-Message Events" table', () => {

      const testOriginConfigs: TestOriginConfig[] = [
        {
          origins: [window.origin],
          expectTrusted: true
        },
        {
          origins: ['https://xss.example', window.origin],
          expectTrusted: true
        },
        {
          origins: [window.origin, 'http://yss.example'],
          expectTrusted: true
        },
        {
          origins: [],
          expectTrusted: false
        },
        {
          origins: ['https://xss.example'],
          expectTrusted: false
        },
        {
          origins: ['http://yss.example', 'http://zss.example'],
          expectTrusted: false
        },
      ];

      it('should initially be empty', async () => {
        await expectEventsTable();
      });

      for (const testOriginConfig of testOriginConfigs) {

        it(
          'should '
          + (testOriginConfig.expectTrusted ? '' : 'NOT ')
          + 'trust events from '
          + window.origin
          + ' when trusted origns are [ '
          + testOriginConfig.origins.join(', ')
          + ' ]',
          async () => {
            await configureTrustedOrigins(testOriginConfig.origins);
            const postedEvents = [] as TestEvent[];

            await postMessageAndExpectEventsTable('first', postedEvents, testOriginConfig);
            await postMessageAndExpectEventsTable('second', postedEvents, testOriginConfig);
            await postMessageAndExpectEventsTable('third', postedEvents, testOriginConfig);
            await postMessageAndExpectEventsTable('fourth', postedEvents, testOriginConfig);

            const clearButton = queryEventsTable().querySelector('tr.actions button[name=clear]') as HTMLButtonElement;
            clearButton.click();
            postedEvents.splice(0);
            expectEventsTable();

            await postMessageAndExpectEventsTable('foo', postedEvents, testOriginConfig);
            await postMessageAndExpectEventsTable('bar', postedEvents, testOriginConfig);
            await postMessageAndExpectEventsTable('baz', postedEvents, testOriginConfig);
            await postMessageAndExpectEventsTable('qux', postedEvents, testOriginConfig);
          }
        );

      }

    });

    function queryOriginsTable(): HTMLTableElement {
      return queryAndExpectOne(mockPageDoc.body, 'table.origins') as HTMLTableElement;
    }

    function queryOriginsTableOrigin(origin: string): HTMLTableRowElement {
      const originRows = queryOriginsTable().querySelectorAll('tr.origin') as NodeListOf<HTMLTableRowElement>;
      for (const originRow of originRows) {
        const originField = queryAndExpectOne(originRow, 'td.origin input[name=origin]') as HTMLInputElement;
        if (originField.value == origin) {
          return originRow;
        }
      }
      return null;
    }

    async function fillNewOriginForm(origin: string, save = true): Promise<void> {

      const isExistingOrigin = queryOriginsTableOrigin(origin) != null;

      const originsTable = queryOriginsTable();
      const initialOriginsTableRows = originsTable.querySelectorAll('tr');

      const newOriginButton = queryAndExpectOne(originsTable, 'tr.actions button[name=new]') as HTMLButtonElement;
      newOriginButton.click();

      queryAndExpectCount(originsTable, 'tr', initialOriginsTableRows.length + 1);
      expect(originsTable.classList).withContext('origins table classes').not.toContain('empty');
      expect(newOriginButton.disabled).withContext('"new trusted origin" button disabled').toBeTrue();
      const warningMessageCell = queryAndExpectOne(originsTable, 'tr.actions td.message.warning');
      expect(warningMessageCell.textContent.trim()).toBe('');

      const originRow = queryAndExpectOne(originsTable, 'tr.origin.new') as HTMLTableRowElement;
      const originField = queryAndExpectOne(originRow, 'td.origin input[name=origin]') as HTMLInputElement;
      const untrustButton = queryAndExpectOne(originRow, 'td.actions button[name=untrust]') as HTMLButtonElement;
      const trustButton = queryAndExpectOne(originRow, 'td.actions button[name=trust]') as HTMLButtonElement;
      const cancelButton = queryAndExpectOne(originRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

      expect(originField.value).toBe('');
      expect(originField.disabled).toBeFalse();
      expect(untrustButton.disabled).toBeTrue();
      expect(trustButton.disabled).toBeFalse();
      expect(cancelButton.disabled).toBeFalse();

      originField.value = origin;
      (save ? trustButton : cancelButton).dispatchEvent(new Event('click'));

      queryAndExpectCount(queryOriginsTable(), 'tr', initialOriginsTableRows.length + ((save && !isExistingOrigin) ? 1 : 0));
    }

    async function untrustOrigin(origin: string): Promise<void> {

      const originsTable = queryOriginsTable();
      const initialOriginsTableRows = originsTable.querySelectorAll('tr');

      const originRow = queryOriginsTableOrigin(origin);
      const untrustButton = queryAndExpectOne(originRow, 'td.actions button[name=untrust]') as HTMLButtonElement;

      untrustButton.click();
      queryAndExpectCount(queryOriginsTable(), 'tr', initialOriginsTableRows.length - 1);
    }

    async function configureTrustedOrigins(origins: string[]): Promise<void> {
      await untrustOrigin(window.origin);
      for (const trustedOrigin of origins) {
        await fillNewOriginForm(trustedOrigin)
      }
    }

    async function expectOriginsTable(origins = [] as Iterable<string>, expectWarning = false) {
      const originsTable = queryOriginsTable();

      const sortedOrigins = await sortOrigins(origins);
      const originsCount = sortedOrigins.length;
      const rowCount = originsCount + 3;

      const originRows = queryAndExpectCount(originsTable, 'tr', rowCount);
      expect(originRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
      expect(originRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'info', 'empty']));
      expect(originRows[rowCount-1].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

      const newOriginButton = queryAndExpectOne(originRows[rowCount-1], 'button[name=new]') as HTMLButtonElement;
      expect(newOriginButton.disabled).withContext('"new trusted origin" button disabled').toBeFalse();

      const warningMessageCell = queryAndExpectOne(originsTable, 'tr.actions td.message.warning');
      if (expectWarning) {
        expect(warningMessageCell.textContent.trim()).not.toBe('');
      }
      else {
        expect(warningMessageCell.textContent.trim()).toBe('');
      }

      let index = 2;
      for (const origin of sortedOrigins) {
        const originRow = originRows[index++];

        const originField = queryAndExpectOne(originRow, 'td.origin input[name=origin]') as HTMLInputElement;
        const untrustButton = queryAndExpectOne(originRow, 'td.actions button[name=untrust]') as HTMLButtonElement;
        const trustButton = queryAndExpectOne(originRow, 'td.actions button[name=trust]') as HTMLButtonElement;
        const cancelButton = queryAndExpectOne(originRow, 'td.actions button[name=cancel]') as HTMLButtonElement;

        expect(originRow.classList).withContext('origin row classes').not.toContain('new');
        expect(originField.value).toBe(origin);
        expect(originField.disabled).toBeTrue();
        expect(untrustButton.disabled).toBeFalse();
        expect(trustButton.disabled).toBeTrue();
        expect(cancelButton.disabled).toBeTrue();
      }
    }

    function sortOrigins(origins: Iterable<string> ): Promise<string[]> {
      return runInPageFixture(
        'return sortOrigins(' + JSON.stringify(Array.from(origins)) +');'
      );
    }

    function queryEventsTable(): HTMLTableElement {
      return queryAndExpectOne(mockPageDoc.body, 'table.events') as HTMLTableElement;
    }

    async function postMessageAndExpectEventsTable(newEventData: string, postedEvents: TestEvent[], testOriginConfig: TestOriginConfig) {

      pageFixture.contentWindow.postMessage(newEventData, window.origin);

      postedEvents.push({
        data: newEventData,
        expectTrusted: testOriginConfig.expectTrusted
      });
      await domTreeAvailable(
        queryEventsTable(),
        ':nth-child(' + postedEvents.length + ' of tr.event)'
      );
      await expectEventsTable(
        postedEvents,
        !testOriginConfig.expectTrusted
      );
    }

    async function expectEventsTable(events = [] as TestEvent[], expectError = false) {
      const eventsTable = queryEventsTable()
      const rowCount = events.length + 3;

      expect(eventsTable.classList).withContext('events table classes').toEqual(jasmine.arrayWithExactContents(events.length > 0 ? ['events'] : ['events', 'empty']));

      const eventRows = queryAndExpectCount(eventsTable, 'tr', rowCount);
      expect(eventRows[0].classList).toEqual(jasmine.arrayWithExactContents(['head']));
      expect(eventRows[1].classList).toEqual(jasmine.arrayWithExactContents(['message', 'info', 'empty']));
      expect(eventRows[rowCount-1].classList).toEqual(jasmine.arrayWithExactContents(['actions']));

      const clearButton = queryAndExpectOne(eventRows[rowCount-1], 'button[name=clear]') as HTMLButtonElement;
      expect(clearButton.disabled).withContext('"clear events" button disabled').toBeFalse();

      const errorMessageCell = queryAndExpectOne(eventsTable, 'tr.actions td.message.error');
      if (expectError) {
        expect(errorMessageCell.textContent.trim()).not.toBe('');
      }
      else {
        expect(errorMessageCell.textContent.trim()).toBe('');
      }

      let index = 2;
      for (const event of events) {
        const eventRow = eventRows[index++];

        const originElement = queryAndExpectOne(eventRow, 'td.origin code') as HTMLElement;
        const timeStampElement = queryAndExpectOne(eventRow, 'td.timestamp code') as HTMLElement;
        const dataElement = queryAndExpectOne(eventRow, 'td.data code') as HTMLElement;

        expect(eventRow.classList).withContext('post-message event classes').toContain(event.expectTrusted ? 'trusted' : 'untrusted');
        expect(originElement.textContent).withContext('post-message event origin').toBe(window.origin);
        expect(Number.parseFloat(timeStampElement.textContent)).withContext('post-message event timestamp').not.toBeNaN();
        expect(dataElement.textContent).withContext('post-message event data (JSON encoded)').toBe(JSON.stringify(event.data));
      }
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

  async function runInPageFixture(... codeLines: string[]): Promise<any> {

    const RESULT_ATTRIBUTE = 'data-xss-demo-tests-run-in-page-fixture-result';
    const ERROR_ATTRIBUTE = 'data-xss-demo-tests-run-in-page-fixture-error';

    const scriptLines = [
      '(async function() {',
      '  const scriptBlock = document.currentScript;',
      '  (async function() {',
      ... codeLines.map(line => '    ' + line),
      '  })()',
      '  .then(',
      '    (result) => {',
      '      scriptBlock.setAttribute("' + RESULT_ATTRIBUTE + '", JSON.stringify(result));',
      '    },',
      '    (error) => {',
      '      scriptBlock.setAttribute("' + ERROR_ATTRIBUTE + '", error?.stack || error);',
      '    }',
      '  );',
      '})();'
    ];

    const scriptBlock = mockPageDoc.createElement('script');
    scriptBlock.setAttribute('type', 'text/javascript');
    scriptBlock.textContent = scriptLines.join('\n');
    mockPageDoc.body.insertAdjacentElement('beforeend', scriptBlock);

    await domTreeAvailable(mockPageDoc.body, 'script[' + RESULT_ATTRIBUTE + '], script[' + ERROR_ATTRIBUTE + ']');
    const result = scriptBlock.getAttribute(RESULT_ATTRIBUTE);
    const error = scriptBlock.getAttribute(ERROR_ATTRIBUTE);
    mockPageDoc.body.removeChild(scriptBlock);

    if (result !== null) {
      return JSON.parse(result);
    }
    if (error !== null) {
      throw new Error(
        'Failed to run code the following code in the page fixture:\n\n'
        + codeLines.join('\n')
        + '\n\nThe error was:\n'
        + error);
    }
    throw new Error('Oops! Something unexpected went wrong when running code in the page fixture.');
  }

  function tearDownPageFixture() {
    document.body.removeChild(pageFixture);
    pageFixture = null;
    mockPageDoc = null;
  }
});
