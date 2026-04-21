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

interface JournalEntry {
  id: number;
  user_id: string;
  content: string;
  sentiment: string | null;
  created_at: string;
}

function localSentiment(text: string): string {
  const lower = text.toLowerCase();
  const pos = [
    "happy", "good", "great", "love", "amazing", "wonderful", "excited",
    "dobre", "skvele", "radost", "super", "uzasne", "krasne", "stastny",
    "spokojen", "prijemn", "vesely", "pohoda", "luxus",
  ];
  const neg = [
    "sad", "bad", "terrible", "hate", "awful", "angry", "depressed",
    "spatne", "hrozne", "smutny", "nanic", "stres", "unaveny", "otravn",
    "nasrany", "zklamany", "bolest", "tezke", "nestastny",
  ];

  let score = 0;
  for (const w of pos) if (lower.includes(w)) score++;
  for (const w of neg) if (lower.includes(w)) score--;

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export default function JournalPage() {
  const { t } = useTranslation();
  const { user, isDemo } = useAuth();

  const sentimentLabels: Record<string, { text: string; color: string }> = {
    positive: { text: t("journal.positive"), color: "text-brand-teal" },
    neutral: { text: t("journal.neutral"), color: "text-brand-yellow" },
    negative: { text: t("journal.negative"), color: "text-brand-coral" },
  };
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const loadLocal = async () => {
    const local = await db.journals
      .where("userId")
      .equals(user!.id)
      .reverse()
      .sortBy("createdAt");
    setEntries(
      local.slice(0, 20).map((j) => ({
        id: j.id!,
        user_id: j.userId,
        content: j.content,
        sentiment: j.sentiment ?? null,
        created_at: j.createdAt,
      }))
    );
  };

  useEffect(() => {
    if (isDemo) {
      loadLocal();
    } else {
      api
        .get<JournalEntry[]>("/api/journal?limit=20")
        .then(setEntries)
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);

    const now = new Date().toISOString();

    try {
      if (isDemo) {
        const sentiment = localSentiment(content);
        await db.journals.add({
          userId: user!.id,
          content,
          sentiment,
          createdAt: now,
          synced: false,
        });
        await loadLocal();
      } else if (navigator.onLine) {
        const created = await api.post<JournalEntry>("/api/journal", {
          content,
        });
        await db.journals.add({
          serverId: created.id,
          userId: user!.id,
          content,
          sentiment: created.sentiment ?? undefined,
          createdAt: created.created_at,
          synced: true,
        });
        setEntries((prev) => [created, ...prev]);
      } else {
        await db.journals.add({
          userId: user!.id,
          content,
          createdAt: now,
          synced: false,
        });
      }

      setContent("");
    } catch {
      await db.journals.add({
        userId: user!.id,
        content,
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
        <h2>{t("journal.title")}</h2>
        <p className="text-muted-foreground">
          {t("journal.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("journal.newEntry")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={t("journal.placeholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || saving}
            >
              {saving ? t("journal.saving") : t("journal.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("journal.entries")}</h3>
          {entries.map((entry) => {
            const label = entry.sentiment
              ? sentimentLabels[entry.sentiment]
              : null;

            return (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm leading-relaxed flex-1">
                      {entry.content}
                    </p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString(
                          "cs-CZ",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                      {label && (
                        <span
                          className={`text-xs font-medium ${label.color}`}
                        >
                          {label.text}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
