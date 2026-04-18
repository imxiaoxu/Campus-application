import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve("dist");
const indexFile = resolve(distDir, "index.html");
const fallbackFile = resolve(distDir, "404.html");
const noJekyllFile = resolve(distDir, ".nojekyll");

await copyFile(indexFile, fallbackFile);
await writeFile(noJekyllFile, "");
