/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '*.onrender.com', '*.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
}

module.exports = nextConfig



