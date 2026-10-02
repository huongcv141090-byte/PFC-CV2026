import { notFound } from "next/navigation";
import { getIndex, getBrand } from "@/lib/data-server";
import FileList from "@/components/FileList";

export async function generateStaticParams() {
  const index = await getIndex();
  return index.brands.map((b) => ({ brand: b.id }));
}

export default async function BrandPage({
  params,
}: {
  params: { brand: string };
}) {
  const brand = await getBrand(params.brand);
  if (!brand) notFound();
  return (
    <FileList brandId={brand.id} brandName={brand.name} files={brand.files} />
  );
}
