# XSS Demo App

The XSS Demo App is an interactive web application that allows testing of DOM-based XSS attacks. It is a pure client-side web application, thus it does not allow testing of server-side XSS attacks.
Luckily, most XSS vulnerabilities that can be exploited on the server-side have analogous vulnerabilities in the live HTML DOM.

THe XSS Demo App is written on top of the Angular framework.
While it does show certain XSS vulnerabilities that are specific to Angular, it also features XSS vulnerabilities that target pure HTML DOM facilities.



## Try It

A live version of this XSS Demo App is hosted here:

* [xss.meeque.de](https://xss.meeque.de/)
* [yss.meeque.de](https://yss.meeque.de/)

These two domains host the same instance of the XSS Demo App, which can be useful for testing XSS impact accross different [origins](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).

The live XSS Ddmo App is provided on a **best-effort basis**, so occasional outages are expected.
Basic monitoring is in place though and problems will get fixed eventually.



## Build It

You will need `node.js`, `npm,` `ng` (the Angular CLI tool) to build the XSS Demo App. Run the following commands in this directory:

    npm install
    ng build



## Run It

After the build, the XSS Demo App will be available in the `dist/` directory. It can be deployed on any web-server that can host static files.

However, in a local setup, it is more convenient to use the `ng` tool to run it. Simply run the following command:

    ng serve

This will bring up a node.js web server that will serve the XSS Demo App at:
http://localhost:4200/

By default, `ng serve` binds to host address 128.0.0.1, i.e. the local loopback interface. If you want to share access to the XSS Demo App, or access it accross local VMs, you will need to loosen this restriction. Use the `--host` aregument to bind to a different host address. The following will bind to all interfaces:

    ng serve --host 0.0.0.0

TODO Exlain dev certificates
TODO Explain implications of binding to all interfaces



## Test It

TODO Deactivate popup blockers for integration tests!



## Security Considerations

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



## Bugs

The UI of the XSS Demo App has the following known bugs:

* The entries of the "ComboBox" menus do not react to mouse clicks properly.
  Particularly, they sometimes ignore the first mouse click.
  Click again to work around this!
* Several layout flaws remain. E.g.:
  There's a huge empty area at the bottom of the page.
  Some menus and other widgets overflow the page, especially on small screens.
* "ComboBox" menus lack keyboard navigation.

Feel free to submit pull-requests to fix the above or any other flaws!
