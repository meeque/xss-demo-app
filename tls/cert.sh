#!/bin/bash
set -e -o pipefail

echo 'XSS Demo: Running certificate helper script...'
xss_demo_tls_dir="$( realpath "$(dirname "$0")" )"
cd "${xss_demo_tls_dir}"

echo 'XSS Demo: Setting up "tls/private" dir for private keys...'
mkdir -p private
chmod go-rwx private

if [[ -f 'xss-dev.csr.pem' && -f 'xss-dev.cert.pem' && -f 'private/xss-dev.key.pem'  ]]
then
    echo 'XSS Demo: Private key and certificate for development and testing purposes already exist.'
    echo 'XSS Demo: Skipping generation of new key pair and certificate.'
    echo 'XSS Demo: In order to regenerate, delete all "*.pem" files in the "'"${xss_demo_tls_dir}"'" dir and run this script again!'
else
    echo 'XSS Demo: Generating key pair and certificate for development and testing purposes...'
    openssl req -new -config 'xss-dev.cert.conf' -noenc -keyout 'private/xss-dev.key.pem' -out 'xss-dev.csr.pem'
    openssl x509 -req -days 90 -copy_extensions copyall -sha512 -in 'xss-dev.csr.pem' -signkey 'private/xss-dev.key.pem' -out 'xss-dev.cert.pem'
    echo 'XSS Demo: Successfully generated key pair and certificate for development and testing purposes.'
fi

echo 'XSS Demo: Certificate helper script done.'