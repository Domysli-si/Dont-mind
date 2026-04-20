import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { db } from "../db";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";

interface JournalEntry {
  id: number;
  user_id: string;
  content: string;
  sentiment: string | null;
  created_at: string;
}

const sentimentLabels: Record<string, { text: string; color: string }> = {
  positive: { text: "Pozitivni", color: "text-green-600 dark:text-green-400" },
  neutral: { text: "Neutralni", color: "text-yellow-600 dark:text-yellow-400" },
  negative: { text: "Negativni", color: "text-red-600 dark:text-red-400" },
};

export default function JournalPage() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    api
      .get<JournalEntry[]>("/api/journal?limit=20")
      .then(setEntries)
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);

    const now = new Date().toISOString();

    try {
      if (navigator.onLine) {
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
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Denik</h2>
        <p className="text-muted-foreground">
          Zapiste si sve myslenky a pocity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novy zaznam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Napiste, co mate na mysli..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || saving}
            >
              {saving ? "Ukladam..." : "Ulozit zaznam"}
            </Button>
            {!navigator.onLine && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                Offline rezim — bude synchronizovano pozdeji
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Zaznamy</h3>
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
                        {new Date(entry.created_at).toLocaleDateString("cs-CZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {label && (
                        <span className={`text-xs font-medium ${label.color}`}>
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
