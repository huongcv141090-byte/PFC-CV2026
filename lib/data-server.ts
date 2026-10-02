import { promises as fs } from "fs";
import path from "path";
import type { IndexData, BrandInfo, FileInfo, ImageMeta } from "./data";

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "public", "data", ...parts);
}

let indexCache: IndexData | null = null;
let imagesCache: Record<string, ImageMeta> | null = null;

export async function getIndex(): Promise<IndexData> {
  if (!indexCache) {
    indexCache = JSON.parse(await fs.readFile(dataPath("index.json"), "utf-8"));
  }
  return indexCache!;
}

export async function getImages(): Promise<Record<string, ImageMeta>> {
  if (!imagesCache) {
    imagesCache = JSON.parse(
      await fs.readFile(dataPath("images.json"), "utf-8")
    );
  }
  return imagesCache!;
}

export async function getBrand(brandId: string): Promise<BrandInfo | null> {
  const idx = await getIndex();
  return idx.brands.find((b) => b.id === brandId) ?? null;
}

export async function getFile(
  brandId: string,
  fileId: string
): Promise<{ brand: BrandInfo; file: FileInfo } | null> {
  const brand = await getBrand(brandId);
  if (!brand) return null;
  const file = brand.files.find((f) => f.id === fileId);
  if (!file) return null;
  return { brand, file };
}
