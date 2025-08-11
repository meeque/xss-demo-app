import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import type { ExpectationResult } from 'expect';
import { By, ThenableWebDriver, WebElement, until } from 'selenium-webdriver';
import { timeout, findAndExpectOne, findAndExpectCount, getClasses, getValue, isChecked, setValue, selectOption } from './test-lib';

const enum SameSite {
  strict = 'strict',
  lax    = 'lax',
  none   = 'none',
}

interface CookieId {
  domain?: string
  path?: string
  name: string
  partitioned?: boolean
}

interface Cookie extends CookieId {
  value: string
  secure?: boolean
  sameSite?: SameSite
  expires?: number
}

interface CookieStore {
  getAll(options?: object): Promise<Cookie[]>
  get(cookieId: CookieId): Promise<Cookie>
  set(cookie: Cookie): Promise<undefined>
  delete(cookieId: CookieId): Promise<undefined>
}

class CookieStoreProxy implements CookieStore {
  constructor(private readonly driver: ThenableWebDriver) {
  }

  getAll(options?: object): Promise<Cookie[]> {
    return this.invokeCookieStore(
      options
      ? 'getAll(' + JSON.stringify(options) + ')'
      : 'getAll()'
    );
  }

  get(cookieId: CookieId): Promise<Cookie> {
    return this.invokeCookieStore('get(' + JSON.stringify(cookieId) + ')');
  }

  set(cookie: Cookie): Promise<undefined> {
    return this.invokeCookieStore('set(' + JSON.stringify(cookie) + ')');
  }

  delete(cookieId: CookieId): Promise<undefined> {
    return this.invokeCookieStore('delete(' + JSON.stringify(cookieId) + ')');
  }

  private invokeCookieStore<R>(invocation: string): Promise<R> {
    return this.driver.executeScript('return cookieStore.' + invocation + ';\n');
  }
}



expect.extend({
  toMatchCookie: function(actual: any, expectedCookie: Cookie): ExpectationResult {
    let pass = true;

    if (typeof expectedCookie.domain === 'string') {
      if (expectedCookie.domain === xssDemoAppHostname) {
        if (actual.domain != expectedCookie.domain && actual.domain != null) pass = false;
      }
      else {
        if (actual.domain != expectedCookie.domain) pass = false;
      }
    }
    else {
      if (actual.domain != null) pass = false;
    }

    if (typeof expectedCookie.path === 'string') {
      if (actual.path != expectedCookie.path) pass = false;
    }
    else {
      if (actual.path != '/') pass = false;
    }

    if (typeof expectedCookie.name === 'string') {
      if (actual.name != expectedCookie.name) pass = false;
    }

    if (typeof expectedCookie.value === 'string') {
      if (actual.value != expectedCookie.value) pass = false;
    }

    if (typeof expectedCookie.secure === 'boolean') {
      if (actual.secure !== expectedCookie.secure) pass = false;
    }

    if (typeof expectedCookie.sameSite === 'string') {
      if (actual.sameSite != expectedCookie.sameSite) pass = false;
    }
    else {
      if (actual.sameSite != 'strict') pass = false;
    }

    if (typeof expectedCookie.partitioned === 'boolean') {
      if (actual.partitioned != expectedCookie.partitioned) pass = false;
    }

    if (typeof expectedCookie.expires === 'number') {
      if (actual.expires != expectedCookie.expires) pass = false;
    }
    else {
      if (actual.expires != null) pass = false;
    }

    const matcherHintOptions = {
      comment: 'equality of cookie fields, taking into account default values and cookie domain "' + xssDemoAppHostname + '"',
      isNot: this.isNot,
      promise: this.promise,
    };

    return {
      pass,
      message: () => {
        return this.utils.matcherHint('toMatchCookie', 'Received Cookie', 'Expected Cookie', matcherHintOptions) + '\n\n'
        + 'Expected Cookie: ' + (pass ? 'not ' : '') + this.utils.printExpected(expectedCookie) + '\n'
        + 'Received Cookie: ' + this.utils.printReceived(actual);
      },
    }
  }
});

declare module 'expect' {
  interface Matchers<R> {
    toMatchCookie(cookie: Cookie): R;
  }
}



