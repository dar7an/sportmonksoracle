import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
    const body = await readFile(join(process.cwd(), "openapi.yaml"), "utf8");

    return new Response(body, {
        headers: {
            "Content-Type": "application/yaml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
        },
    });
}
