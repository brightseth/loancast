const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'i.imgur.com'],
  },
}

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  org: "loancast",
  project: "loancast-web",
  silent: true, // Suppresses all logs
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)