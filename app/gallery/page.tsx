import { getIndex, getImages } from "@/lib/data-server";
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
  for (const b of index.brands) {
    for (const f of b.files) {
      fileNames[`${b.id}/${f.id}`] = f.name;
    }
  }

  // most-shared images first
  items.sort((a, b) => b.files.length - a.files.length);

  return (
    <GalleryClient
      items={items}
      brands={index.brands.map((b) => ({ id: b.id, name: b.name }))}
      fileNames={fileNames}
    />
  );
}
