import { promises as fs } from "fs";
import path from "path";
import type { IndexData, BrandInfo, FileInfo, ImageMeta, StagesData, CongDoan } from "./data";

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "public", "data", ...parts);
}

let indexCache: IndexData | null = null;
let imagesCache: Record<string, ImageMeta> | null = null;
let stagesCache: StagesData | null = null;

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

export async function getStages(): Promise<StagesData> {
  if (!stagesCache) {
    stagesCache = JSON.parse(
      await fs.readFile(dataPath("stages.json"), "utf-8")
    );
  }
  return stagesCache!;
}

export async function getCongDoan(
  brandId: string,
  cdId: string
): Promise<CongDoan | null> {
  const stages = await getStages();
  const b = stages.brands[brandId];
  if (!b) return null;
  for (const st of Object.values(b.stages)) {
    const found = st.cong_doan.find((c) => c.id === cdId);
    if (found) return found;
  }
  return null;
}

export async function getFileNames(): Promise<Record<string, string>> {
  const index = await getIndex();
  const map: Record<string, string> = {};
  for (const b of index.brands) {
    for (const f of b.files) {
      map[`${b.id}/${f.id}`] = f.name;
    }
  }
  return map;
}

export interface SyncInfo {
  last_sync: string;
  source: string;
}

export async function getSyncInfo(): Promise<SyncInfo | null> {
  try {
    return JSON.parse(await fs.readFile(dataPath("sync.json"), "utf-8"));
  } catch {
    return null;
  }
}
