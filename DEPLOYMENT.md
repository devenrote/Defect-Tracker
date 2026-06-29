# Deployment Guide — Defect Tracker Pro

This guide covers deploying Defect Tracker Pro to production environments.

## Deployment Architecture

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────┴────────┐      ┌────────┴────────┐
     │  React Frontend │      │  Express API    │
     │  (Static Files) │      │  (Node.js)      │
     └─────────────────┘      └────────┬────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                     ┌────────┴────────┐  ┌───────┴───────┐
                     │ PostgreSQL      │  │  Cloudinary   │
                     │   Database      │  │  (Images)     │
                     └─────────────────┘  └───────────────┘
```

---

## Option 1: VPS Deployment (Ubuntu)

### 1. Server Preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx postgresql postgresql-contrib nodejs npm
```

Install Node.js 18+ via nvm if needed:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
```

### 2. PostgreSQL Setup

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE defect_tracker_pro;
CREATE USER defect_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE defect_tracker_pro TO defect_user;
ALTER USER defect_user WITH SUPERUSER;
\q
```

Import schema:

```bash
psql -U defect_user -d defect_tracker_pro -f database/schema.sql
```

### 3. Backend Deployment

```bash
cd /var/www/defect-tracker/backend
cp .env.example .env
```

Edit `.env` for production:

```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_USER=defect_user
DB_PASSWORD=strong_password_here
DB_NAME=defect_tracker_pro
DB_PORT=5432
DB_SSL=false
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://yourdomain.com
```

```bash
npm install --production
npm run init-db
npm run seed
```

Install PM2 for process management:

```bash
npm install -g pm2
pm2 start src/server.js --name defect-tracker-api
pm2 save
pm2 startup
```

### 4. Frontend Build

```bash
cd /var/www/defect-tracker/frontend
cp .env.example .env
```

Set production API URL:

```env
VITE_API_URL=https://yourdomain.com/api
```

```bash
npm install
npm run build
```

Copy build output:

```bash
sudo cp -r dist /var/www/defect-tracker/public
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/defect-tracker`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    root /var/www/defect-tracker/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 6M;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/defect-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option 2: Docker Deployment

### docker-compose.yml (example)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: rootpassword
      POSTGRES_DB: defect_tracker_pro
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      PORT: 5000
      NODE_ENV: production
      DB_HOST: postgres
      DB_USER: postgres
      DB_PASSWORD: rootpassword
      DB_NAME: defect_tracker_pro
      DB_PORT: 5432
      DB_SSL=false
      JWT_SECRET: your_jwt_secret
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      FRONTEND_URL: http://localhost
    depends_on:
      - postgres
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Option 3: Cloud Platform Deployment

### Backend (Railway / Render / Heroku)

1. Connect your Git repository
2. Set root directory to `backend`
3. Set start command: `node src/server.js`
4. Add all environment variables from `.env.example`
5. Provision a PostgreSQL database add-on or use external PostgreSQL

### Frontend (Vercel / Netlify)

1. Connect repository, set root to `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_URL` to your backend URL + `/api`

### Database (PlanetScale / AWS RDS)

1. Create MySQL instance
2. Run `database/schema.sql`
3. Run `backend/scripts/seed.js` for test data
4. Update backend `DB_*` environment variables

---

## Cloudinary Setup

1. Sign up at https://cloudinary.com
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Add to backend `.env`
4. Upload folder: `defect-tracker` (auto-created)

---

## Security Checklist

- [ ] Use strong `JWT_SECRET` (32+ random characters)
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Restrict MySQL to localhost or VPC
- [ ] Never commit `.env` files
- [ ] Set appropriate CORS `FRONTEND_URL`
- [ ] Keep dependencies updated
- [ ] Configure firewall (allow only 80, 443, SSH)

---

## Monitoring

```bash
# PM2 monitoring
pm2 status
pm2 logs defect-tracker-api
pm2 monit

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API 502 Bad Gateway | Check PM2: `pm2 status`, restart: `pm2 restart defect-tracker-api` |
| Database connection failed | Verify `.env` DB credentials, check MySQL is running |
| Screenshot upload fails | Verify Cloudinary credentials, check file size < 5MB |
| CORS errors | Set `FRONTEND_URL` to exact frontend domain |
| JWT expired | User needs to re-login; adjust `JWT_EXPIRES_IN` if needed |
| Frontend blank page | Check Nginx `try_files` config for SPA routing |
