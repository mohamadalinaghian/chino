FROM nginx:1.25-alpine
COPY conf.d /etc/nginx/conf.d/
COPY certbot/www /var/www/certbot
COPY certbot/conf /etc/letsencrypt

RUN rm -f /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
