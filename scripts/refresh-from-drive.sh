#!/bin/bash
# Refresh pipeline: quet Drive PFC2026 -> rebuild du lieu web -> build -> commit -> push.
# Chay thu cong hoac qua cron drive-pfc2026-watch (30 phut/lan).
# Khong pipe output qua head/tail khi goi script nay (can giu exit code).
set -u
DW=/home/hatch/workspace/drive-watch
WEB=/home/hatch/workspace/pfc-web
VPY="$DW/venv/bin/python"

echo "=== [1/5] Quet Drive PFC2026 ==="
OUT=$("$VPY" "$DW/watch.py" 2>&1)
echo "$OUT"
case "$OUT" in
  *NO_NEW_FILES*)
    echo "WEB_REFRESH: khong co file moi, ket thuc."
    exit 0
    ;;
  *LIST_ERROR*)
    echo "WEB_REFRESH: loi liet ke Drive, dung lai."
    exit 1
    ;;
esac

echo "=== [2/5] Build index + anh (build-data.py) ==="
"$VPY" "$WEB/scripts/build-data.py" || { echo "WEB_REFRESH: build-data.py THAT BAI"; exit 1; }

echo "=== [3/5] Trich xuat cong doan (extract-stages.py) ==="
"$VPY" "$WEB/scripts/extract-stages.py" || { echo "WEB_REFRESH: extract-stages.py THAT BAI"; exit 1; }

"$VPY" -c "
import json, datetime
meta = {'last_sync': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'drive-pfc2026'}
json.dump(meta, open('$WEB/public/data/sync.json', 'w'), ensure_ascii=False)
print('sync.json:', meta)
"

echo "=== [4/5] npm run build ==="
cd "$WEB" && npm run build || { echo "WEB_REFRESH: npm build THAT BAI"; exit 1; }

echo "=== [5/5] Commit + push ==="
git add -A
git commit -m "Auto-refresh: du lieu moi tu Drive PFC2026 ($(date -u +%Y-%m-%d))" || true
git push origin main || { echo "WEB_REFRESH: push THAT BAI"; exit 1; }

echo "WEB_REFRESH: OK - da day len main, Vercel tu deploy."
