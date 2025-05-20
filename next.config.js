/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.avcodes.co.uk'], // Allow images from aircodes
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Create aliases for both node: protocol and regular module names
      const nodeModules = [
        'async_hooks',
        'perf_hooks',
        'worker_threads',
        'cluster',
        'module',
        'vm',
        'inspector',
        'repl',
        'readline',
        'v8',
        'domain',
        'punycode',
        'fs',
        'tls',
        'net',
        'dns',
        'child_process',
        'http2',
        'stream',
        'crypto',
        'zlib',
        'path',
        'os',
        'util',
        'assert',
        'constants',
        'buffer',
        'events',
        'http',
        'https',
        'url',
        'querystring',
        'string_decoder',
        'timers',
        'process'
      ];

      // Create aliases for both node: protocol and regular module names
      const aliases = nodeModules.reduce((acc, module) => {
        acc[`node:${module}`] = false;
        acc[module] = false;
        return acc;
      }, {});

      config.resolve.alias = {
        ...config.resolve.alias,
        ...aliases
      };
    }
    return config;
  },
}

module.exports = nextConfig 