describe('Cookies Mock', () => {
  let cookieStore: CookieStore;
  let mockPageBody: WebElement = null;

  beforeAll(() => {
    cookieStore = new CookieStoreProxy(driver);
  });

  beforeEach(async () => {
    await driver.get(xssDemoAppUrl + 'assets/mocks/cookies.html');
    mockPageBody = await driver.wait(until.elementLocated(By.css('body')), 2500);
  });

  test('is loaded', () => {
    expect(mockPageBody).toEqual(expect.anything());
  });

  describe('sortCookies() function', () => {
    test('should pass through empty cookies array', async () => {
      return expectSortedCookies([], []);
    });

    test('should sort cookies without domain and path by name', async () => {
      return expectSortedCookies(
        [
          { name: 'foo'   },
          { name: 'BAR'   },
          { name: 'baR'   },
          { name: ''      },
          { name: 'Foo'   },
          { name: '42'    },
          { name: 'baaar' },
          { name: 'bar'   },
          { name: 'fooo'  },
          { name: '!'     },
          { name: 'fOo'   },
        ],
        [
          { name: ''      },
          { name: '!'     },
          { name: '42'    },
          { name: 'BAR'   },
          { name: 'Foo'   },
          { name: 'baR'   },
          { name: 'baaar' },
          { name: 'bar'   },
          { name: 'fOo'   },
          { name: 'foo'   },
          { name: 'fooo'  },
        ],
      );
    });

    test('should sort cookies without domain by path and by name', async () => {
      return expectSortedCookies(
        [
          { path: '',           name: 'foo' },
          { path: '/test',      name: 'BAR' },
          { path: '',           name: '23'  },
          { path: '/test',      name: 'BAR' },
          { path: '/',          name: '42'  },
          { path: '',           name: 'bar' },
          { path: '/test',      name: 'BAR' },
          { path: '/path/',     name: 'foo' },
          { path: '',           name: '!'   },
          { path: '/',          name: 'BAR' },
          { path: '/test/path', name: 'foo' },
          { path: '/test',      name: 'BAR' },
          { path: '',           name: ''    },
          { path: '/test',      name: 'foo' },
          { path: '/path/',     name: '42'  },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'bar' },
          { path: '/path/',     name: 'bar' },
          { path: '/test',      name: 'BAR' },
          { path: '/',          name: 'foo' },
          { path: '/test/path', name: 'foo' },
          { path: '',           name: 'BAR' },
        ],
        [
          { path: '',           name: ''    },
          { path: '',           name: '!'   },
          { path: '',           name: '23'  },
          { path: '',           name: 'BAR' },
          { path: '',           name: 'bar' },
          { path: '',           name: 'foo' },
          { path: '/',          name: '42'  },
          { path: '/',          name: 'BAR' },
          { path: '/',          name: 'foo' },
          { path: '/path/',     name: '42'  },
          { path: '/path/',     name: 'bar' },
          { path: '/path/',     name: 'foo' },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'BAR' },
          { path: '/test',      name: 'bar' },
          { path: '/test',      name: 'foo' },
          { path: '/test/path', name: 'foo' },
          { path: '/test/path', name: 'foo' },
        ],
      );
    });

    test('should sort cookies by domain and path and name', async () => {
      return expectSortedCookies(
        [
          { domain: '',            path: '/test/', name: 'foo' },
          { domain: 'xss.example', path: '/test/', name: 'BAR' },
          { domain: '',            path: '/',      name: '23'  },
          { domain: 'xss.example', path: '/',      name: 'foo' },
          { domain: 'yss.example', path: '/path/', name: '42'  },
          { domain: '',            path: '/',      name: 'bar' },
          { domain: 'xss.example', path: '/test/', name: ''    },
          { domain: '',            path: '/path/', name: 'foo' },
          { domain: '',            path: '/',      name: '!'   },
          { domain: 'yss.example', path: '/path/', name: 'BAR' },
          { domain: 'xss',         path: '/',      name: 'foo' },
          { domain: 'xss.example', path: '/path/', name: 'BAR' },
          { domain: '',            path: '/',      name: ''    },
          { domain: 'xss.example', path: '/test/', name: 'foo' },
          { domain: '',            path: '/path/', name: '42'  },
          { domain: 'xss.example', path: '/',      name: 'BAR' },
          { domain: 'xss.example', path: '/path/', name: 'bar' },
          { domain: '',            path: '/path/', name: 'bar' },
          { domain: 'xss.example', path: '/test/', name: '42'  },
          { domain: 'yss.example', path: '/',      name: 'foo' },
          { domain: 'xss',         path: '/path/', name: 'bar' },
          { domain: '',            path: '/',      name: 'foo' },
        ],
        [
          { domain: '',            path: '/',      name: ''    },
          { domain: '',            path: '/',      name: '!'   },
          { domain: '',            path: '/',      name: '23'  },
          { domain: '',            path: '/',      name: 'bar' },
          { domain: '',            path: '/',      name: 'foo' },
          { domain: '',            path: '/path/', name: '42'  },
          { domain: '',            path: '/path/', name: 'bar' },
          { domain: '',            path: '/path/', name: 'foo' },
          { domain: '',            path: '/test/', name: 'foo' },
          { domain: 'xss',         path: '/',      name: 'foo' },
          { domain: 'xss',         path: '/path/', name: 'bar' },
          { domain: 'xss.example', path: '/',      name: 'BAR' },
          { domain: 'xss.example', path: '/',      name: 'foo' },
          { domain: 'xss.example', path: '/path/', name: 'BAR' },
          { domain: 'xss.example', path: '/path/', name: 'bar' },
          { domain: 'xss.example', path: '/test/', name: ''    },
          { domain: 'xss.example', path: '/test/', name: '42'  },
          { domain: 'xss.example', path: '/test/', name: 'BAR' },
          { domain: 'xss.example', path: '/test/', name: 'foo' },
          { domain: 'yss.example', path: '/',      name: 'foo' },
          { domain: 'yss.example', path: '/path/', name: '42'  },
          { domain: 'yss.example', path: '/path/', name: 'BAR' },
        ],
      );
    });

    async function expectSortedCookies(testCookies: CookieId[], expectedSortedCookies: CookieId[]): Promise<CookieId[]> {
      const sortedCookies = await sortCookies(testCookies as Cookie[]);
      expect(sortedCookies).toEqual(expectedSortedCookies as Cookie[]);
      return sortedCookies;
    }
  });

  describe('getCookieDomainsHierarchy() function', () => {
    test('should pass through simple host names', async () => {
      await expectCookieDomainsHierarchy('localhost', ['localhost']);
      await expectCookieDomainsHierarchy('container-js-dev', ['container-js-dev']);
      await expectCookieDomainsHierarchy('xss', ['xss']);
      await expectCookieDomainsHierarchy('local.', ['local.']);
    });

    test('should pass through IPv4 addresses', async () => {
      await expectCookieDomainsHierarchy('127.0.0.1', ['127.0.0.1']);
      await expectCookieDomainsHierarchy('192.168.42.23', ['192.168.42.23']);
      await expectCookieDomainsHierarchy('0.0.0.0', ['0.0.0.0']);
      await expectCookieDomainsHierarchy('1.1.1.1.', ['1.1.1.1.']);
    });

    test('should pass through IPv6 addresses', async () => {
      await expectCookieDomainsHierarchy('[::1]', ['[::1]']);
      await expectCookieDomainsHierarchy('[::]', ['[::]']);
      await expectCookieDomainsHierarchy('[FF:AA::23::42]', ['[FF:AA::23::42]']);
      await expectCookieDomainsHierarchy('[23:42::ab:cd:0e:f0]', ['[23:42::ab:cd:0e:f0]']);
    });

    test('should pass through IP addresses-like invalid DNS names', async () => {
      await expectCookieDomainsHierarchy('foo.bar.23', ['foo.bar.23']);
      await expectCookieDomainsHierarchy('last.domain.label.must.not.be.numeric.42', ['last.domain.label.must.not.be.numeric.42']);
      await expectCookieDomainsHierarchy('sub.42.', ['sub.42.']);
    });

    test('should return the domain itself and all parent domains except for the top-level domain', async () => {
      await expectCookieDomainsHierarchy(
        'xss.dev.meeque.local',
        [
          'xss.dev.meeque.local',
          'dev.meeque.local',
          'meeque.local',
        ],
      );
      await expectCookieDomainsHierarchy(
        'yss.meeque.de',
        [
          'yss.meeque.de',
          'meeque.de',
        ],
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
          'co.uk',
        ],
      );
    });

    async function expectCookieDomainsHierarchy(testDomain: string, expectedHierarchy: string[]) {
      // test both the getCookieDomainsHierarchy function in the cookies mock page and the local sync copy
      expect(await getCookieDomainsHierarchy(testDomain)).toEqual(expectedHierarchy);
      expect(getCookieDomainsHierarchySyncCopy(testDomain)).toEqual(expectedHierarchy);
    }
  });

  describe('UI', () => {
    beforeEach(clearCookies);
    afterEach(clearCookies);

    describe('should manage cookies', () => {
      for (const testDomain of getCookieDomainsHierarchySyncCopy(xssDemoAppHostname)) {
        for (const testPath of [undefined, '/', '/assets/', '/assets/mocks/']) {
          test(
            'with domain "' + testDomain + '" and path "' + testPath + '"',
            async () => {
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
                  value: 'value of cookie with name "foo"',
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
                  value: 'value of cookie with name "bar"',
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
                  sameSite: SameSite.lax,
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
                  name: 'foo',
                };
                removeCookie(testCookies, testCookie);
                await deleteCookiesTableCookie(testCookie);
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
                  expires: Date.now() + (60 * 1000),
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
                  expires: Date.now() + (60 * 1000),
                };
                await addCookie(testCookies, testCookie);
                await editCookiesTableCookie(testCookie);
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
                  expires: null,
                };
                await editCookiesTableCookie(testCookie, false);
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
                  expires: Date.now() + (10 * 60 * 1000),
                };
                await addCookie(testCookies, testCookie);
                await editCookiesTableCookie(testCookie);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              {
                // delete "xxx"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'xxx',
                };
                removeCookie(testCookies, testCookie);
                await deleteCookiesTableCookie(testCookie);
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
                  expires: null,
                };
                await addCookie(testCookies, testCookie);
                await editCookiesTableCookie(testCookie);
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
                await editCookiesTableCookie(testCookie, true);
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
                  expires: Date.now() + (60 * 1000),
                };
                await editCookiesTableCookie(testCookie, false);
                await expectCookies(testCookies);
                await expectCookiesTable(testCookies);
              }

              // wait a bit for async failures
              await timeout(200);
            },
            60000,
          );
        }
      }
    });

    describe('should reflect external cookie changes', () => {
      for (const testDomain of getCookieDomainsHierarchySyncCopy(xssDemoAppHostname)) {
        for (const testPath of [undefined, '/', '/assets/', '/assets/mocks/']) {
          test(
            'with domain "' + testDomain + '" and path "' + testPath + '"',
            async () => {
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
                  value: 'cookie with name "FOO"',
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await waitForCookieRow(testCookie);
                await expectCookiesTable(testCookies);
              }

              {
                // add "BAR"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'BAR',
                  value: 'cookie with name "BAR"',
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await waitForCookieRow(testCookie);
                await expectCookiesTable(testCookies);
              }

              {
                // delete "FOO"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'FOO',
                };
                removeCookie(testCookies, testCookie);
                await cookieStore.delete(testCookie);
                await waitForCookieRow(testCookie, undefined, false);
                await waitForCookieRow(testCookies[0]);
                await expectCookiesTable(testCookies);
              }

              {
                // add ""
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: '',
                  value: 'cookie with empty name',
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await waitForCookieRow(testCookie);
                await expectCookiesTable(testCookies);
              }

              {
                // change "BAR"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'BAR',
                  value: 'adjusted cookie with name "BAR"',
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await waitForCookieRow(testCookie, testCookie.value);
                await expectCookiesTable(testCookies);
              }

              {
                // re-add "FOO"
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: 'FOO',
                  value: 'another cookie with key "FOO"',
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await waitForCookieRow(testCookie);
                await expectCookiesTable(testCookies);
              }

              {
                // add item with funky key
                const testCookie = {
                  domain: testDomain,
                  path: testPath,
                  name: encodeURIComponent('<img src="." onerror="parent.fail(\'a storage item has triggered xss!\')">'),
                  value: 'the name of this cookie contains xss payload (when url-decoded)',
                };
                await addCookie(testCookies, testCookie);
                await cookieStore.set(testCookie);
                await waitForCookieRow(testCookie);
                await expectCookiesTable(testCookies);

                // delete item with funky key
                removeCookie(testCookies, testCookie);
                await cookieStore.delete(testCookie);
                await waitForCookieRow(testCookie, undefined, false);
                await waitForCookieRow(testCookies[0]);
                await expectCookiesTable(testCookies);
              }

              // wait a bit for async failures
              await timeout(500);
            },
            60000,
          );
        }
      }
    });
  });

  function findCookiesTable(): Promise<WebElement> {
    return findAndExpectOne(mockPageBody, 'main article.cookies table.cookies');
  }

  async function findCookieRow(cookie: CookieId, value?: string): Promise<WebElement> {
    const cookiesTable = await findCookiesTable();
    const cookieRows = await cookiesTable.findElements(By.css('tr.cookie'));
    for (const cookieRow of cookieRows) {
      if (typeof cookie.domain === 'string') {
        const cookieDomainField = await findAndExpectOne(cookieRow, 'td.domain input[type=text]');
        const cookieDomainFieldValue = await getValue(cookieDomainField);
        if (cookie.domain === xssDemoAppHostname) {
          if (
            cookieDomainFieldValue != cookie.domain
            &&
            cookieDomainFieldValue != ''
          ) {
            continue;
          }
        }
        else {
          if (cookieDomainFieldValue != cookie.domain) {
            continue;
          }
        }
      }
      if (typeof cookie.path === 'string') {
        const cookiePathField = await findAndExpectOne(cookieRow, 'td.path input[type=text]');
        const cookiePathFieldValue = await getValue(cookiePathField);
        if (cookiePathFieldValue != cookie.path) {
          continue;
        }
      }
      if (typeof cookie.name === 'string') {
        const cookieNameField = await findAndExpectOne(cookieRow, 'td.name input[type=text]');
        const cookieNameFieldValue = await getValue(cookieNameField);
        if (cookieNameFieldValue != cookie.name) {
          continue;
        }
      }
      if (typeof value === 'string') {
        const cookieValueField = await findAndExpectOne(cookieRow, 'td.value input[type=text]');
        const cookieValueFieldValue = await getValue(cookieValueField);
        if (cookieValueFieldValue != value) {
          continue;
        }
      }
      return cookieRow;
    }
    return null;
  }

  async function waitForCookieRow(cookie: CookieId, value?: string, present = true): Promise<WebElement> {
    let cookieRow: WebElement;
    await driver.wait(
      until.elementLocated(
        async () => {
          cookieRow = await findCookieRow(cookie, value);
          if (present && cookieRow != null) {
            return mockPageBody;
          }
          if (!present && cookieRow == null) {
            return mockPageBody;
          }
          return null;
        }
      ),
      2500,
    );
    return cookieRow;
  }

  async function fillNewCookieForm(testCookie: Cookie, save = true, expectError = false): Promise<void> {
    const cookiesTable = await findCookiesTable();
    const initialCookiesTableRows = await cookiesTable.findElements(By.css('tr'));

    const newCookieButton = await findAndExpectOne(cookiesTable, 'tr.actions button[name=new]');
    await newCookieButton.click();

    await findAndExpectCount(cookiesTable, 'tr', initialCookiesTableRows.length + 1);
    await expect(getClasses(cookiesTable)).resolves.not.toContain('empty');
    await expect(newCookieButton.isEnabled()).resolves.toBe(false);
    const errorMessageCell = await findAndExpectOne(cookiesTable, 'tr.actions td.message.error');
    const errorMessageCellText = await errorMessageCell.getText();
    expect(errorMessageCellText.trim()).toBe('');

    const cookieRow = await findAndExpectOne(cookiesTable, 'tr.cookie.new');
    const domainField = await findAndExpectOne(cookieRow, 'td.domain input[type=text]');
    const pathField = await findAndExpectOne(cookieRow, 'td.path input[type=text]');
    const nameField = await findAndExpectOne(cookieRow, 'td.name input[type=text]');
    const valueField = await findAndExpectOne(cookieRow, 'td.value input[type=text]');
    const secureCheckbox = await findAndExpectOne(cookieRow, 'td.secure input[type=checkbox]');
    const httpOnlyCheckbox = await findAndExpectOne(cookieRow, 'td.httpOnly input[type=checkbox]');
    const sameSiteSelect = await findAndExpectOne(cookieRow, 'td.sameSite select');
    const expiresField = await findAndExpectOne(cookieRow, 'td.expires input[type=text]');
    const editButton = await findAndExpectOne(cookieRow, 'td.actions button[name=edit]');
    const deleteButton = await findAndExpectOne(cookieRow, 'td.actions button[name=delete]');
    const saveButton = await findAndExpectOne(cookieRow, 'td.actions button[name=save]');
    const cancelButton = await findAndExpectOne(cookieRow, 'td.actions button[name=cancel]');

    await expect(getValue(domainField)).resolves.toBe('');
    await expect(getValue(pathField)).resolves.toBe('/');
    await expect(getValue(nameField)).resolves.toBe('');
    await expect(getValue(valueField)).resolves.toBe('');
    await expect(isChecked(secureCheckbox)).resolves.toBe(true);
    await expect(isChecked(httpOnlyCheckbox)).resolves.toBe(false);
    await expect(getValue(sameSiteSelect)).resolves.toBe(SameSite.strict);
    await expect(getValue(expiresField)).resolves.toBe('');
    await expect(editButton.isEnabled()).resolves.toBe(false);
    await expect(deleteButton.isEnabled()).resolves.toBe(false);
    await expect(saveButton.isEnabled()).resolves.toBe(true);
    await expect(cancelButton.isEnabled()).resolves.toBe(true);

    if (testCookie.domain !== undefined) await setValue(domainField, testCookie.domain);
    if (testCookie.path !== undefined) await setValue(pathField, testCookie.path);
    if (testCookie.name !== undefined) await setValue(nameField, testCookie.name);
    if (testCookie.value !== undefined) await setValue(valueField, testCookie.value);
    if (testCookie.sameSite !== undefined) await selectOption(sameSiteSelect, testCookie.sameSite);
    if (testCookie.expires !== undefined) {
      await setValue(expiresField, (typeof testCookie.expires === 'number') ? testCookie.expires.toString() : '');
    }

    await (save ? saveButton : cancelButton).click();
    await timeout(100);
    await findAndExpectCount(cookiesTable, 'tr', initialCookiesTableRows.length + (save && !expectError ? 1 : 0));
  }

  async function editCookiesTableCookie(testCookie: Cookie, save = true): Promise<void> {
    const cookiesTable = await findCookiesTable();
    const initialCookiesTableRows = await cookiesTable.findElements(By.css('tr'));
    const cookieRow = await findCookieRow(testCookie);
    const editButton = await findAndExpectOne(cookieRow, 'td.actions button[name=edit]');

    await editButton.click();
    await timeout(100);

    await findAndExpectCount(cookiesTable, 'tr', initialCookiesTableRows.length);
    await expect(getClasses(cookiesTable)).resolves.not.toContain('empty');
    const newCookieButton = await findAndExpectOne(cookiesTable, 'tr.actions button[name=new]');
    await expect(newCookieButton.isEnabled()).resolves.toBe(false);
    const errorMessageCell = await findAndExpectOne(cookiesTable, 'tr.actions td.message.error');
    const errorMessageCellText = await errorMessageCell.getText();
    expect(errorMessageCellText.trim()).toBe('');

    const domainField = await findAndExpectOne(cookieRow, 'td.domain input[type=text]');
    const pathField = await findAndExpectOne(cookieRow, 'td.path input[type=text]');
    const nameField = await findAndExpectOne(cookieRow, 'td.name input[type=text]');
    const valueField = await findAndExpectOne(cookieRow, 'td.value input[type=text]');
    const sameSiteSelect = await findAndExpectOne(cookieRow, 'td.sameSite select');
    const expiresField = await findAndExpectOne(cookieRow, 'td.expires input[type=text]');
    const deleteButton = await findAndExpectOne(cookieRow, 'td.actions button[name=delete]');
    const saveButton = await findAndExpectOne(cookieRow, 'td.actions button[name=save]');
    const cancelButton = await findAndExpectOne(cookieRow, 'td.actions button[name=cancel]');

    if (testCookie.domain === xssDemoAppHostname) {
      await expect(getValue(domainField)).resolves.toEqual(expect.anyOf([testCookie.domain, '']));
    }
    else {
      await expect(getValue(domainField)).resolves.toBe(testCookie.domain ?? '');
    }
    await expect(getValue(pathField)).resolves.toBe(testCookie.path || '/');
    await expect(getValue(nameField)).resolves.toBe(testCookie.name || '');
    await expect(editButton.isEnabled()).resolves.toBe(false);
    await expect(deleteButton.isEnabled()).resolves.toBe(false);
    await expect(saveButton.isEnabled()).resolves.toBe(true);
    await expect(cancelButton.isEnabled()).resolves.toBe(true);

    if (testCookie.value !== undefined) await setValue(valueField, testCookie.value);
    if (testCookie.sameSite !== undefined) await selectOption(sameSiteSelect, testCookie.sameSite);
    if (testCookie.expires !== undefined) {
      await setValue(expiresField, (typeof testCookie.expires === 'number') ? testCookie.expires.toString() : '');
    }

    await (save ? saveButton : cancelButton).click();
    await timeout(100);
    await findAndExpectCount(await findCookiesTable(), 'tr', initialCookiesTableRows.length);
  }

  async function deleteCookiesTableCookie(cookie: CookieId): Promise<void> {
    const cookiesTable = await findCookiesTable();
    const initialCookiesTableRows = await cookiesTable.findElements(By.css('tr'));
    const cookieRow = await findCookieRow(cookie);
    const deleteButton = await findAndExpectOne(cookieRow, 'td.actions button[name=delete]');

    await deleteButton.click();
    await timeout(100);
    await findAndExpectCount(await findCookiesTable(), 'tr', initialCookiesTableRows.length - 1);
  }

  async function expectCookiesTable(cookies: Cookie[], expectError = false) {
    const cookiesTable = await findCookiesTable();

    await sortCookies(cookies);
    const cookiesCount = cookies.length;
    const rowCount = cookiesCount + 3;

    if (cookiesCount === 0) {
      await expect(getClasses(cookiesTable)).resolves.toContain('empty');
    }
    else {
      await expect(getClasses(cookiesTable)).resolves.not.toContain('empty');
    }
    const newCookieButton = await findAndExpectOne(cookiesTable, 'tr.actions button[name=new]');
    await expect(newCookieButton.isEnabled()).resolves.toBe(true);
    const errorMessageCell = await findAndExpectOne(cookiesTable, 'tr.actions td.message.error');
    await expect(errorMessageCell.getText()).resolves.toEqual(expectError ? expect.stringContaining('Error') : '');

    const cookieRows = await findAndExpectCount(cookiesTable, 'tr', rowCount);
    await expect(getClasses(cookieRows[0])).resolves.toEqual(['head']);
    await expect(getClasses(cookieRows[1])).resolves.toEqual(['message', 'info', 'empty']);
    await expect(getClasses(cookieRows[rowCount - 1])).resolves.toEqual(['actions']);

    let index = 2;
    for (const cookie of cookies) {
      const cookieRow = cookieRows[index++];
      await expect(getClasses(cookieRow)).resolves.toEqual(['cookie']);
      await expectCookieRowValues(cookieRow, cookie);
    }
  }

  async function expectCookieRowValues(cookieRow: WebElement, cookie: Cookie): Promise<void> {
    const domainField = await findAndExpectOne(cookieRow, 'td.domain input[type=text]');
    const pathField = await findAndExpectOne(cookieRow, 'td.path input[type=text]');
    const nameField = await findAndExpectOne(cookieRow, 'td.name input[type=text]');
    const valueField = await findAndExpectOne(cookieRow, 'td.value input[type=text]');
    const secureCheckbox = await findAndExpectOne(cookieRow, 'td.secure input[type=checkbox]');
    const httpOnlyCheckbox = await findAndExpectOne(cookieRow, 'td.httpOnly input[type=checkbox]');
    const sameSiteSelect = await findAndExpectOne(cookieRow, 'td.sameSite select');
    const expiresField = await findAndExpectOne(cookieRow, 'td.expires input[type=text]');
    const editButton = await findAndExpectOne(cookieRow, 'td.actions button[name=edit]');
    const deleteButton = await findAndExpectOne(cookieRow, 'td.actions button[name=delete]');
    const saveButton = await findAndExpectOne(cookieRow, 'td.actions button[name=save]');
    const cancelButton = await findAndExpectOne(cookieRow, 'td.actions button[name=cancel]');

    if (cookie.domain === xssDemoAppHostname) {
      await expect(getValue(domainField)).resolves.toEqual(expect.anyOf([cookie.domain, '']));
    }
    else {
      await expect(getValue(domainField)).resolves.toBe(cookie.domain ?? '');
    }
    await expect(getValue(pathField)).resolves.toBe(cookie.path || '/');
    await expect(getValue(nameField)).resolves.toBe(cookie.name || '');
    await expect(getValue(valueField)).resolves.toBe(cookie.value || '');
    await expect(isChecked(secureCheckbox)).resolves.toBe(typeof cookie.secure === 'boolean' ? cookie.secure : true);
    await expect(isChecked(httpOnlyCheckbox)).resolves.toBe(false);
    await expect(getValue(sameSiteSelect)).resolves.toBe(typeof cookie.sameSite === 'string' ? cookie.sameSite : 'strict');
    await expect(getValue(expiresField)).resolves.toBe(cookie.expires != null ? cookie.expires.toString() : 'session');
    await expect(editButton.isEnabled()).resolves.toBe(true);
    await expect(deleteButton.isEnabled()).resolves.toBe(true);
    await expect(saveButton.isEnabled()).resolves.toBe(false);
    await expect(cancelButton.isEnabled()).resolves.toBe(false);
  }

  async function expectCookies(testCookies: Cookie[]) {
    const cookies = await cookieStore.getAll();
    expect(cookies.length).toBe(testCookies.length);
    await sortCookies(cookies);

    let i = 0;
    for (const cookie of cookies) {
      expect(cookie).toMatchCookie(testCookies[i++]);
    }
  }

  async function sortCookies(cookies: Cookie[]): Promise<Cookie[]> {
    const sortedCookies = await driver.executeScript(
      'return sortCookies(' + JSON.stringify(cookies) + ');',
    ) as Cookie[];
    cookies.splice(0, cookies.length, ...sortedCookies);
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
    }
    else {
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

  async function clearCookies(): Promise<void> {
    const cookieDeletePromises = [];
    for (const cookie of await cookieStore.getAll()) {
      cookieDeletePromises.push(cookieStore.delete(cookie));
    }
    await Promise.all(cookieDeletePromises);
  }

  function getCookieDomainsHierarchy(domain: string): Promise<string[]> {
    return driver.executeScript(
      'return getCookieDomainsHierarchy(' + JSON.stringify(domain) + ');',
    );
  }

  // this is a copy of getCookieDomainsHierarchy()
  // this copy is necessary, because the async original cannot be used during test generation
  // this test suite has tests that assert that both flawors work in an equal manner
  function getCookieDomainsHierarchySyncCopy(domain: string): string[] {
    const domainLabels = domain.split('.').filter(label => label !== '');

    if (domainLabels.length === 1) {
      return [domain];
    }

    if (/^[0-9]+$/.test(domainLabels.at(-1))) {
      return [domain];
    }

    const domains = [] as string[];
    for (let i = 0; i < domainLabels.length; i++) {
      domains.push(domainLabels.slice(i, domainLabels.length).join('.'));
    }
    domains.pop();
    return domains;
  }
});
