import { useEffect, useState } from "react";
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
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";

interface MoodTrendPoint {
  date: string;
  average: number;
}

interface MoodTrendData {
  direction: string;
  data_points: MoodTrendPoint[];
}

interface SentimentPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface CorrelationPoint {
  date: string;
  mood_value: number;
  sentiment_score: number;
}

const sentimentToScore: Record<string, number> = {
  positive: 1,
  neutral: 0,
  negative: -1,
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { user, isDemo } = useAuth();

  const directionLabels: Record<string, string> = {
    improving: t("analytics.improving"),
    stable: t("analytics.stable"),
    declining: t("analytics.declining"),
  };
  const [moodTrend, setMoodTrend] = useState<MoodTrendData | null>(null);
  const [sentimentTrend, setSentimentTrend] = useState<SentimentPoint[]>([]);
  const [correlation, setCorrelation] = useState<CorrelationPoint[]>([]);
  const [distribution, setDistribution] = useState<
    { value: number; count: number }[]
  >([]);

  useEffect(() => {
    if (isDemo) {
      loadLocalAnalytics();
    } else {
      api
        .get<MoodTrendData>("/api/analytics/mood-trend")
        .then(setMoodTrend)
        .catch(() => {});
      api
        .get<SentimentPoint[]>("/api/analytics/sentiment-trend")
        .then(setSentimentTrend)
        .catch(() => {});
      api
        .get<CorrelationPoint[]>("/api/analytics/correlation")
        .then(setCorrelation)
        .catch(() => {});
      api
        .get<{ id: number; value: number }[]>("/api/moods?limit=200")
        .then((moods) => {
          const counts = new Map<number, number>();
          for (let i = 1; i <= 10; i++) counts.set(i, 0);
          moods.forEach((m) =>
            counts.set(m.value, (counts.get(m.value) || 0) + 1)
          );
          setDistribution(
            Array.from(counts.entries()).map(([value, count]) => ({
              value,
              count,
            }))
          );
        })
        .catch(() => {});
    }
  }, []);

  const loadLocalAnalytics = async () => {
    const moods = await db.moods
      .where("userId")
      .equals(user!.id)
      .sortBy("createdAt");

    const journals = await db.journals
      .where("userId")
      .equals(user!.id)
      .sortBy("createdAt");

    // Mood trend by day
    const dailyMoods = new Map<string, number[]>();
    moods.forEach((m) => {
      const day = m.createdAt.slice(0, 10);
      if (!dailyMoods.has(day)) dailyMoods.set(day, []);
      dailyMoods.get(day)!.push(m.value);
    });

    const trendPoints: MoodTrendPoint[] = Array.from(dailyMoods.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        average:
          Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) /
          10,
      }));

    let direction = "stable";
    if (trendPoints.length >= 3) {
      const avgs = trendPoints.map((p) => p.average);
      const first = avgs.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const last = avgs.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const diff = last - first;
      direction =
        diff > 0.5 ? "improving" : diff < -0.5 ? "declining" : "stable";
    }

    setMoodTrend({ direction, data_points: trendPoints });

    // Distribution
    const counts = new Map<number, number>();
    for (let i = 1; i <= 10; i++) counts.set(i, 0);
    moods.forEach((m) =>
      counts.set(m.value, (counts.get(m.value) || 0) + 1)
    );
    setDistribution(
      Array.from(counts.entries()).map(([value, count]) => ({ value, count }))
    );

    // Sentiment trend by day
    const dailySent = new Map<
      string,
      { positive: number; neutral: number; negative: number }
    >();
    journals.forEach((j) => {
      const day = j.createdAt.slice(0, 10);
      if (!dailySent.has(day))
        dailySent.set(day, { positive: 0, neutral: 0, negative: 0 });
      const s = (j.sentiment || "neutral") as keyof (typeof dailySent extends Map<string, infer V> ? V : never);
      if (s in dailySent.get(day)!) {
        dailySent.get(day)![s]++;
      }
    });

    setSentimentTrend(
      Array.from(dailySent.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, c]) => ({ date, ...c }))
    );

    // Correlation
    const corrPoints: CorrelationPoint[] = [];
    const dailyMoodAvg = new Map<string, number>();
    dailyMoods.forEach((vals, date) => {
      dailyMoodAvg.set(date, vals.reduce((a, b) => a + b, 0) / vals.length);
    });

    const dailySentAvg = new Map<string, number>();
    const journalsByDay = new Map<string, string[]>();
    journals.forEach((j) => {
      const day = j.createdAt.slice(0, 10);
      if (!journalsByDay.has(day)) journalsByDay.set(day, []);
      journalsByDay.get(day)!.push(j.sentiment || "neutral");
    });
    journalsByDay.forEach((sents, day) => {
      const avg =
        sents.reduce((a, s) => a + (sentimentToScore[s] || 0), 0) /
        sents.length;
      dailySentAvg.set(day, avg);
    });

    dailyMoodAvg.forEach((mood, date) => {
      if (dailySentAvg.has(date)) {
        corrPoints.push({
          date,
          mood_value: Math.round(mood * 10) / 10,
          sentiment_score: Math.round(dailySentAvg.get(date)! * 100) / 100,
        });
      }
    });

    setCorrelation(corrPoints.sort((a, b) => a.date.localeCompare(b.date)));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("analytics.title")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("analytics.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.moodOverTime")}</CardTitle>
          {moodTrend && (
            <p className="text-sm text-muted-foreground">
              {t("analytics.trend")}:{" "}
              {directionLabels[moodTrend.direction] || moodTrend.direction}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {moodTrend && moodTrend.data_points.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodTrend.data_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[1, 10]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#2a9d8f"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t("analytics.avgMood")}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("analytics.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.moodDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          {distribution.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="value" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#2a9d8f"
                  radius={[4, 4, 0, 0]}
                  name={t("analytics.count")}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("analytics.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.sentimentTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          {sentimentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="positive"
                  fill="#2a9d8f"
                  name={t("analytics.positive")}
                  stackId="stack"
                />
                <Bar
                  dataKey="neutral"
                  fill="#e9c46a"
                  name={t("analytics.neutral")}
                  stackId="stack"
                />
                <Bar
                  dataKey="negative"
                  fill="#e76f51"
                  name={t("analytics.negative")}
                  stackId="stack"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("analytics.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.correlation")}</CardTitle>
        </CardHeader>
        <CardContent>
          {correlation.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="mood_value"
                  domain={[1, 10]}
                  name={t("analytics.moodLabel")}
                  label={{ value: t("analytics.moodLabel"), position: "bottom" }}
                />
                <YAxis
                  dataKey="sentiment_score"
                  domain={[-1, 1]}
                  name={t("analytics.sentimentLabel")}
                  label={{
                    value: t("analytics.sentimentLabel"),
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  data={correlation}
                  fill="#f4a261"
                  name={t("analytics.correlation")}
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("analytics.noData")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
