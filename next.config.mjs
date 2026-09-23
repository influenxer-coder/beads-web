/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cover art is stored at 1400x1400 and rendered at 72px on the shelf.
    // Serving the original meant megabytes of PNG per thumbnail, which is the
    // likeliest reason phone visitors left before the page was usable.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yjxmplswceurjipkcxto.supabase.co',
        pathname: '/storage/v1/object/public/beads-assets/**',
      },
    ],
  },
};

export default nextConfig;
