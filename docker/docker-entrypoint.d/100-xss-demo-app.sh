#!/bin/sh

echo 'XSS Demo App: checking if TLS certificate and key are available...'

if [ -f '/etc/nginx/xss-demo-app/tls/xss-demo-app.cert.pem' ] && [ -f '/etc/nginx/xss-demo-app/tls/xss-demo-app.key.pem' ]
then
    echo 'XSS Demo App: configuring nginx to run in HTTPS mode...'
    ln -sf /etc/nginx/xss-demo-app/xss-demo-app.https.conf /etc/nginx/xss-demo-app/xss-demo-app.conf
else
    echo 'XSS Demo App: configuring nginx to run in plain HTTP mode...'
    ln -sf /etc/nginx/xss-demo-app/xss-demo-app.http.conf /etc/nginx/xss-demo-app/xss-demo-app.conf
fi

echo 'XSS Demo App: done.'
