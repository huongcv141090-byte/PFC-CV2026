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
  hinh_the: string;
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

export interface CongDoanFileEntry {
  file: string;
  sheet: string;
  stt: number | null;
  dien_giai?: string[];
  thong_so?: Record<string, string>[];
  dung_cu?: string[];
  bao_ho?: string[];
  thoi_gian_s?: number | null;
  thoi_gian_raw?: string;
  nguoi?: string;
  thiet_bi?: string;
  ghi_chu?: string;
}

export interface CongDoan {
  id: string;
  brand: string;
  stage: string;
  stt: number | null;
  ten: string;
  files: CongDoanFileEntry[];
  images: string[];
}

export interface ChiTietTable {
  file: string;
  sheet: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface StageInfo {
  stage: string;
  bang_chi_tiet: ChiTietTable[];
  cong_doan: CongDoan[];
  qtcn_images?: string[];
}

export interface StagesData {
  order: string[];
  brands: Record<string, { id: string; name: string; stages: Record<string, StageInfo> }>;
}

export function formatMB(mb: number) {
  return `${mb.toFixed(1)} MB`;
}

export function hinhTheSlug(ht: string): string {
  const s = ht
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return s || "khac";
}


export interface HinhThe {
  name: string;
  slug: string;
  files: FileInfo[];
}

export function hinhTheList(brand: BrandInfo): HinhThe[] {
  const map = new Map<string, FileInfo[]>();
  for (const f of brand.files) {
    const ht = f.hinh_the || "KHÁC";
    if (!map.has(ht)) map.set(ht, []);
    map.get(ht)!.push(f);
  }
  return Array.from(map.entries()).map(([name, files]) => ({
    name,
    slug: hinhTheSlug(name),
    files,
  }));
}
