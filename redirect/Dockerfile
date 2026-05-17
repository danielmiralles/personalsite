# syntax=docker/dockerfile:1.7

# Tiny container: just nginx returning 301 from any Host to the canonical site.
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
