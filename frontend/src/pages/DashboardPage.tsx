import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Smile, BookOpen, BarChart3, TrendingUp } from "lucide-react";

interface MoodEntry {
  id: number;
  value: number;
  note: string | null;
  created_at: string;
}

interface TrendData {
  direction: string;
}

export default function DashboardPage() {
  const [lastMood, setLastMood] = useState<MoodEntry | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [journalCount, setJournalCount] = useState(0);

  useEffect(() => {
    api
      .get<MoodEntry[]>("/api/moods?limit=1")
      .then((moods) => setLastMood(moods[0] ?? null))
      .catch(() => {});

    api
      .get<TrendData>("/api/analytics/mood-trend")
      .then(setTrend)
      .catch(() => {});

    api
      .get<{ id: number }[]>("/api/journal?limit=100")
      .then((entries) => setJournalCount(entries.length))
      .catch(() => {});
  }, []);

  const trendLabel: Record<string, string> = {
    improving: "Zlepsujici se",
    stable: "Stabilni",
    declining: "Klesajici",
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Prehled</h2>
        <p className="text-muted-foreground">
          Vitejte zpet. Zde je souhrn vasi pohody.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/mood">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Posledni nalada
              </CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {lastMood ? `${lastMood.value}/10` : "--"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lastMood
                  ? new Date(lastMood.created_at).toLocaleDateString("cs-CZ")
                  : "Zadny zaznam"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trend nalady</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {trend ? trendLabel[trend.direction] || trend.direction : "--"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Poslednich 14 dni
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/journal">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Zaznamy v deniku
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{journalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Celkem zaznamu
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Rychle akce
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/mood"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Zaznamenat naladu
            </Link>
            <Link
              to="/journal"
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Napsat do deniku
            </Link>
            <Link
              to="/analytics"
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Zobrazit analytiku
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
