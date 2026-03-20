import fs from "node:fs/promises";
import path from "node:path";

const nativeRoot = process.cwd();
const projectRoot = path.resolve(nativeRoot, "..");
const sourceHtmlPath = path.join(projectRoot, "public", "dday-v3.html");
const targetDir = path.join(nativeRoot, "web");
const targetHtmlPath = path.join(targetDir, "index.html");
const assetFiles = ["duck-hero.png", "profile-duck.png"];

await fs.mkdir(targetDir, { recursive: true });

let html = await fs.readFile(sourceHtmlPath, "utf8");

html = html
  .replace(/<title>[\s\S]*?<\/title>/, "<title>짱귀요미오리 D-DAY APP</title>")
  .replace(/<link rel="manifest"[^>]*>\s*/g, "")
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, "")
  .replace(/<meta name="theme-color"[^>]*>\s*/g, "")
  .replace(/<meta name="apple-mobile-web-app-capable"[^>]*>\s*/g, "")
  .replace(/<a class="tool-btn" href="\/app">APP 받기<\/a>/g, '<span class="tool-btn" style="opacity:.58;cursor:default">APP 버전</span>')
  .replace(/if\("serviceWorker" in navigator\)\{\s*window\.addEventListener\("load",\(\)=>\{navigator\.serviceWorker\.register\("\/sw\.js"\)\.catch\(\(\)=>\{\}\)\}\)\s*\}\s*/g, "");

await fs.writeFile(targetHtmlPath, html, "utf8");

for (const fileName of assetFiles) {
  const source = path.join(projectRoot, "public", fileName);
  const target = path.join(targetDir, fileName);
  await fs.copyFile(source, target);
}

console.log("Synced mobile web assets into native-app/web");
