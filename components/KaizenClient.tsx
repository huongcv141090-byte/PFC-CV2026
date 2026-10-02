"use client";

import { useEffect, useState } from "react";
import type { KaizenRecommendation } from "@/lib/data-server";
import KaizenAiSettingsPanel, {
  loadSettings,
  type KaizenAiSettings,
} from "./KaizenAiSettings";
import KaizenList from "./KaizenList";

export default function KaizenClient({
  recs,
}: {
  recs: KaizenRecommendation[];
}) {
  const [settings, setSettings] = useState<KaizenAiSettings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  return (
    <div className="space-y-4">
      <KaizenAiSettingsPanel onSaved={setSettings} />
      <KaizenList recs={recs} aiSettings={settings} />
    </div>
  );
}
