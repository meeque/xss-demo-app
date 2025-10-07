# XSS Demo App

The XSS Demo App is an interactive web application that allows testing of DOM-based XSS attacks. It is a pure client-side web application, thus it does not allow testing of server-side XSS attacks.
Luckily, most XSS vulnerabilities that can be exploited on the server-side have analogous vulnerabilities in the live HTML DOM.

THe XSS Demo App is written on top of the Angular framework.
While it does demopnstrate XSS vulnerabilities that are specific to Angular, it also features XSS vulnerabilities that are based on HTML, the DOM, and jQuery.



## Usage Instructions

For basic usage of the XSS Demo App, see the intro text in its web UI.



### Try It Live

A live version of this XSS Demo App is hosted here:

* [xss.meeque.de](https://xss.meeque.de/)
* [yss.meeque.de](https://yss.meeque.de/)

These two domains host the same instance of the XSS Demo App, which can be useful for testing XSS impact accross different [origins](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).

The live-hosted XSS Demo App is provided on a **best-effort basis**, so occasional outages are expected.
Basic monitoring is in place though and problems will get fixed eventually.



### Build It

You will need `node.js`, `npm,` `ng` (the Angular CLI tool) to build the XSS Demo App.
Run the following commands in this directory:

```
npm install
ng build
```

After the build, the XSS Demo App will be available in the `dist/` directory.

Note that the XSS Demo App contains an npm `postinstall` script ([tls/cert.sh](tls/cert.sh)) that will create self-signed certificates for testing purposes.
This requires an environment that is capable to execute unix shell scripts, in particular `bash`.
It also requires the `openssl` binary to be available on the `PATH`.



### Run It

The XSS Demo App can be deployed on any web-server that can host static files.
Just run the build and copy the contents of the `dist/` directory into your servers web root directory.



### Angular Serve with TLS

In a local development setup, it is more convenient to use the `ng` tool to run the XSS Demo App.
Simply run this Angular command:

```
ng serve
```

This brings up a node.js web server that makea the XSS Demo App available at:

[https://localhost:4200/](https://localhost:4200/)

Alternatively, you can point your browser to any a different host name or IP-address that refers to your host.

By default, `ng serve` binds to all host addresses.
If you want to ristrict access to a pecific network, you can use the `--host` option to bind to a specific host address.
E.g., to restrict access to localhost, run this Angular command:

```
ng serve --host 127.0.0.1
```

The above `ng serve` commands depend on the TLS certificate that the `postinstall` script generates, see the *Build It* section.
These certificate is self signed, so your browser will warn you that it should not be trusted.
You can add a temporary exception to trust this certificate for this host.
This is secure in most scenarios, in particular for local access.
For non-local access, you can check certificate fingerprints, see outputs of `npm install`.
See the *Security Considerations* section below for details.



### Angular Serve without TLS

The XSS Demo App is best served over TLS, because some of its functionality does not work well without TLS.
In particular, the XSS Demo App makes use of the [CookieStore](https://developer.mozilla.org/en-US/docs/Web/API/CookieStore) API, which is only available to documents that are served securely.

That said, most other XSS Demo App functionality works just fine without TLS.
And, in a local access scenario this is reasonably secure.
To run the XSS Demo App without TLS, use this Angular command:

```
ng serve --ssl=false
```

Be aware that some automated integration tests will fail, when you run them against an XSS Demo App that is served without TLS.




### Test It

The XSS Demo App project comes with both unit tests and integration tests, which can be run separately.
Neither of these are available through the `ng` command, you'll have to run them through the `npm` command instead.



#### Unit Tests

These are simple unit tests that can be run in nodejs.
This includes unit tests for Angular UI components that run in Angular's `TestBed` and do not require a web browser.

The unit tests do not require any additional configuration.
You can run them with this `npm` command:

```
npm test
```



#### Integration Tests

These test the XSS Demo App in a real web browser (currenly only Chrome or Chromium are supported).
The integration tests use Selenium Web-Driver to interact with the browser and the XSS Demo App.
You can run them with this `npm` command:

```
npm run test:integration
```

Note that this command does not build, start, or stop the XSS Demo App itself.
Before running the integration tests, you'll have to build and start the XSS Demo App yourself (e.g. in the background or in a different terminal).

Running the integration tests may work as-is in common development setups, but may require additional configuraiton in other setups.
You can use environment variables to configure the integration tests.
These are the supported variables:

  | Variable Name                     | Default Value                 | Description                                                |
  |-----------------------------------|-------------------------------|------------------------------------------------------------|
  | `XSS_DEMO_APP_URL`                | `https://localhost:4200/`     | Base-URL of the XSS Demo App to test in the browser.       |
  | `XSS_DEMO_APP_TEST_CHROME_BINARY` | `/usr/bin/chromium`           | Name or path of the Chrome binary to use.                  |
  | `XSS_DEMO_APP_TEST_CHROME_ARGS`   | `--ignore-certificate-errors` | CLI arguments (seperated by whitespace) to pass to Chrome. |

The following Chrome CLI arguments may be useful in conjunction with `XSS_DEMO_APP_TEST_CHROME_ARGS`:

  | Argument                      | Recommended Usage                                                                                                                               |
  |-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
  | `--ignore-certificate-errors` | Use this, when running the XSS Demo App with a self-signed TLS certificate (which is the default when running it with `ng serve`).              |
  | `--headless`                  | Use this, when running the tests on a host that does not have a UI (e.g. when running in a CI/CD environment).                                  |
  | `--no-sandbox`                | Use this, when running the tests in a sandboxed environment that is incompatible with Chrome's own sandboxing (e.g. a Docker or lxc container). |

Here's an example that runs integration tests with some of the above configuration options:

```
XSS_DEMO_APP_URL='https://xss.dev.meeque.local:4200/' XSS_DEMO_APP_TEST_CHROME_BINARY='/usr/bin/chrome' XSS_DEMO_APP_TEST_CHROME_ARGS='--ignore-certificate-errors --headless --no-sandbox' npm run test:integration
```



#### Notes on "XSS Demo App" Integration Test Suite

The ["Xss Demo App" integration test suite](src/test/xss-demo.integration.spec.ts) tests key functionality of the XSS Demo App.
In particular, it tries numerous combinations of attack payloads and payload outputs and asserts that these DO or DO NOT trigger successfull XSS as expected.
These tests are data-driven and the test suite maintains a huge table of combinations that should trigger XSS.
All other combinationis are expected not to trigger XSS.

Some of these tests may create a new browser tab or window.
This might be prevented by the browser's built-in pop-up blocker, which will make some of these tests fail.
It is highly recommended to disable pop-up blocking for the domain that the XSS Demo App is running on.
(It appears that pop-up blocking does not interfere, when running the browser in headless mode.)



#### Notes on Mock Pages Test Suites

The Mock Pages that come with this XSS Demo App have their own integration test suites each.
These tests focus on the UI of the individual Mock Pages, not on their interactions with the XSS Demo App itself.
However the latter is covered by parts of the "Xss Demo App" integration test suite.

Notably, the integration test suite for the "Cookies Mock" tests how domain-specific cookies are handled.
These tests also involve cookies that are set for parent domains of the domain where the XSS Demo App is hosted.
E.g. when running on `xss.example.net`, the tests would test cookies on both `xss.example.net` and `example.net`.
There will be no test for top-level domains such as `net`, because the browser would block these.



### Containerize It

TODO



## Additional Info

### Security Considerations

The XSS Demo App has intentional XSS vulnerabilities that can be exploited.
By design, it will only allow to exploit XSS through payloads that are entered into its web UI interactively.
Thus users of the XSS Demo App can only self-attack.
There is no intended way to allow XSS reflected from the URL or stored persistently.

More precisely, the XSS Demo App is intended to allow XSS attacks **only** under the following circumstances:

* The XSS attack payload is entered into the payload input text field.
* A payload output is selected that is not marked as "recommended".
  See the "by quality" filters in the payload output "ComboBox" menu.
* The "auto update output" feature is on or the "update now" button is clicked.

If you can trigger an XSS without all of the above conditions being met, you have found an unintended vulnerability!
Congratulations!
Feel free to submit a pull-request to discuss and fix it!

As the name says, this XSS Demo App is just a demo and has **not undergone thorough security testing** itself.
In case of an unintended XSS vulnerability, attackers could execute JavaScript code in the context of the XSS Demo App, and its origin.
Please do not host the XSS Demo App on an origin (domain) that may be associated with confidential data of other applications.

The server-side implementation of the XSS Demo App is purely static.
It does not allow for any server side state changes, and does not process confidential data.
Thus it has few security implications on the server-side.
Apart from vulnerabiities of the underlying components (node.js, Angular, nginx,n ...) and infrastructure.



### Bugs

The UI of the XSS Demo App has the following known bugs:

* The entries of the "ComboBox" menus do not react to mouse clicks properly.
  Particularly, they sometimes ignore the first mouse click.
  Click again to work around this!
* Several layout flaws remain. E.g.:
  There's a huge empty area at the bottom of the page.
  Some menus and other widgets overflow the page, especially on small screens.
* "ComboBox" menus lack keyboard navigation.

Feel free to submit pull-requests to fix the above or any other flaws!
