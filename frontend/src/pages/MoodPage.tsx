import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { db } from "../db";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import MoodScale from "../components/MoodScale";

interface MoodEntry {
  id: number;
  user_id: string;
  value: number;
  note: string | null;
  created_at: string;
}

export default function MoodPage() {
  const { t } = useTranslation();
  const { user, isDemo } = useAuth();
  const [value, setValue] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<MoodEntry[]>([]);

  const loadLocal = async () => {
    const local = await db.moods
      .where("userId")
      .equals(user!.id)
      .reverse()
      .sortBy("createdAt");
    setHistory(
      local.slice(0, 10).map((m) => ({
        id: m.id!,
        user_id: m.userId,
        value: m.value,
        note: m.note ?? null,
        created_at: m.createdAt,
      }))
    );
  };

  useEffect(() => {
    if (isDemo) {
      loadLocal();
    } else {
      api
        .get<MoodEntry[]>("/api/moods?limit=10")
        .then(setHistory)
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async () => {
    if (!value) return;
    setSaving(true);
    setSuccess(false);

    const now = new Date().toISOString();

    try {
      if (isDemo) {
        await db.moods.add({
          userId: user!.id,
          value,
          note: note || undefined,
          createdAt: now,
          synced: false,
        });
        await loadLocal();
      } else if (navigator.onLine) {
        const created = await api.post<MoodEntry>("/api/moods", {
          value,
          note: note || null,
        });
        await db.moods.add({
          serverId: created.id,
          userId: user!.id,
          value,
          note: note || undefined,
          createdAt: created.created_at,
          synced: true,
        });
        setHistory((prev) => [created, ...prev]);
      } else {
        await db.moods.add({
          userId: user!.id,
          value,
          note: note || undefined,
          createdAt: now,
          synced: false,
        });
      }

      setValue(null);
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      await db.moods.add({
        userId: user!.id,
        value,
        note: note || undefined,
        createdAt: now,
        synced: false,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("mood.title")}</h2>
        <p className="text-muted-foreground">
          {t("mood.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("mood.record")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MoodScale value={value} onChange={setValue} />

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("mood.noteLabel")}</label>
            <Textarea
              placeholder={t("mood.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={!value || saving}>
              {saving ? t("mood.saving") : t("mood.save")}
            </Button>
            {success && (
              <span className="text-sm text-brand-teal font-medium">
                {t("mood.saved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("mood.recentEntries")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span className="text-lg font-semibold">
                      {entry.value}/10
                    </span>
                    {entry.note && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {entry.note}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
