export interface SheetInfo {
  name: string;
  rows: number;
  cols: number;
  headers: string[];
  error?: string;
}

export interface FileInfo {
  id: string;
  name: string;
  group: string | null;
  sizeMB: number;
  sheets: SheetInfo[];
  images: string[];
}

export interface BrandInfo {
  id: string;
  name: string;
  files: FileInfo[];
}

export interface IndexData {
  brands: BrandInfo[];
}

export interface ImageMeta {
  w: number;
  h: number;
  files: string[];
}

export function imgUrl(md5: string) {
  return `/img/${md5}.jpg`;
}

export function formatMB(mb: number) {
  return `${mb.toFixed(1)} MB`;
}
