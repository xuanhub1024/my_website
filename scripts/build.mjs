import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const staticRoot = path.join(distRoot, "static");
const serverRoot = path.join(distRoot, "server");

await rm(distRoot, { recursive: true, force: true });
await mkdir(staticRoot, { recursive: true });
await mkdir(serverRoot, { recursive: true });

await cp(path.join(projectRoot, "index.html"), path.join(staticRoot, "index.html"));

const publicAssets = [
  "assets/profile-photo-crop.webp",
  "assets/deco-law-cert.webp",
  "assets/deco-ai-friend.webp",
  "assets/map-parchment.webp",
  "assets/phone.png",
  "assets/mail.png",
  "assets/wechat.png",
  "assets/wechat-qr.jpg",
  "assets/bytedance-logo.png",
  "assets/pdpo-logo.png",
  "assets/icma-logo.png",
  "assets/shihui-logo.png",
  "assets/court-logo.png",
  "assets/shuanxin-logo.png",
  "assets/debate-1.jpg",
  "assets/debate-2.jpg",
  "assets/debate-3.jpg",
  "assets/debate-4.jpg",
  "output/assets/genesis_sketch.webp",
  "output/assets/genesis_color.webp",
  "output/assets/genesis_robot.webp",
  "output/assets/last_supper_robot.webp",
  "output/assets/macos_desktop.webp"
];

for (const asset of publicAssets) {
  const destination = path.join(staticRoot, asset);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(projectRoot, asset), destination);
}

const workerSource = `export default {
  async fetch(request, env) {
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }
    return new Response("Static assets binding unavailable", { status: 500 });
  }
};
`;

await writeFile(path.join(serverRoot, "index.js"), workerSource);
