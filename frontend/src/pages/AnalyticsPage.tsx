import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
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

interface MoodEntry {
  id: number;
  value: number;
  created_at: string;
}

const directionLabels: Record<string, string> = {
  improving: "Zlepsujici se",
  stable: "Stabilni",
  declining: "Klesajici",
};

export default function AnalyticsPage() {
  const [moodTrend, setMoodTrend] = useState<MoodTrendData | null>(null);
  const [sentimentTrend, setSentimentTrend] = useState<SentimentPoint[]>([]);
  const [correlation, setCorrelation] = useState<CorrelationPoint[]>([]);
  const [distribution, setDistribution] = useState<
    { value: number; count: number }[]
  >([]);

  useEffect(() => {
    api.get<MoodTrendData>("/api/analytics/mood-trend").then(setMoodTrend).catch(() => {});
    api.get<SentimentPoint[]>("/api/analytics/sentiment-trend").then(setSentimentTrend).catch(() => {});
    api.get<CorrelationPoint[]>("/api/analytics/correlation").then(setCorrelation).catch(() => {});

    api.get<MoodEntry[]>("/api/moods?limit=200").then((moods) => {
      const counts = new Map<number, number>();
      for (let i = 1; i <= 10; i++) counts.set(i, 0);
      moods.forEach((m) => counts.set(m.value, (counts.get(m.value) || 0) + 1));
      setDistribution(
        Array.from(counts.entries()).map(([value, count]) => ({ value, count }))
      );
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytika</h2>
        <p className="text-muted-foreground">
          Vizualizace vasich dat o nalade a sentimentu.
        </p>
      </div>

      {/* Mood over time */}
      <Card>
        <CardHeader>
          <CardTitle>Nalada v case</CardTitle>
          {moodTrend && (
            <p className="text-sm text-muted-foreground">
              Trend: {directionLabels[moodTrend.direction] || moodTrend.direction}
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
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Prumerna nalada"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Zatim nejsou k dispozici zadna data.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mood distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rozlozeni nalady</CardTitle>
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
                  fill="hsl(221, 83%, 53%)"
                  radius={[4, 4, 0, 0]}
                  name="Pocet"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Zadna data k zobrazeni.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sentiment trend */}
      <Card>
        <CardHeader>
          <CardTitle>Trend sentimentu</CardTitle>
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
                <Bar dataKey="positive" fill="#22c55e" name="Pozitivni" stackId="stack" />
                <Bar dataKey="neutral" fill="#eab308" name="Neutralni" stackId="stack" />
                <Bar dataKey="negative" fill="#ef4444" name="Negativni" stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Zadna data k zobrazeni.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mood vs Sentiment correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Korelace nalady a sentimentu</CardTitle>
        </CardHeader>
        <CardContent>
          {correlation.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="mood_value"
                  domain={[1, 10]}
                  name="Nalada"
                  label={{ value: "Nalada", position: "bottom" }}
                />
                <YAxis
                  dataKey="sentiment_score"
                  domain={[-1, 1]}
                  name="Sentiment"
                  label={{
                    value: "Sentiment",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  data={correlation}
                  fill="hsl(221, 83%, 53%)"
                  name="Korelace"
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Zadna data k zobrazeni.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
