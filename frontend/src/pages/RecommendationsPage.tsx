import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../db";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Lightbulb, Heart, Brain, Dumbbell, Moon, Users } from "lucide-react";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  tags: string[];
  icon: string;
}

const ICON_MAP: Record<string, typeof Lightbulb> = {
  mindfulness: Brain,
  exercise: Dumbbell,
  social: Users,
  sleep: Moon,
  gratitude: Heart,
  default: Lightbulb,
};

function getPersonalized(avgMood: number, sentiments: string[], recommendations: Recommendation[]): Recommendation[] {
  const negCount = sentiments.filter((s) => s === "negative").length;
  const total = sentiments.length || 1;
  const negRatio = negCount / total;

  let priorityTags: string[] = [];

  if (avgMood <= 4 || negRatio > 0.5) {
    priorityTags = ["mindfulness", "social", "gratitude"];
  } else if (avgMood <= 6) {
    priorityTags = ["exercise", "gratitude", "sleep"];
  } else {
    priorityTags = ["exercise", "social", "mindfulness"];
  }

  const scored = recommendations.map((rec) => {
    const tagScore = rec.tags.filter((t) => priorityTags.includes(t)).length;
    return { rec, score: tagScore };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.rec);
}

export default function RecommendationsPage() {
  const { isDemo } = useAuth();
  const { t } = useTranslation();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const LOCAL_RECOMMENDATIONS: Recommendation[] = [
    {
      id: 1,
      title: t("recommendations.breathing"),
      description: t("recommendations.breathingDesc"),
      tags: ["mindfulness", "stress"],
      icon: "mindfulness",
    },
    {
      id: 2,
      title: t("recommendations.walk"),
      description: t("recommendations.walkDesc"),
      tags: ["exercise", "nature"],
      icon: "exercise",
    },
    {
      id: 3,
      title: t("recommendations.gratitude"),
      description: t("recommendations.gratitudeDesc"),
      tags: ["gratitude"],
      icon: "gratitude",
    },
    {
      id: 4,
      title: t("recommendations.connect"),
      description: t("recommendations.connectDesc"),
      tags: ["social"],
      icon: "social",
    },
    {
      id: 5,
      title: t("recommendations.sleep"),
      description: t("recommendations.sleepDesc"),
      tags: ["sleep"],
      icon: "sleep",
    },
    {
      id: 6,
      title: t("recommendations.bodyscan"),
      description: t("recommendations.bodyscanDesc"),
      tags: ["mindfulness", "stress"],
      icon: "mindfulness",
    },
    {
      id: 7,
      title: t("recommendations.movement"),
      description: t("recommendations.movementDesc"),
      tags: ["exercise"],
      icon: "exercise",
    },
    {
      id: 8,
      title: t("recommendations.detox"),
      description: t("recommendations.detoxDesc"),
      tags: ["mindfulness"],
      icon: "mindfulness",
    },
  ];

  useEffect(() => {
    loadRecs();
  }, []);

  const loadRecs = async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const moods = await db.moods
      .where("createdAt")
      .aboveOrEqual(weekAgo.toISOString())
      .toArray();

    const journals = await db.journals
      .where("createdAt")
      .aboveOrEqual(weekAgo.toISOString())
      .toArray();

    const avgMood =
      moods.length > 0
        ? moods.reduce((a, m) => a + m.value, 0) / moods.length
        : 5;

    const sentiments = journals.map((j) => j.sentiment || "neutral");

    setRecs(getPersonalized(avgMood, sentiments, LOCAL_RECOMMENDATIONS));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("recommendations.title")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("recommendations.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((rec) => {
          const Icon = ICON_MAP[rec.icon] || ICON_MAP.default;
          return (
            <Card key={rec.id} className="group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal transition-default group-hover:bg-brand-teal/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{rec.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {rec.description}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rec.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-caption font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
