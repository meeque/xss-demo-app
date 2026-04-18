#!/bin/sh

/docker-entrypoint.d/100-xss-demo-app.sh

exec nginx -c /etc/nginx/nginx.conf
