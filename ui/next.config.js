/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
    SERVER_URL: process.env.SERVER_URL,
  }
}

module.exports = nextConfig
