import { notFound } from "next/navigation";
import { getIndex, getFile, getImages } from "@/lib/data-server";
import FileDetail from "@/components/FileDetail";

export async function generateStaticParams() {
  const index = await getIndex();
  return index.brands.flatMap((b) =>
    b.files.map((f) => ({ slug: [b.id, f.id] }))
  );
}

export default async function FilePage({
  params,
}: {
  params: { slug: string[] };
}) {
  const [brandId, fileId] = params.slug ?? [];
  const found = brandId && fileId ? await getFile(brandId, fileId) : null;
  if (!found) notFound();
  const imagesMeta = await getImages();
  return (
    <FileDetail
      brandId={found.brand.id}
      brandName={found.brand.name}
      file={found.file}
      imagesMeta={imagesMeta}
    />
  );
}
