const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WebpackBar = require('webpackbar');
const CracoAlias = require('craco-alias');
// craco.config.js
const CracoLessPlugin = require('craco-less');

process.env.BROWSER = 'none';

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        os: require.resolve('os-browserify/browser'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        crypto: require.resolve('crypto-browserify'),
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
      };

      // Add plugins to webpack if needed
      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new WebpackBar({ profile: true }),
        ...(process.env.NODE_ENV === 'development'
          ? [new BundleAnalyzerPlugin({ openAnalyzer: false })]
          : []),
      ];

      return webpackConfig;
    },
  },
  eslint: {
    enable: true,
    mode: "extends",
    configure: {
      extends: ['react-app', 'react-app/jest'],
    },
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },
    {
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        baseUrl: './src/',
        tsConfigPath: './tsconfig.paths.json',
      },
    },
  ],
};
