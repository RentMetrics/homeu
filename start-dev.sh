#!/bin/bash

# HomeU Development Server Startup Script
# This script starts the Next.js development server with optimized settings for WorkOS integration

echo "🚀 Starting HomeU Development Server..."
echo "📊 Configuring for WorkOS enterprise integration and blockchain features"

# Set Node.js options for larger HTTP headers (required for WorkOS authentication)
export NODE_OPTIONS="--max-http-header-size=131072"

# Start the development server
npm run dev

echo "✅ HomeU Development Server started successfully!"
echo "🌐 Access the application at: http://localhost:3003"
echo "🏢 Property Manager Portal: http://localhost:3003/property-manager/login"
echo "💳 Blockchain Payments: http://localhost:3003/dashboard/payments"