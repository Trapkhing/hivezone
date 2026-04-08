import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hivezone.co",
      },
      {
        protocol: "https",
        hostname: "emlwrjkiuzapekhdazsx.supabase.co",
      },
    ],
  },
  allowedDevOrigins: ["10.217.45.102", "localhost", "10.0.2.2"],
};

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  }
})(nextConfig);
