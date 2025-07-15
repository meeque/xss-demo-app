### this tag refers to nginx 1.*
FROM nginx@sha256:f5c017fb33c6db484545793ffb67db51cdd7daebee472104612f73a85063f889

### Copy nginx config ###
COPY   --chown=root:root --chmod=644   nginx/nginx.conf nginx/mime.types   /etc/nginx/

### Copy app distribution ###
COPY   --chown=nginx:nginx --chmod=640   dist/xss-demo-app/browser   /usr/share/nginx/html/
RUN   find /usr/share/nginx/html/ -type d | \
      xargs chmod ug+x

### Drop privileges
RUN   touch /var/run/nginx.pid && \
      chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx
USER nginx

### Expose ports and define entry point ###
EXPOSE 8080
CMD ["nginx"]
