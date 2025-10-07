### this tag refers to nginx 1.*
FROM nginx@sha256:8adbdcb969e2676478ee2c7ad333956f0c8e0e4c5a7463f4611d7a2e7a7ff5dc

### Copy entrypoint scripts ###
COPY   --chown=root:root --chmod=755   docker/docker-entrypoint.d/   /docker-entrypoint.d/

### Copy nginx config ###
COPY   --chown=root:root --chmod=644   docker/etc/nginx/   /etc/nginx/
RUN   ln -sf /etc/nginx/xss-demo-app/xss-demo-app.http.conf /etc/nginx/xss-demo-app/xss-demo-app.conf
RUN   find /etc/nginx/ -type d | \
      xargs chmod ugo+x

### Copy app distribution ###
COPY   --chown=nginx:nginx --chmod=640   dist/xss-demo-app/browser/   /usr/share/nginx/html/
RUN   find /usr/share/nginx/html/ -type d | \
      xargs chmod ug+x

### Drop privileges
RUN   touch /var/run/nginx.pid && \
      chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /etc/nginx/xss-demo-app
USER nginx

### Expose ports and define entry point ###
EXPOSE 8080
EXPOSE 8443
CMD ["nginx"]
