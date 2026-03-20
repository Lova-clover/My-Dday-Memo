import fs from "node:fs/promises";
import path from "node:path";

const nativeRoot = process.cwd();
const projectRoot = path.resolve(nativeRoot, "..");
const sourceApk = path.join(nativeRoot, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const targetDir = path.join(projectRoot, "public", "downloads");
const targetApk = path.join(targetDir, "duck-memo-android-latest.apk");

await fs.mkdir(targetDir, { recursive: true });
await fs.copyFile(sourceApk, targetApk);

console.log(`Published APK to ${targetApk}`);
