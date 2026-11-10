import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const relativePath = "public/google69888fc2c4db9c97.html";
const expected = "google-site-verification: google69888fc2c4db9c97.html";
const absolutePath = resolve(process.cwd(), relativePath);

let actual;
try {
  actual = readFileSync(absolutePath, "utf8");
} catch {
  console.error(`Google Search Console verification file is missing: ${relativePath}`);
  process.exit(1);
}

if (actual !== expected && actual !== `${expected}\n`) {
  console.error(`Google Search Console verification file has unexpected content: ${relativePath}`);
  process.exit(1);
}

console.log("Google Search Console verification file is present and valid.");
