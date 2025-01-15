### this tag refers to nginx 1.*
FROM nginx@sha256:0a399eb16751829e1af26fea27b20c3ec28d7ab1fb72182879dcae1cca21206a

### Copy nginx config ###
COPY nginx/nginx.conf /etc/nginx/
COPY nginx/mime.types /etc/nginx/

### Copy app distribution ###
COPY dist/xss-app /usr/share/nginx/html/

### Drop priviliges
RUN touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid && \
  chown -R nginx:nginx /var/cache/nginx
USER nginx

### Expose ports and define entry point ###
EXPOSE 8080
CMD ["nginx"]
