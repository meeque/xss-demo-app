### this tag refers to nginx 1.*
FROM nginx@sha256:fb39280b7b9eba5727c884a3c7810002e69e8f961cc373b89c92f14961d903a0

### Copy nginx config ###
COPY nginx/nginx.conf /etc/nginx/
COPY nginx/mime.types /etc/nginx/

### Copy app distribution ###
COPY dist/xss-demo-app/browser /usr/share/nginx/html/

### Drop priviliges
RUN touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid && \
  chown -R nginx:nginx /var/cache/nginx
USER nginx

### Expose ports and define entry point ###
EXPOSE 8080
CMD ["nginx"]
