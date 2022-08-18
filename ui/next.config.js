/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
    TYPESENSE_SERVER_URL: process.env.TYPESENSE_SERVER_URL,
  }
}

module.exports = nextConfig
