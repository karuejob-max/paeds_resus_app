import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourcePath = resolve(root, "client/src/lib/site-meta.ts");
const indexPath = resolve(root, "client/index.html");

function readStringConstant(source, name) {
  const pattern = new RegExp(
    "export const " + name + "\\s*=\\s*([\\\"'`])([\\s\\S]*?)\\1;"
  );
  const match = source.match(pattern);
  if (!match) throw new Error(`Unable to find ${name} in ${sourcePath}`);
  return match[2].replace(/\\([\\\"'`])/g, "$1");
}

const source = await readFile(sourcePath, "utf8");
const title = readStringConstant(source, "DEFAULT_PAGE_TITLE");
const description = readStringConstant(source, "DEFAULT_PAGE_DESCRIPTION");
const index = await readFile(indexPath, "utf8");
const metadata = `<!-- PUBLIC_METADATA_START -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="paediatric emergency training Kenya, emergency care training Kenya, BLS certification Kenya, ACLS course Kenya, PALS training Kenya, NRP neonatal resuscitation Kenya, NERP, IERP, ILSP, IERS, ResusGPS, Care Signal, ICPD, institutional emergency readiness" />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <!-- PUBLIC_METADATA_END -->`;

const marker =
  /<!-- PUBLIC_METADATA_START -->[\s\S]*?<!-- PUBLIC_METADATA_END -->/;
if (!marker.test(index)) {
  throw new Error("Public metadata markers are missing from client/index.html");
}

const output = index.replace(marker, metadata);
if (output !== index) await writeFile(indexPath, output, "utf8");
console.log(`Generated public metadata from ${sourcePath}`);
