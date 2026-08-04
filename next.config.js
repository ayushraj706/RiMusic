/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baaki tumhari purani settings yahan rahengi...

  async headers() {
    return [
      {
        // Ye saare routes (poori website) par apply hoga
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Koi tumhari site ko iframe me nahi khol payega (Clickjacking se bachaav)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Browser ko bewakoof banne se rokega
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Hamesha HTTPS par force karega (1 saal ke liye)
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none';", // Basic CSP, isko aage badhaya ja sakta hai
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
