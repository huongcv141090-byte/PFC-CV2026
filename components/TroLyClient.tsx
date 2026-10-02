"use client";

import { useEffect, useState } from "react";
import KaizenAiSettingsPanel, {
  loadSettings,
  type KaizenAiSettings,
} from "./KaizenAiSettings";
import TroLyChat from "./TroLyChat";

export default function TroLyClient() {
  const [settings, setSettings] = useState<KaizenAiSettings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  return (
    <div className="space-y-4">
      <KaizenAiSettingsPanel onSaved={setSettings} />
      <TroLyChat settings={settings} />
    </div>
  );
}
