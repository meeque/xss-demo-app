### this tag refers to nginx 1.*
FROM nginx@sha256:56b388b0d79c738f4cf51bbaf184a14fab19337f4819ceb2cae7d94100262de8

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
