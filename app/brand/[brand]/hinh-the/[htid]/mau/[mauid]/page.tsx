import { notFound } from "next/navigation";
import Link from "next/link";
import { getIndex, getBrand } from "@/lib/data-server";
import { hinhTheList, mauSacList } from "@/lib/data";
import FileList from "@/components/FileList";

export async function generateStaticParams() {
  const index = await getIndex();
  return index.brands.flatMap((b) =>
    hinhTheList(b).flatMap((ht) =>
      mauSacList(ht.files).map((c) => ({
        brand: b.id,
        htid: ht.slug,
        mauid: c.slug,
      }))
    )
  );
}

export default async function MauSacPage({
  params,
}: {
  params: { brand: string; htid: string; mauid: string };
}) {
  const brand = await getBrand(params.brand);
  if (!brand) notFound();
  const ht = hinhTheList(brand).find((h) => h.slug === params.htid);
  if (!ht) notFound();
  const color = mauSacList(ht.files).find((c) => c.slug === params.mauid);
  if (!color) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">
            Tổng quan
          </Link>{" "}
          /{" "}
          <Link href={`/brand/${brand.id}`} className="hover:underline">
            {brand.name}
          </Link>{" "}
          /{" "}
          <Link
            href={`/brand/${brand.id}/hinh-the/${ht.slug}`}
            className="hover:underline"
          >
            {ht.name}
          </Link>{" "}
          / Màu sắc
        </p>
        <h1 className="text-2xl font-bold mt-1">
          Mã hàng — {color.name}{" "}
          <span className="text-base font-normal text-slate-500 dark:text-slate-400">
            ({color.files.length} mã hàng)
          </span>
        </h1>
      </div>
      <FileList
        brandId={brand.id}
        brandName={brand.name}
        files={color.files}
        hideHeader
      />
    </div>
  );
}
