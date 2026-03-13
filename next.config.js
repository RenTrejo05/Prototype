/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  eslint: {
    // Warnings are allowed in build, only errors will fail
    ignoreDuringBuilds: false,
  },
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure externals array exists
      if (!Array.isArray(config.externals)) {
        config.externals = [];
      }
      // Mark MongoDB as external so it doesn't get bundled
      config.externals.push('mongodb');
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
