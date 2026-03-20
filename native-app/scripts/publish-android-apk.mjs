import fs from "node:fs/promises";
import path from "node:path";

const nativeRoot = process.cwd();
const projectRoot = path.resolve(nativeRoot, "..");
const releaseApk = path.join(nativeRoot, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
const debugApk = path.join(nativeRoot, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const targetDir = path.join(projectRoot, "public", "downloads");
const targetApk = path.join(targetDir, "duck-memo-android-latest.apk");

await fs.mkdir(targetDir, { recursive: true });
let sourceApk = releaseApk;

try {
  await fs.access(releaseApk);
} catch {
  sourceApk = debugApk;
}

await fs.copyFile(sourceApk, targetApk);

console.log(`Published APK to ${targetApk}`);
