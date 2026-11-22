import type { NextConfig } from 'next';

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
