# 🐧 Linux Deployment Guide - Inventory Management System

## 📋 Prerequisites

### System Requirements
- **OS:** Ubuntu 18.04+ / CentOS 7+ / Amazon Linux 2
- **RAM:** Minimum 1GB (2GB+ recommended)
- **Storage:** Minimum 10GB free space
- **Network:** Internet connection for package downloads

### Required Software
- Node.js 16+ (will be installed automatically)
- MongoDB 4.4+ (will be installed automatically)
- PM2 Process Manager (will be installed automatically)
- Nginx (optional, for reverse proxy)

## 🚀 Quick Deployment

### Option 1: Automated Deployment Script
```bash
# 1. Upload your project files to the server
scp -r /path/to/your/project user@your-server:/home/user/

# 2. SSH into your server
ssh user@your-server-ip

# 3. Navigate to project directory
cd /home/user/your-project-folder

# 4. Make deploy script executable and run
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 2: Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 3: Install MongoDB
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### Step 4: Install PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Set up PM2 to start on system boot
pm2 startup
# Copy and run the command that PM2 outputs

# Verify PM2 installation
pm2 --version
```

#### Step 5: Set Up Application
```bash
# Create application directories
sudo mkdir -p /var/www/inventory-app
sudo mkdir -p /var/log/inventory-app

# Set proper permissions
sudo chown -R $USER:$USER /var/www/inventory-app
sudo chown -R $USER:$USER /var/log/inventory-app

# Copy your application files
cp -r /path/to/your/project/* /var/www/inventory-app/

# Navigate to application directory
cd /var/www/inventory-app

# Install dependencies
npm install --production

# Copy production environment file
cp .env.production .env

# Edit environment file with your production settings
nano .env
```

#### Step 6: Configure Environment Variables
Edit your `.env` file:
```bash
# Essential production settings
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/inventorydb_prod

# IMPORTANT: Change these secrets!
SESSION_SECRET=your-super-secret-production-key-here
JWT_SECRET=your-jwt-production-secret-here

# Update with your actual domain
CORS_ORIGIN=https://yourdomain.com
```

#### Step 7: Seed Database (Optional)
```bash
# Seed with sample data
node scripts/seedData.js
```

#### Step 8: Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
```

## 🔧 Nginx Reverse Proxy Setup (Recommended)

### Install Nginx
```bash
sudo apt install -y nginx
```

### Configure Nginx
```bash
# Create nginx configuration file
sudo nano /etc/nginx/sites-available/inventory-management-system
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Serve static files directly
    location /uploads/ {
        alias /var/www/inventory-app/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/inventory-app/public;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Enable Nginx Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/inventory-management-system /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL Certificate Setup (Production)

### Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔥 Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000  # For direct access if needed

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

## 📊 Monitoring and Maintenance

### PM2 Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs inventory-management-system

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart inventory-management-system

# Stop application
pm2 stop inventory-management-system

# Reload application (0-downtime)
pm2 reload inventory-management-system
```

### MongoDB Commands
```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Connect to MongoDB shell
mongo

# Backup database
mongodump --db inventorydb_prod --out /backup/mongodb/

# Restore database
mongorestore --db inventorydb_prod /backup/mongodb/inventorydb_prod/
```

### System Health Checks
```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check network connections
netstat -tulpn | grep :3000

# Check system load
uptime
```

## 🛠️ Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs inventory-management-system

# Check if port is in use
sudo netstat -tulpn | grep :3000

# Restart application
pm2 restart inventory-management-system
```

#### Database Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if stopped
sudo systemctl start mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### Nginx Issues
```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/inventory-app
chmod -R 755 /var/www/inventory-app

# Fix log permissions
sudo chown -R $USER:$USER /var/log/inventory-app
```

### Performance Optimization

#### Enable Gzip Compression (Nginx)
Add to your nginx configuration:
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

#### MongoDB Optimization
```bash
# Enable MongoDB authentication (recommended for production)
sudo nano /etc/mongod.conf

# Add security section:
# security:
#   authorization: enabled
```

## 🔄 Updates and Deployment

### Updating the Application
```bash
# Navigate to app directory
cd /var/www/inventory-app

# Pull latest changes (if using git)
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 reload inventory-management-system
```

### Automated Deployment with Git Hooks
```bash
# Set up git repository
git init
git remote add origin https://github.com/yourusername/inventory-management.git

# Use PM2 deploy for automated deployments
pm2 deploy production setup
pm2 deploy production
```

## 📱 Accessing Your Application

After successful deployment, your application will be accessible at:

- **Direct access:** `http://your-server-ip:3000`
- **Through Nginx:** `http://yourdomain.com`
- **With SSL:** `https://yourdomain.com`

### Default Admin Credentials
- **Email:** `admin@inventory.com`
- **Password:** `admin123`

**⚠️ Important:** Change these credentials immediately after first login!

## 🔐 Security Checklist

- [ ] Changed all default passwords
- [ ] Updated secret keys in `.env`
- [ ] Configured firewall properly
- [ ] Set up SSL certificates
- [ ] Enabled MongoDB authentication
- [ ] Regular security updates
- [ ] Set up automated backups
- [ ] Monitor system logs
- [ ] Use strong passwords
- [ ] Keep software updated

## 📞 Support

If you encounter issues during deployment:

1. Check the application logs: `pm2 logs`
2. Check MongoDB status: `sudo systemctl status mongod`
3. Check Nginx configuration: `sudo nginx -t`
4. Verify firewall settings: `sudo ufw status`
5. Check system resources: `htop` or `top`

Your Inventory Management System is now ready for production use! 🎉
