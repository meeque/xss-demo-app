# XSS Demo App - TLS Configuration

This directory contains X.509 certificate files for XSS Demo App development.

These certtificates are meant for development purposes only!
If you want to host the XSS Demo App publicly, consider running it on nginx and configure TLS manually.



## Generating TLS Certificates

Only the OpenSSL X.509 certificate config file ([xss-dev.cert.conf](xss-dev.cert.conf)) is part of the XSS Demo App project.
All other files in this directory are transient and can easily be regenerated from the config file.

You may want to adjust the domain names in the config file.
Or, add appropriate entries in your `/etc/hosts` file.
This is only important, if you want to use the XSS Demo App for cross-origin testing.

The following describes two *alternatives* for **generating key-pairs and self-signed certs** from the configuration.
All CLI code samples are meant to be run *in the root directory of the XSS Demo App*!



### Using the TLS Playground

Download the separate [TLS Playground](https://github.com/meeque/tls-playground/) project and its prerequisites.
Then, run the following command:

    ../path/to/tls-playground/bin/tp cert selfsign tls/



### Using OpenSSL Manually

Install [OpenSSL](https://openssl.org/) and run the following commands:

    dd if=/dev/random bs=32 count=1 | base64 > tls/private/xss-dev.key.pass.txt

    openssl req -new -config 'tls/xss-dev.cert.conf' -passout 'file:tls/private/xss-dev.key.pass.txt' -keyout 'tls/private/xss-dev.key.pem' -out 'tls/xss-dev.csr.pem'

    openssl x509 -req -days 90 -copy_extensions copyall -sha512 -in 'tls/xss-dev.csr.pem' -signkey 'tls/private/xss-dev.key.pem' -passin 'file:tls/private/xss-dev.key.pass.txt' -out 'tls/xss-dev.cert.pem'
