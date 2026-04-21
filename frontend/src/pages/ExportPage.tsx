import { useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../db";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

interface ExportData {
  period: string;
  moodCount: number;
  journalCount: number;
  avgMood: number;
  moodMin: number;
  moodMax: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  dailyMoods: { date: string; avg: number; count: number }[];
  journalEntries: { date: string; content: string; sentiment: string }[];
}

export default function ExportPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [range, setRange] = useState("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(false);

  const getDateRange = (): { from: Date; to: Date; label: string } => {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (range === "custom" && customFrom && customTo) {
      return {
        from: new Date(customFrom),
        to: new Date(customTo + "T23:59:59"),
        label: `${customFrom} - ${customTo}`,
      };
    }

    const days: Record<string, number> = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };
    const labels: Record<string, string> = {
      week: t("export.lastWeek"),
      month: t("export.lastMonth"),
      quarter: t("export.lastQuarter"),
      year: t("export.lastYear"),
    };

    const d = days[range] || 7;
    const from = new Date(now.getTime() - d * 86400000);
    return { from, to, label: labels[range] || range };
  };

  const generateReport = async () => {
    setLoading(true);
    const { from, to, label } = getDateRange();

    const allMoods = await db.moods
      .where("userId")
      .equals(user!.id)
      .toArray();
    const allJournals = await db.journals
      .where("userId")
      .equals(user!.id)
      .toArray();

    const moods = allMoods.filter((m) => {
      const d = new Date(m.createdAt);
      return d >= from && d <= to;
    });
    const journals = allJournals.filter((j) => {
      const d = new Date(j.createdAt);
      return d >= from && d <= to;
    });

    const values = moods.map((m) => m.value);
    const avgMood =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    journals.forEach((j) => {
      const s = (j.sentiment || "neutral") as keyof typeof sentimentBreakdown;
      if (s in sentimentBreakdown) sentimentBreakdown[s]++;
    });

    const dailyMap = new Map<string, number[]>();
    moods.forEach((m) => {
      const day = m.createdAt.slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, []);
      dailyMap.get(day)!.push(m.value);
    });

    const dailyMoods = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        count: vals.length,
      }));

    const journalEntries = journals
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((j) => ({
        date: j.createdAt.slice(0, 10),
        content: j.content.length > 200 ? j.content.slice(0, 200) + "..." : j.content,
        sentiment: j.sentiment || "neutral",
      }));

    setData({
      period: label,
      moodCount: moods.length,
      journalCount: journals.length,
      avgMood,
      moodMin: values.length > 0 ? Math.min(...values) : 0,
      moodMax: values.length > 0 ? Math.max(...values) : 0,
      sentimentBreakdown,
      dailyMoods,
      journalEntries,
    });

    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const sentimentCz: Record<string, string> = {
    positive: t("export.positive"),
    neutral: t("export.neutral"),
    negative: t("export.negative"),
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-3xl lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("export.title")}</h2>
        <p className="text-muted-foreground">
          {t("export.subtitle")}
        </p>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>{t("export.choosePeriod")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <Label>{t("export.period")}</Label>
              <Select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-48"
              >
                <option value="week">{t("export.lastWeek")}</option>
                <option value="month">{t("export.lastMonth")}</option>
                <option value="quarter">{t("export.lastQuarter")}</option>
                <option value="year">{t("export.lastYear")}</option>
                <option value="custom">{t("export.customRange")}</option>
              </Select>
            </div>

            {range === "custom" && (
              <>
                <div className="space-y-1">
                  <Label>{t("export.from")}</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("export.to")}</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-44"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? t("export.generating") : t("export.generate")}
            </Button>
            {data && (
              <Button variant="outline" onClick={handlePrint}>
                {t("export.print")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6 print:space-y-4" id="printable-report">
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-2xl font-bold">{t("export.summaryTitle")}</h1>
            <p className="text-muted-foreground">{data.period}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("export.overviewFor")}: {data.period}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("export.moodEntries")}</p>
                  <p className="text-2xl font-bold">{data.moodCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("export.avgMood")}</p>
                  <p className="text-2xl font-bold">{data.avgMood || "--"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("export.moodRange")}</p>
                  <p className="text-2xl font-bold">
                    {data.moodCount > 0 ? `${data.moodMin}-${data.moodMax}` : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("export.journalEntries")}</p>
                  <p className="text-2xl font-bold">{data.journalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("export.journalSentiment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-brand-teal">{t("export.positive")}</p>
                  <p className="text-xl font-bold">{data.sentimentBreakdown.positive}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-yellow">{t("export.neutral")}</p>
                  <p className="text-xl font-bold">{data.sentimentBreakdown.neutral}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-coral">{t("export.negative")}</p>
                  <p className="text-xl font-bold">{data.sentimentBreakdown.negative}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.dailyMoods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("export.dailyMoodOverview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">{t("export.date")}</th>
                        <th className="text-left py-2 pr-4">{t("export.avgMoodCol")}</th>
                        <th className="text-left py-2">{t("export.entryCount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dailyMoods.map((d) => (
                        <tr key={d.date} className="border-b border-border/50">
                          <td className="py-2 pr-4">
                            {new Date(d.date).toLocaleDateString("cs-CZ")}
                          </td>
                          <td className="py-2 pr-4 font-medium">{d.avg}/10</td>
                          <td className="py-2">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {data.journalEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("export.journalEntriesTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.journalEntries.map((e, i) => (
                    <div key={i} className="border-b border-border/50 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.date).toLocaleDateString("cs-CZ")}
                        </span>
                        <span className="text-xs font-medium">
                          {sentimentCz[e.sentiment] || e.sentiment}
                        </span>
                      </div>
                      <p className="text-sm">{e.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
