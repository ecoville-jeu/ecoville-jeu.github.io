FROM nginx:alpine

# Créer les répertoires nécessaires
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /var/cache/nginx

# Copie les fichiers nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copie les fichiers du jeu
COPY . /usr/share/nginx/html/
COPY ./js /usr/share/nginx/html/js/
COPY ./css /usr/share/nginx/html/css/
COPY ./models /usr/share/nginx/html/models/
COPY ./textures /usr/share/nginx/html/textures/
COPY ./index.html /usr/share/nginx/html/


# Mets en place les permissions nécessaire pour accéder les fichiers
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html


USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
