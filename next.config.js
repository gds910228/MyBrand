/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com', pathname: '/secure.notion-static.com/**' },
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'prod-files-secure.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' }
    ]
  },
  async redirects() {
    return [
      { source: '/$', destination: '/', permanent: true },
    ]
  }
};

module.exports = nextConfig;