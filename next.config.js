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
        // Static assets have content hashes in filenames — safe to cache forever
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
