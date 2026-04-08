/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF is generally 20% smaller than WebP. This is a massive speed boost.
    formats: ['image/avif', 'image/webp'], 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mnakswmhlreuclyultdc.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.spoonacular.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;