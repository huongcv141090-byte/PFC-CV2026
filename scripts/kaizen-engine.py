#!/usr/bin/env python3
"""Kaizen Neural Engine — hoc pattern tu du lieu cong doan de de xuat toi uu.

Kien truc lay cam hung tu mang no-ron (tai lieu MRBIT_NEURAL_CODING_01):
  INPUT LAYER   : stages.json + index.json (dinh muc thoi gian, dung cu, thiet bi)
  FEATURE LAYER : vector dac trung moi cong doan (thoi gian, bien dong, thu cong, nguoi)
  PATTERN LAYER : hoc equipment KB tu du lieu + do tuong dong ngu nghia ten cong doan
  OUTPUT LAYER  : de xuat kaizen co cham diem impact, kem bang chung

Triet ly (theo tai lieu LLM/AI Agent): phep tinh giao cho chuong trinh;
khong tu nhan "AI du doan" khi chua co mo hinh huan luyen that.
"""
import json
import os
import re
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone

WEB = os.environ.get("WEB_DIR", "/home/hatch/workspace/pfc-web")
STAGES = os.path.join(WEB, "public/data/stages.json")
INDEX = os.path.join(WEB, "public/data/index.json")
OUT = os.path.join(WEB, "public/data/kaizen.json")

STOPWORDS = {
    "va", "và", "cua", "của", "cho", "voi", "với", "cac", "các",
    "de", "để", "duoc", "được", "theo", "trong", "tren", "trên",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("đ", "d")
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def tokens(s: str) -> set:
    return {t for t in norm(s).split() if t and t not in STOPWORDS}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def num(x) -> float:
    try:
        v = float(x)
        return v if v == v and abs(v) != float("inf") else 0.0
    except (TypeError, ValueError):
        return 0.0


def fmt_sec(s: float) -> str:
    if s >= 3600:
        return f"{s/3600:.1f} giờ"
    if s >= 60:
        return f"{s/60:.1f} phút"
    return f"{s:.1f} giây"


MANUAL_HINTS = ["mài tay", "thủ công", "chỉnh sửa", "vệ sinh"]


def main():
    stages = json.load(open(STAGES, encoding="utf-8"))
    index = json.load(open(INDEX, encoding="utf-8"))
    file_ht = {}
    for b in index["brands"]:
        for f in b["files"]:
            file_ht[f"{b['id']}/{f['id']}"] = (f.get("hinh_the") or "", f.get("colors") or [])

    # ---------- FEATURE LAYER ----------
    feats = []  # one per (brand, cong_doan)
    for bid, b in stages["brands"].items():
        for st in b["stages"].values():
            for cd in st["cong_doan"]:
                times = [num(f.get("thoi_gian_s")) for f in cd["files"]]
                times = [t for t in times if t > 0]
                if not times:
                    continue
                equip = set()
                workers = 0.0
                for f in cd["files"]:
                    dc = f.get("dung_cu")
                    if isinstance(dc, list):
                        equip.update(str(t).strip() for t in dc if str(t).strip())
                    elif isinstance(dc, str) and dc.strip():
                        equip.add(dc.strip())
                    tb = f.get("thiet_bi")
                    if tb and str(tb).strip():
                        equip.add(str(tb).strip())
                    workers += num(f.get("nguoi"))
                avg = sum(times) / len(times)
                mx, mn = max(times), min(times)
                feats.append({
                    "brand_id": bid, "brand": b["name"], "stage": st["stage"],
                    "ten": cd["ten"], "id": cd.get("id", ""),
                    "toks": tokens(cd["ten"]),
                    "avg": avg, "mx": mx, "mn": mn,
                    "var": (mx - mn) / avg if avg else 0,
                    "n": len(times),
                    "equip": sorted(equip),
                    "workers": workers,
                    "manual_hint": any(h in norm(cd["ten"]) for h in [norm(x) for x in MANUAL_HINTS]),
                })

    # ---------- PATTERN LAYER: equipment knowledge base ----------
    # hoc tu du lieu: token -> thiet bi da dung cho cong doan tuong tu
    kb = defaultdict(set)
    for f in feats:
        if not f["equip"]:
            continue
        for t in f["toks"]:
            kb[t].update(f["equip"])
    kb = {k: sorted(v) for k, v in kb.items() if len(v) <= 6}

    equipped = [f for f in feats if f["equip"]]

    def similar_equipped(f, top=3):
        scored = []
        for g in equipped:
            if g["brand_id"] == f["brand_id"] and g["ten"] == f["ten"]:
                continue
            s = jaccard(f["toks"], g["toks"])
            if s >= 0.25:
                scored.append((s, g))
        scored.sort(key=lambda x: -x[0])
        return scored[:top]

    # ---------- OUTPUT LAYER: recommendations ----------
    recs = []
    rid = 0

    def add(rtype, type_vi, f, score, suggestion, evidence, ref_equip=None):
        nonlocal rid
        rid += 1
        recs.append({
            "id": f"kz-{rid:04d}",
            "type": rtype, "type_vi": type_vi,
            "cong_doan": f["ten"], "brand": f["brand"], "stage": f["stage"],
            "score": round(score, 1),
            "suggestion": suggestion,
            "evidence": evidence,
            "ref_equipment": ref_equip or [],
        })

    # 1. Thay thu cong bang may: manual + ton thoi gian + co cong doan tuong tu da dung may
    for f in feats:
        if f["equip"]:
            continue
        sims = similar_equipped(f)
        if not sims:
            continue
        best_eq = sorted({e for _, g in sims for e in g["equip"]})[:3]
        score = f["avg"] * f["n"] * (1 + f["var"])
        ev = (f"TB {fmt_sec(f['avg'])}/lần × {f['n']} mã hàng, làm thủ công. "
              f"Công đoạn tương tự đã dùng máy: " +
              "; ".join(f"“{g['ten'][:40]}” ({g['brand']})" for _, g in sims[:2]))
        add("THAY_THU_CONG", "Thay thủ công bằng máy", f, score,
            f"Trang bị {', '.join(best_eq)} cho công đoạn này", ev, best_eq)

    # 2. Chuan hoa dung cu: cung cong doan dung nhieu loai dung cu khac nhau
    by_name = defaultdict(list)
    for f in feats:
        by_name[norm(f["ten"])].append(f)
    for name, group in by_name.items():
        all_eq = set()
        for g in group:
            all_eq.update(g["equip"])
        if len(all_eq) >= 3 and len(group) >= 2:
            cnt = defaultdict(int)
            for g in group:
                for e in g["equip"]:
                    cnt[e] += 1
            top_eq = max(cnt, key=cnt.get)
            f0 = max(group, key=lambda x: x["avg"])
            score = f0["avg"] * len(group) * 0.5
            add("CHUAN_HOA_DUNG_CU", "Chuẩn hóa dụng cụ", f0, score,
                f"Chuẩn hóa về “{top_eq}” cho mọi mã hàng",
                f"“{f0['ten'][:40]}” đang dùng {len(all_eq)} loại dụng cụ khác nhau: " +
                ", ".join(sorted(all_eq)[:5]), [top_eq])

    # 3. Giam nguoi: nhieu lao dong
    for f in sorted(feats, key=lambda x: -x["workers"])[:12]:
        if f["workers"] >= 3:
            score = f["workers"] * f["avg"] * 0.3
            add("GIAM_NGUOI", "Giảm lao động", f, score,
                "Xem xét jig/gá định vị hoặc bán tự động để giảm người thao tác",
                f"Tổng {f['workers']:.1f} người/lần × {f['n']} mã hàng, TB {fmt_sec(f['avg'])}/lần")

    # 4. Chuan hoa thoi gian: bien dong lon
    for f in sorted([x for x in feats if x["n"] >= 3], key=lambda x: -x["var"])[:10]:
        if f["var"] > 0.5:
            score = f["var"] * f["avg"] * 0.4
            add("CHUAN_HOA_THOI_GIAN", "Chuẩn hóa thời gian", f, score,
                "Rà soát thao tác giữa các mã hàng, chuẩn hóa định mức",
                f"Chênh lệch {f['var']*100:.0f}% giữa các mã hàng " +
                f"({fmt_sec(f['mn'])} – {fmt_sec(f['mx'])})")

    # 5. Bat thuong: thoi gian cao bat thuong so voi nhom tuong tu
    for f in feats:
        sims = [g for _, g in similar_equipped(f, top=10)]
        if len(sims) >= 3:
            med = sorted(g["avg"] for g in sims)[len(sims) // 2]
            if med > 0 and f["avg"] > 2.5 * med:
                score = f["avg"] * 0.6
                add("BAT_THUONG", "Bất thường cần audit", f, score,
                    "Audit trực tiếp thao tác — thời gian vượt xa các công đoạn tương tự",
                    f"{fmt_sec(f['avg'])}/lần, gấp {f['avg']/med:.1f} lần trung vị nhóm tương tự")

    recs.sort(key=lambda r: -r["score"])
    for i, r in enumerate(recs, 1):
        r["rank"] = i

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "engine": "kaizen-neural-v1",
        "stats": {
            "n_cong_doan": len(feats),
            "n_manual": sum(1 for f in feats if not f["equip"]),
            "n_recommendations": len(recs),
            "equipment_kb_tokens": len(kb),
        },
        "top_equipment": sorted(
            {e for f in feats for e in f["equip"]},
        )[:40],
        "recommendations": recs[:120],
    }
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"kaizen: {len(feats)} cong doan, {len(recs)} recommendations -> {OUT}")


if __name__ == "__main__":
    main()
