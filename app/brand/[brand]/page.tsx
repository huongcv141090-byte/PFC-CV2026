import { notFound } from "next/navigation";
import Link from "next/link";
import { getIndex, getBrand } from "@/lib/data-server";
import { imgUrl, hinhTheList } from "@/lib/data";

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
  const hts = hinhTheList(brand);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">
            Tổng quan
          </Link>{" "}
          / {brand.name}
        </p>
        <h1 className="text-2xl font-bold mt-1">
          Hình thể — {brand.name}{" "}
          <span className="text-base font-normal text-slate-500 dark:text-slate-400">
            ({hts.length} hình thể · {brand.files.length} mã hàng)
          </span>
        </h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hts.map((ht) => {
          const thumb = ht.files.find((f) => f.images[0])?.images[0];
          const sheets = ht.files.reduce((n, f) => n + f.sheets.length, 0);
          return (
            <Link
              key={ht.slug}
              href={`/brand/${brand.id}/hinh-the/${ht.slug}`}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-300 transition"
            >
              <div className="h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl(thumb)}
                    alt={ht.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <span className="text-slate-300 text-4xl font-bold">
                    {ht.files.length}
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold leading-snug">{ht.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {ht.files.length} mã hàng · {sheets} sheet
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
