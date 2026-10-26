/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '100.76.185.49',
    '100.76.185.49:3000',
    '192.168.0.140',
    '192.168.0.140:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
  turbopack: {
    root: __dirname,
  },
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
