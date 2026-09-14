import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    unoptimized: true,
    remotePatterns:[
      {
        protocol:"https",
        hostname:"lh3.googleusercontent.com"
      },
      {hostname:"plus.unsplash.com"},
      {hostname:"images.unsplash.com"},
      {hostname:"res.cloudinary.com"}


    ]
  }
};

export default nextConfig;
