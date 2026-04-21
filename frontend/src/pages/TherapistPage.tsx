import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../db";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Stats {
  totalMoods: number;
  totalJournals: number;
  avgMood: number;
  streak: number;
  longestStreak: number;
  weeklyAvg: { week: string; avg: number }[];
  sentimentOverTime: {
    week: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
  moodDistribution: { value: number; count: number }[];
  recentLowMoods: { date: string; value: number; note: string }[];
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return start.toISOString().slice(0, 10);
}

function calculateStreaks(dates: string[]): {
  current: number;
  longest: number;
} {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = [...new Set(dates.map((d) => d.slice(0, 10)))]
    .sort()
    .reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) {
        current++;
      } else break;
    }
  }

  const sorted = [...uniqueDays].sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    if (Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return { current, longest };
}

export default function TherapistPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const moods = await db.moods
      .where("userId")
      .equals(user!.id)
      .sortBy("createdAt");
    const journals = await db.journals
      .where("userId")
      .equals(user!.id)
      .sortBy("createdAt");

    const values = moods.map((m) => m.value);
    const avgMood =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;

    const moodDates = moods.map((m) => m.createdAt);
    const { current, longest } = calculateStreaks(moodDates);

    // Weekly averages
    const weeklyMap = new Map<string, number[]>();
    moods.forEach((m) => {
      const w = getWeekLabel(m.createdAt);
      if (!weeklyMap.has(w)) weeklyMap.set(w, []);
      weeklyMap.get(w)!.push(m.value);
    });
    const weeklyAvg = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, vals]) => ({
        week,
        avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      }));

    // Sentiment over time
    const sentWeekMap = new Map<
      string,
      { positive: number; neutral: number; negative: number }
    >();
    journals.forEach((j) => {
      const w = getWeekLabel(j.createdAt);
      if (!sentWeekMap.has(w))
        sentWeekMap.set(w, { positive: 0, neutral: 0, negative: 0 });
      const s = (j.sentiment || "neutral") as "positive" | "neutral" | "negative";
      if (s in sentWeekMap.get(w)!) sentWeekMap.get(w)![s]++;
    });
    const sentimentOverTime = Array.from(sentWeekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, c]) => ({ week, ...c }));

    // Distribution
    const distMap = new Map<number, number>();
    for (let i = 1; i <= 10; i++) distMap.set(i, 0);
    moods.forEach((m) => distMap.set(m.value, (distMap.get(m.value) || 0) + 1));
    const moodDistribution = Array.from(distMap.entries()).map(
      ([value, count]) => ({ value, count })
    );

    // Recent low moods (<=3)
    const recentLowMoods = moods
      .filter((m) => m.value <= 3)
      .slice(-10)
      .reverse()
      .map((m) => ({
        date: m.createdAt.slice(0, 10),
        value: m.value,
        note: m.note || "--",
      }));

    setStats({
      totalMoods: moods.length,
      totalJournals: journals.length,
      avgMood,
      streak: current,
      longestStreak: longest,
      weeklyAvg,
      sentimentOverTime,
      moodDistribution,
      recentLowMoods,
    });
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 lg:space-y-8 animate-fade-in">
      <div>
        <h2>
          {t("therapist.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("therapist.subtitle")}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("therapist.totalMoodEntries")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalMoods}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("therapist.avgMood")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.avgMood || "--"}/10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("therapist.currentStreak")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.streak} {t("therapist.days")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("therapist.longestStreak")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.longestStreak} {t("therapist.days")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly mood trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t("therapist.weeklyMoodAvg")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.weeklyAvg.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.weeklyAvg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[1, 10]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#2a9d8f"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t("therapist.average")}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("therapist.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sentiment weekly */}
      <Card>
        <CardHeader>
          <CardTitle>{t("therapist.weeklySentiment")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.sentimentOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.sentimentOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="positive"
                  fill="#2a9d8f"
                  name={t("therapist.positive")}
                  stackId="s"
                />
                <Bar
                  dataKey="neutral"
                  fill="#e9c46a"
                  name={t("therapist.neutral")}
                  stackId="s"
                />
                <Bar
                  dataKey="negative"
                  fill="#e76f51"
                  name={t("therapist.negative")}
                  stackId="s"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("therapist.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mood distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t("therapist.moodDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.moodDistribution.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.moodDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="value" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#2a9d8f"
                  radius={[4, 4, 0, 0]}
                  name={t("therapist.count")}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("therapist.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Risk alerts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("therapist.lowMoodAlerts")}</CardTitle>
          <CardDescription>
            {t("therapist.lowMoodDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentLowMoods.length > 0 ? (
            <div className="space-y-2">
              {stats.recentLowMoods.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3"
                >
                  <div>
                    <span className="font-semibold text-destructive">
                      {m.value}/10
                    </span>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {m.note}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("therapist.noLowMoods")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
