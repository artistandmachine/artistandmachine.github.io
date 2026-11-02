/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static output — no Node server required, deployable to
  // Cloudflare Pages / Netlify / GitHub Pages as plain files.
  output: "export",
  images: {
    // Static export can't run Next's on-demand resize/format server;
    // pre-size and pre-compress source images before they go in public/
    // instead (see README) to get the equivalent byte savings.
    unoptimized: true,
  },
  experimental: {
    agentUpgrade: "security",
  },
};

module.exports = nextConfig;
