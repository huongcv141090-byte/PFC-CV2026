import Link from "next/link";
import TroLyClient from "@/components/TroLyClient";

export const metadata = {
  title: "Trợ lý AI — PFC Visual Browser",
  description: "Hỏi đáp, truy vấn dữ liệu sản xuất và kaizen bằng AI.",
};

export default function TroLyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">
            Tổng quan
          </Link>{" "}
          / Trợ lý AI
        </p>
        <h1 className="text-2xl font-bold mt-1">🤖 Trợ lý AI vận hành</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Hỏi đáp trực tiếp trên dữ liệu sản xuất: công đoạn, định mức thời gian,
          thiết bị, đề xuất kaizen. Trợ lý tự tìm trong dữ liệu PFC rồi phân tích
          bằng AI anh đã kết nối.
        </p>
      </div>
      <TroLyClient />
    </div>
  );
}
