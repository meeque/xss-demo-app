### this tag refers to nginx 1.*
FROM nginx@sha256:6784fb0834aa7dbbe12e3d7471e69c290df3e6ba810dc38b34ae33d3c1c05f7d

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
