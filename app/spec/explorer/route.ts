export const runtime = "nodejs";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sportmonks Cricket Oracle API</title>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.yaml"
      data-configuration='{"theme":"kepler","hideDarkModeToggle":false}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.31.18"></script>
  </body>
</html>`;

export async function GET() {
    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
        },
    });
}
