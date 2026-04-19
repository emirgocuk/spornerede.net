#!/bin/bash

# Run this on your Ubuntu server
# sudo bash setup_server.sh

DOMAIN="spornerede.net"
EMAIL="admin@spornerede.net" # Change to your real email for SSL alerts

echo "🖥️ Starting Server Setup..."

# 1. Update and Dependencies
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx rsync

# 2. Prepare Directory
mkdir -p /var/www/$DOMAIN/html
chown -R $USER:$USER /var/www/$DOMAIN/html
chmod -R 755 /var/www/

# 3. Nginx Configuration
cat <<EOF > /etc/nginx/sites-available/$DOMAIN
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/$DOMAIN/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Better caching for Astro assets
    location /_astro {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
EOF

# Enable Site
ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and Reload
nginx -t && systemctl restart nginx

echo "✅ Nginx is running and configured for $DOMAIN."

# 4. SSL (Certbot)
echo "🔒 Requesting SSL Certificate..."
# Certbot will modify nginx config automatically
# Note: This might fail if DNS is not pointed to this IP yet
# If using Cloudflare Proxy (Orange Cloud), Certbot can still work with the --nginx plugin
echo "Running: certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "🚀 Server setup complete!"
