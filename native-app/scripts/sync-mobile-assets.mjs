import fs from "node:fs/promises";
import path from "node:path";

const nativeRoot = process.cwd();
const projectRoot = path.resolve(nativeRoot, "..");
const sourceHtmlPath = path.join(projectRoot, "public", "dday-v3.html");
const targetDir = path.join(nativeRoot, "web");
const targetHtmlPath = path.join(targetDir, "index.html");
const assetFiles = ["my-dday-logo.png", "profile-duck.png"];

await fs.mkdir(targetDir, { recursive: true });

let html = await fs.readFile(sourceHtmlPath, "utf8");

html = html
  .replace(/<title>[\s\S]*?<\/title>/, "<title>나만의 D-DAY APP</title>")
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, "")
  .replace(/<link rel="manifest"[^>]*>\s*/g, "")
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, "")
  .replace(/<meta name="theme-color"[^>]*>\s*/g, "")
  .replace(/<meta name="apple-mobile-web-app-capable"[^>]*>\s*/g, "")
  .replace(/font-family:"Nunito",sans-serif/g, 'font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic","Segoe UI",sans-serif')
  .replace(/<a class="tool-btn" href="\/app">APP 받기<\/a>/g, '<span class="tool-btn" style="opacity:.58;cursor:default">APP 버전</span>')
  .replace(/if\("serviceWorker" in navigator\)\{\s*window\.addEventListener\("load",\(\)=>\{navigator\.serviceWorker\.register\("\/sw\.js"\)\.catch\(\(\)=>\{\}\)\}\)\s*\}\s*/g, "")
  .replace(
    /<\/head>/,
    '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; img-src \'self\' data: blob:; style-src \'self\' \'unsafe-inline\'; script-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; connect-src \'self\' http://localhost https://localhost capacitor://localhost;">\n</head>',
  );

await fs.writeFile(targetHtmlPath, html, "utf8");

for (const fileName of assetFiles) {
  const source = path.join(projectRoot, "public", fileName);
  const target = path.join(targetDir, fileName);
  await fs.copyFile(source, target);
}

console.log("Synced mobile web assets into native-app/web");
