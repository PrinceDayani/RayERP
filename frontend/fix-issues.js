// Quick fix script for common issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Applying quick fixes...');

// 1. Fix Next.js configuration for chunk issues
const nextConfigPath = path.join(__dirname, 'next.config.js');
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable for stability
  
  experimental: {
    turbo: false,
  },
  
  webpack: (config, { dev, isServer }) => {
    // Fix chunk loading issues
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      },
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: \`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*\`,
      },
    ];
  },

  output: 'standalone',
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;`;

fs.writeFileSync(nextConfigPath, nextConfigContent);
console.log('✅ Fixed Next.js configuration');

// 2. Create auth token debug utility
const debugAuthPath = path.join(__dirname, 'debug-auth.js');
const debugAuthContent = `// Debug authentication issues
const checkAuth = () => {
  const token = localStorage.getItem('auth-token');
  console.log('🔍 Auth Debug:', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  });
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token payload:', {
        userId: payload.id,
        role: payload.role,
        exp: new Date(payload.exp * 1000),
        isExpired: payload.exp * 1000 < Date.now()
      });
    } catch (e) {
      console.error('❌ Invalid token format');
    }
  }
};

// Run in browser console
if (typeof window !== 'undefined') {
  window.checkAuth = checkAuth;
  console.log('🔧 Run checkAuth() in console to debug authentication');
}`;

fs.writeFileSync(debugAuthPath, debugAuthContent);
console.log('✅ Created auth debug utility');

console.log('🎉 Quick fixes applied! Restart your development server.');