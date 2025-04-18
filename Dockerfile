### this tag refers to nginx 1.*
FROM nginx@sha256:5ed8fcc66f4ed123c1b2560ed708dc148755b6e4cbd8b943fab094f2c6bfa91e

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
