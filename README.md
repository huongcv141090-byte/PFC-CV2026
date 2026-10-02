# PFC Visual Browser

Trình duyệt trực quan hồ sơ sản xuất PFC (giày ủng đi mưa — Công ty TNHH Giầy
Tuấn Việt). Duyệt file Excel theo nhãn hàng, xem cấu trúc sheet (định mức,
lưu trình, quy trình công nghệ, định mức thời gian) và ảnh minh họa công
đoạn — giao diện tiếng Việt.

## Cấu trúc

- `app/` — Next.js 14 App Router: `/` (tổng quan), `/brand/[brand]`,
  `/file/[...slug]`, `/gallery`
- `components/` — Lightbox, FileList (tìm kiếm), FileDetail, GalleryClient
- `lib/data.ts` — đọc dữ liệu tĩnh từ `public/data/`
- `scripts/build-data.py` — sinh dữ liệu tĩnh từ file Excel gốc
- `public/data/index.json` — brands → files → sheets + danh sách ảnh
- `public/data/images.json` — md5 ảnh → kích thước gốc + file chứa
- `public/img/*.jpg` — ảnh minh họa đã khử trùng lặp, resize ≤900px, JPEG q70

## Sinh dữ liệu

```bash
/home/hatch/workspace/drive-watch/venv/bin/python scripts/build-data.py
```

Script quét mọi `.xlsx` trong `~/workspace/drive-watch/files/`
(ADIDAS + JILEON), đọc cấu trúc từng sheet bằng openpyxl (read_only), tách
ảnh nhúng từ `xl/media`, khử trùng lặp theo md5, resize và lưu vào
`public/img/`. Cuối cùng in tổng số file/sheet/ảnh và dung lượng `public/`.

## Chạy dev

```bash
npm install
npm run dev
# mở http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Deploy lên Vercel

1. Push repo lên GitHub.
2. Trên [vercel.com](https://vercel.com) → Add New → Project → chọn repo.
3. Framework Preset: **Next.js** (mặc định). Không cần biến môi trường.
4. Deploy. Mỗi lần push lên `main` sẽ tự deploy lại.

Lưu ý: `public/` chứa dữ liệu tĩnh (ảnh + JSON) nên lần deploy đầu sẽ lâu
hơn bình thường một chút.
