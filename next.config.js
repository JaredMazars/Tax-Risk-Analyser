/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: false,
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 