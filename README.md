# XSS Demo App

The XSS Demo App is an interactive web app that allows testing of DOM-based XSS attacks. It is a pure client-side web application, thus it does not allow testing of server-side XSS attacks. Luckily, most XSS vulnerabilities that can be exploited on the server-side have analogous vulnerabilities in the live HTML DOM.

THe XSS Demo App is written on top of the Angular.io framework. While it does show certain XSS vulnerabilities that are specific to Angular.io, it also features XSS vulnerabilities that target pure HTML DOM facilities.


## Building

You will need `node.js`, `npm,` `ng` (the Angular CLI tool) to build the XSS Demo App. Run the following commands in this directory:

    npm install
    ng build


## Running

After the build, the XSS Demo App will be available in the `dist/` directory. It can be deployed on any web-server that can host static files.

However, in a local setup, it is more convenient to use the `ng` tool to run it. Simply run the following command:

    ng serve

This will bring up a node.js web server that will serve the XSS Demo App at:
http://localhost:4200/

By default, `ng serve` binds to host address 128.0.0.1, i.e. the local loopback interface. If you want to share access to the XSS Demo App, or access it accross local VMs, you will need to loosen this restriction. Use the `--host` aregument to bind to a different host address. The following will bind to all interfaces:

    ng serve --host 0.0.0.0


## Security Considerations

The XSS Demo App intentionally contains XSS vulnerabilities that can be exploited. As of now, XSS payloads can only be injeted through the web UI interactively. Thus users of the XSS Demo App can only self-attack. There is no intended way to allow XSS reflected from the URL or stored  persistently.

However, this is merely a demo and has not undergone thorough security testing itself. In case of an unintended XSS vulnerability, attackers could execute JavaScript code in the context of the XSS Demo App, and its origin. Please do not host the XSS Demo App on an origin (domain) that may be associated with confidential data of other applications. E.g. an origin that has session cookies or other security tokens in one of the browser's stores.

The server-side implementation of the XSS Demo App is purely static. It does not allow for any server side state changes, and does not contain confidential data. Thus it does not have any new security implications on the server-side.


## Bugs

The UI of this XSS Demo App has the following known bugs:

* The entries of the "ComboBox" menus do not react to mouse clicks properly.
  Particularly, they sometimes ignore the first mouse click. Click again to work around this!
* The counter in the XSS notification message is not fully accurate.
  Particularly, typing into the payload input field seems to trigger two auto update cycles of the payload out.
  Thus, any XSS that triggers on update will be counted twice.
* Several layout flaws remain. E.g.:
  There's a huge empty area at the bottom of the page.
  Some menus and other widgets overflow the page, especially on small screens.
* "ComboBox" menus lack keyboard navigation.

Feel free to submit pull-requests to fix the above or any other flaws!

In particular, this XSS Demo App is intended to allow XSS attacks, but only under the following circumstances:

* The XSS attack payload is entered into the payload input text field.
* A payload output is selected that is not marked as "recommended".
  See the "by quality" filters in the payload output "ComboBox" menu.
* The "auto update output" feature is toggled, or you click on "update now".

If you can trigger an XSS without all of the above conditions being met, congratulations, you have found a vulnerability bug!
