import { access, cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputRoot = path.join(projectRoot, "dist");
const staticRoot = path.join(outputRoot, "static");

const requiredEntries = ["index.html", "assets", "output"];
const optionalEntries = [
  "_headers",
  "404.html",
  "favicon.ico",
  "manifest.webmanifest",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml",
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyEntry(relativePath, required) {
  const source = path.join(projectRoot, relativePath);
  if (!(await exists(source))) {
    if (required) {
      throw new Error(`Required site entry is missing: ${relativePath}`);
    }
    return;
  }

  const destination = path.join(staticRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

async function summarize(directory) {
  let files = 0;
  let bytes = 0;

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = await summarize(entryPath);
      files += child.files;
      bytes += child.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(entryPath)).size;
    }
  }

  return { files, bytes };
}

await rm(outputRoot, { force: true, recursive: true });
await mkdir(staticRoot, { recursive: true });

for (const entry of requiredEntries) {
  await copyEntry(entry, true);
}

for (const entry of optionalEntries) {
  await copyEntry(entry, false);
}

const { files, bytes } = await summarize(staticRoot);
console.log(
  `Built ${files} static files in dist/static (${(bytes / 1024 / 1024).toFixed(2)} MiB).`,
);
