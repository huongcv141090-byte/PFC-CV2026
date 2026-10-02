import { getIndex, getImages } from "@/lib/data-server";
import { hinhTheList } from "@/lib/data";
import GalleryClient, { type GalleryItem } from "@/components/GalleryClient";

export default async function GalleryPage() {
  const [index, images] = await Promise.all([getIndex(), getImages()]);

  const items: GalleryItem[] = Object.entries(images).map(([md5, m]) => ({
    md5,
    w: m.w,
    h: m.h,
    files: m.files,
  }));

  const fileNames: Record<string, string> = {};
  const fileHinhThe: Record<string, string> = {};
  for (const b of index.brands) {
    for (const f of b.files) {
      fileNames[`${b.id}/${f.id}`] = f.name;
      fileHinhThe[`${b.id}/${f.id}`] = f.hinh_the;
    }
  }

  const hinhThes: { brandId: string; brandName: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const b of index.brands) {
    for (const ht of hinhTheList(b)) {
      const key = `${b.id}|${ht.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        hinhThes.push({ brandId: b.id, brandName: b.name, name: ht.name });
      }
    }
  }

  // most-shared images first
  items.sort((a, b) => b.files.length - a.files.length);

  return (
    <GalleryClient
      items={items}
      brands={index.brands.map((b) => ({ id: b.id, name: b.name }))}
      fileNames={fileNames}
      fileHinhThe={fileHinhThe}
      hinhThes={hinhThes}
    />
  );
}
