export async function redirects() {
    return [
        {
            source: "/",
            destination: "/fixture",
            permanent: true,
        },
    ];
}
