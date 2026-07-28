import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors must fail the build — a missing `Saturday` case in the bulk
    // scheduler shipped to production while this was disabled.
    ignoreBuildErrors: false,
  },
}

export default nextConfig
