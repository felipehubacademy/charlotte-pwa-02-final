import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    '/api/tts/file': ['./public/tts/**/*.mp3'],
    // ffmpeg-static ships the platform binary under node_modules; must be
    // copied into the serverless bundle so fluent-ffmpeg can spawn it.
    '/api/pronunciation': ['./node_modules/ffmpeg-static/ffmpeg'],
  },
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'fluent-ffmpeg': false,
      };
    }
    return config;
  },
  images: {
    domains: [],
    unoptimized: false
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' }
        ]
      },
      {
        source: '/api/notifications/scheduler',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Access-Control-Allow-Origin', value: '*' }
        ]
      }
    ];
  }
};

export default nextConfig;
