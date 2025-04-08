### this tag refers to nginx 1.*
FROM nginx@sha256:09369da6b10306312cd908661320086bf87fbae1b6b0c49a1f50ba531fef2eab

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
