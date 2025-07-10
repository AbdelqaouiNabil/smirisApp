#!/bin/bash

# Germansphere SaaS Platform - Deployment Script
# Supports AWS EC2, Heroku, and Vercel deployments

set -e

echo "🚀 Germansphere SaaS Platform Deployment Script"
echo "================================================"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Frontend dependencies
    pnpm install
    
    # Backend dependencies
    cd server && npm install && cd ..
    
    print_success "Dependencies installed successfully"
}

# Build the project
build_project() {
    print_status "Building project..."
    
    # Build frontend
    pnpm build
    
    # Build backend
    cd server && npm run build && cd ..
    
    print_success "Project built successfully"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_warning "Created .env file from template. Please configure your environment variables."
    fi
    
    if [ ! -f server/.env ]; then
        cp server/.env.example server/.env 2>/dev/null || echo "# Backend Environment Variables" > server/.env
        print_warning "Created server/.env file. Please configure your backend environment variables."
    fi
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed"
        exit 1
    fi
    
    # Create Procfile for Heroku
    cat > Procfile << EOF
web: cd server && npm start
EOF
    
    # Create package.json for Heroku deployment
    cat > package.json << EOF
{
  "name": "germansphere-saas",
  "version": "1.0.0",
  "scripts": {
    "start": "cd server && npm start",
    "build": "cd server && npm run build",
    "heroku-postbuild": "pnpm install && pnpm build && cd server && npm install && npm run build"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
EOF
    
    # Deploy to Heroku
    git add -A
    git commit -m "Deploy to Heroku" || true
    heroku create germansphere-saas || true
    git push heroku main
    
    print_success "Deployed to Heroku successfully"
}

# Deploy to Vercel (Frontend only)
deploy_vercel() {
    print_status "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Install it with: npm i -g vercel"
        exit 1
    fi
    
    # Create vercel.json configuration
    cat > vercel.json << EOF
{
  "version": 2,
  "name": "germansphere-saas",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url",
    "REACT_APP_STRIPE_PUBLIC_KEY": "@react_app_stripe_public_key",
    "REACT_APP_PAYPAL_CLIENT_ID": "@react_app_paypal_client_id"
  }
}
EOF
    
    # Deploy to Vercel
    vercel --prod
    
    print_success "Deployed to Vercel successfully"
}

# Setup AWS EC2 deployment
deploy_aws_ec2() {
    print_status "Setting up AWS EC2 deployment..."
    
    # Create ecosystem.config.js for PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'germansphere-frontend',
      script: 'npx serve dist -s -l 3000',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'germansphere-backend',
      script: 'dist/server.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
}
EOF
    
    # Create nginx configuration
    cat > nginx.conf << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Create deployment script for EC2
    cat > deploy-ec2.sh << 'EOF'
#!/bin/bash
# Run this script on your EC2 instance

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Setup PostgreSQL
sudo -u postgres createdb germansphere_db
sudo -u postgres createuser germansphere_user
sudo -u postgres psql -c "ALTER USER germansphere_user PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE germansphere_db TO germansphere_user;"

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/germansphere
sudo ln -s /etc/nginx/sites-available/germansphere /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Restart nginx
sudo systemctl restart nginx

# Start applications with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "EC2 deployment setup complete!"
echo "Remember to:"
echo "1. Configure your domain DNS to point to this EC2 instance"
echo "2. Setup SSL certificate (Let's Encrypt recommended)"
echo "3. Configure your .env files with production values"
echo "4. Run database migrations"
EOF
    
    chmod +x deploy-ec2.sh
    
    print_success "AWS EC2 deployment files created"
    print_warning "Upload these files to your EC2 instance and run ./deploy-ec2.sh"
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    cd server
    
    # Install database dependencies if not already done
    npm install
    
    # Run database initialization
    npm run db:init || print_warning "Database initialization skipped (may already exist)"
    
    # Run database seeding
    npm run db:seed || print_warning "Database seeding skipped"
    
    cd ..
    
    print_success "Database setup completed"
}

# Main deployment function
main() {
    print_status "Starting Germansphere SaaS Platform deployment"
    
    # Parse command line arguments
    PLATFORM=${1:-"local"}
    
    case $PLATFORM in
        "heroku")
            check_dependencies
            setup_environment
            install_dependencies
            build_project
            deploy_heroku
            ;;
        "vercel")
            check_dependencies
            setup_environment
            install_dependencies
            build_project
            deploy_vercel
            ;;
        "aws"|"ec2")
            check_dependencies
            setup_environment
            install_dependencies
            build_project
            deploy_aws_ec2
            ;;
        "local"|"development")
            check_dependencies
            setup_environment
            install_dependencies
            setup_database
            build_project
            print_success "Local development setup complete!"
            print_status "Start the development servers:"
            print_status "Frontend: pnpm dev"
            print_status "Backend: cd server && npm run dev"
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            echo "Usage: $0 [heroku|vercel|aws|local]"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed successfully! 🎉"
}

# Run main function with all arguments
main "$@"
