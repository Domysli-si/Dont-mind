import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  Smile,
  BookOpen,
  BarChart3,
  TrendingUp,
  Flame,
  Trophy,
} from "lucide-react";

interface MoodEntry {
  id: number;
  value: number;
  note: string | null;
  created_at: string;
}

interface TrendData {
  direction: string;
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = [...new Set(dates.map((d) => d.slice(0, 10)))]
    .sort()
    .reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) {
      streak++;
    } else break;
  }
  return streak;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, isDemo } = useAuth();
  const [lastMood, setLastMood] = useState<MoodEntry | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [journalCount, setJournalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [achievementCount, setAchievementCount] = useState(0);
  const [totalAchievements] = useState(14);

  useEffect(() => {
    if (isDemo) {
      loadLocalData();
    } else {
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
    }
  }, []);

  const loadLocalData = async () => {
    const moods = await db.moods
      .where("userId")
      .equals(user!.id)
      .reverse()
      .sortBy("createdAt");

    if (moods.length > 0) {
      const m = moods[0];
      setLastMood({
        id: m.id!,
        value: m.value,
        note: m.note ?? null,
        created_at: m.createdAt,
      });
    }

    if (moods.length >= 3) {
      const recent = moods.slice(0, 14).map((m) => m.value);
      const first = recent.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const last = recent.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const diff = last - first;
      setTrend({
        direction:
          diff > 0.5 ? "improving" : diff < -0.5 ? "declining" : "stable",
      });
    } else {
      setTrend({ direction: "stable" });
    }

    const jCount = await db.journals
      .where("userId")
      .equals(user!.id)
      .count();
    setJournalCount(jCount);

    const moodDates = moods.map((m) => m.createdAt);
    setStreak(calculateStreak(moodDates));

    // Quick achievement count
    const moodCount = moods.length;
    const uniqueDays = new Set(
      [...moodDates, ...(await db.journals.where("userId").equals(user!.id).toArray()).map((j) => j.createdAt)].map((d) => d.slice(0, 10))
    ).size;
    const avgMood = moodCount > 0 ? moods.reduce((s, m) => s + m.value, 0) / moodCount : 0;

    let unlocked = 0;
    if (moodCount >= 1) unlocked++;
    if (moodCount >= 10) unlocked++;
    if (moodCount >= 50) unlocked++;
    if (moodCount >= 100) unlocked++;
    if (jCount >= 1) unlocked++;
    if (jCount >= 10) unlocked++;
    if (jCount >= 30) unlocked++;
    const s = calculateStreak(moodDates);
    if (s >= 3) unlocked++;
    if (s >= 7) unlocked++;
    if (s >= 30) unlocked++;
    if (uniqueDays >= 7) unlocked++;
    if (uniqueDays >= 30) unlocked++;
    if (avgMood >= 8 && moodCount >= 5) unlocked++;
    if (moodCount >= 1 && jCount >= 1) unlocked++;
    setAchievementCount(unlocked);
  };

  const trendLabel: Record<string, string> = {
    improving: t("dashboard.improving"),
    stable: t("dashboard.stable"),
    declining: t("dashboard.declining"),
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("dashboard.title")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link to="/mood">
          <Card className="cursor-pointer hover:border-brand-teal/50 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.lastMood")}
              </CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground transition-default group-hover:text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold lg:text-4xl">
                {lastMood ? `${lastMood.value}/10` : "--"}
              </div>
              <p className="text-caption text-muted-foreground mt-1">
                {lastMood
                  ? new Date(lastMood.created_at).toLocaleDateString("cs-CZ")
                  : t("dashboard.noRecord")}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="cursor-pointer hover:border-brand-teal/50 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.moodTrend")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground transition-default group-hover:text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold lg:text-4xl">
                {trend
                  ? trendLabel[trend.direction] || trend.direction
                  : "--"}
              </div>
              <p className="text-caption text-muted-foreground mt-1">
                {t("dashboard.last14days")}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/journal">
          <Card className="cursor-pointer hover:border-brand-teal/50 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.journalEntries")}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground transition-default group-hover:text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold lg:text-4xl">{journalCount}</div>
              <p className="text-caption text-muted-foreground mt-1">
                {t("dashboard.totalEntries")}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-brand-orange/30 bg-brand-orange/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.dailyStreak")}
            </CardTitle>
            <Flame className="h-4 w-4 text-brand-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-orange lg:text-4xl">
              {streak} {streak === 1 ? t("dashboard.day") : streak >= 2 && streak <= 4 ? t("dashboard.days2to4") : t("dashboard.days5plus")}
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              {streak === 0
                ? t("dashboard.streakStart")
                : t("dashboard.streakContinue")}
            </p>
          </CardContent>
        </Card>

        <Link to="/achievements">
          <Card className="cursor-pointer hover:border-brand-yellow/50 border-brand-yellow/30 bg-brand-yellow/5 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.achievements")}
              </CardTitle>
              <Trophy className="h-4 w-4 text-brand-yellow transition-default group-hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-yellow lg:text-4xl">
                {achievementCount}/{totalAchievements}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-brand-yellow transition-all"
                  style={{
                    width: `${(achievementCount / totalAchievements) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("dashboard.quickActions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/mood"
              className="rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-default hover:bg-brand-teal/90 hover:shadow-md active:scale-[0.98]"
            >
              {t("dashboard.recordMood")}
            </Link>
            <Link
              to="/journal"
              className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-default hover:bg-secondary/80 active:scale-[0.98]"
            >
              {t("dashboard.writeJournal")}
            </Link>
            <Link
              to="/analytics"
              className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-default hover:bg-secondary/80 active:scale-[0.98]"
            >
              {t("dashboard.viewAnalytics")}
            </Link>
            <Link
              to="/export"
              className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-default hover:bg-secondary/80 active:scale-[0.98]"
            >
              {t("dashboard.exportSummary")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
