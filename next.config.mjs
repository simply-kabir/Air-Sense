/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  images: {
    domains: [],
  },
}

export default nextConfig
