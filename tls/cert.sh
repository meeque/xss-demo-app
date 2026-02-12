#!/bin/bash
set -e -o pipefail

echo 'XSS Demo App: Running certificate helper script...'
xss_demo_tls_dir="$( realpath "$(dirname "$0")" )"
cd "${xss_demo_tls_dir}"

if [[ -f 'xss-demo-app.csr.pem' && -f 'xss-demo-app.cert.pem' && -f 'xss-demo-app.key.pem'  ]]
then
    echo 'XSS Demo App: Private key and certificate for development and testing purposes already exist.'
    echo 'XSS Demo App: Skipping generation of new key pair and certificate.'
    echo 'XSS Demo App: In order to regenerate, delete all "*.pem" files in the "'"${xss_demo_tls_dir}"'" dir and run this script again!'
else
    echo 'XSS Demo App: Generating key pair and certificate for development and testing purposes...'
    openssl req -new -config 'xss-demo-app.cert.conf' -noenc -keyout 'xss-demo-app.key.pem' -out 'xss-demo-app.csr.pem'
    openssl x509 -req -days 90 -copy_extensions copyall -sha512 -in 'xss-demo-app.csr.pem' -signkey 'xss-demo-app.key.pem' -out 'xss-demo-app.cert.pem'
    echo 'XSS Demo App: Successfully generated key pair and certificate for development and testing purposes.'
fi

echo 'XSS Demo App: Certificate fingerprints:'
echo -n 'XSS Demo App: '
openssl x509 -in xss-demo-app.cert.pem -noout -fingerprint -sha1
echo -n 'XSS Demo App: '
openssl x509 -in xss-demo-app.cert.pem -noout -fingerprint -sha256

echo 'XSS Demo App: Certificate helper script done.'
