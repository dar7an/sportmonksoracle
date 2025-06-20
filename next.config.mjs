/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['o1js']
    }
};

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
