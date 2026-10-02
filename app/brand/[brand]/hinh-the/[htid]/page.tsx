import { notFound } from "next/navigation";
import Link from "next/link";
import { getIndex, getBrand } from "@/lib/data-server";
import { hinhTheList, mauSacList, imgUrl } from "@/lib/data";

export async function generateStaticParams() {
  const index = await getIndex();
  return index.brands.flatMap((b) =>
    hinhTheList(b).map((ht) => ({ brand: b.id, htid: ht.slug }))
  );
}

export default async function HinhThePage({
  params,
}: {
  params: { brand: string; htid: string };
}) {
  const brand = await getBrand(params.brand);
  if (!brand) notFound();
  const ht = hinhTheList(brand).find((h) => h.slug === params.htid);
  if (!ht) notFound();
  const colors = mauSacList(ht.files);

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
          / Hình thể
        </p>
        <h1 className="text-2xl font-bold mt-1">
          Màu sắc — {ht.name}{" "}
          <span className="text-base font-normal text-slate-500 dark:text-slate-400">
            ({colors.length} màu · {ht.files.length} mã hàng)
          </span>
        </h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((c) => {
          const thumb = c.files.find((f) => f.images[0])?.images[0];
          return (
            <Link
              key={c.slug}
              href={`/brand/${brand.id}/hinh-the/${ht.slug}/mau/${c.slug}`}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-300 transition"
            >
              <div className="h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl(thumb)}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <span className="text-slate-300 text-3xl font-bold">
                    {c.files.length}
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold leading-snug">{c.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {c.files.length} mã hàng
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
