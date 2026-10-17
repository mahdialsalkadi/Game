/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow connections to PartyKit dev server
  async rewrites() {
    return [
      {
        source: '/party/:path*',
        destination: 'http://127.0.0.1:1999/party/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
