/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

export async function redirects() {
    return [
        {
            source: "/",
            destination: "/fixture",
            permanent: true,
        },
    ];
}
