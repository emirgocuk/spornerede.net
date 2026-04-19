# SporNerede.net — Nginx reverse proxy (Astro SSR @astrojs/node standalone)
#
# Bu dosya deploy.sh tarafindan __UPSTREAM_HOST__ / __UPSTREAM_PORT__ ile doldurulur.
# SSL satirlari (__SSL_LINES__) deploy sirasinda sunucudaki mevcut vhost'tan
# otomatik cekilebiliyorsa eklenir; yoksa sadece :80 blogu yazilir.

map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

__HTTP_SERVER_BLOCK__

__SSL_SERVER_BLOCK__
