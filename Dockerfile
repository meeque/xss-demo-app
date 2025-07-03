### this tag refers to nginx 1.*
FROM nginx@sha256:93230cd54060f497430c7a120e2347894846a81b6a5dd2110f7362c5423b4abc

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
