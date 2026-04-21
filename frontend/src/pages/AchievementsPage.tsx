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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

function buildAchievements(
  t: (key: string) => string,
  moodCount: number,
  journalCount: number,
  streak: number,
  uniqueDays: number,
  avgMood: number
): Achievement[] {
  return [
    {
      id: "first_mood",
      title: t("achievements.firstStep"),
      description: t("achievements.firstStepDesc"),
      icon: "1",
      unlocked: moodCount >= 1,
      progress: Math.min(moodCount, 1),
      target: 1,
    },
    {
      id: "mood_10",
      title: t("achievements.regularTracker"),
      description: t("achievements.regularTrackerDesc"),
      icon: "10",
      unlocked: moodCount >= 10,
      progress: Math.min(moodCount, 10),
      target: 10,
    },
    {
      id: "mood_50",
      title: t("achievements.dedicated"),
      description: t("achievements.dedicatedDesc"),
      icon: "50",
      unlocked: moodCount >= 50,
      progress: Math.min(moodCount, 50),
      target: 50,
    },
    {
      id: "mood_100",
      title: t("achievements.centurion"),
      description: t("achievements.centurionDesc"),
      icon: "C",
      unlocked: moodCount >= 100,
      progress: Math.min(moodCount, 100),
      target: 100,
    },
    {
      id: "first_journal",
      title: t("achievements.writer"),
      description: t("achievements.writerDesc"),
      icon: "P",
      unlocked: journalCount >= 1,
      progress: Math.min(journalCount, 1),
      target: 1,
    },
    {
      id: "journal_10",
      title: t("achievements.author"),
      description: t("achievements.authorDesc"),
      icon: "A",
      unlocked: journalCount >= 10,
      progress: Math.min(journalCount, 10),
      target: 10,
    },
    {
      id: "journal_30",
      title: t("achievements.chronicler"),
      description: t("achievements.chroniclerDesc"),
      icon: "K",
      unlocked: journalCount >= 30,
      progress: Math.min(journalCount, 30),
      target: 30,
    },
    {
      id: "streak_3",
      title: t("achievements.onTrack"),
      description: t("achievements.onTrackDesc"),
      icon: "3",
      unlocked: streak >= 3,
      progress: Math.min(streak, 3),
      target: 3,
    },
    {
      id: "streak_7",
      title: t("achievements.weekWarrior"),
      description: t("achievements.weekWarriorDesc"),
      icon: "7",
      unlocked: streak >= 7,
      progress: Math.min(streak, 7),
      target: 7,
    },
    {
      id: "streak_30",
      title: t("achievements.monthMaster"),
      description: t("achievements.monthMasterDesc"),
      icon: "30",
      unlocked: streak >= 30,
      progress: Math.min(streak, 30),
      target: 30,
    },
    {
      id: "days_7",
      title: t("achievements.weekWith"),
      description: t("achievements.weekWithDesc"),
      icon: "T",
      unlocked: uniqueDays >= 7,
      progress: Math.min(uniqueDays, 7),
      target: 7,
    },
    {
      id: "days_30",
      title: t("achievements.monthWith"),
      description: t("achievements.monthWithDesc"),
      icon: "M",
      unlocked: uniqueDays >= 30,
      progress: Math.min(uniqueDays, 30),
      target: 30,
    },
    {
      id: "high_mood",
      title: t("achievements.optimist"),
      description: t("achievements.optimistDesc"),
      icon: "O",
      unlocked: avgMood >= 8 && moodCount >= 5,
      progress: moodCount >= 5 ? Math.min(Math.round(avgMood * 10) / 10, 10) : 0,
      target: 8,
    },
    {
      id: "both_features",
      title: t("achievements.versatile"),
      description: t("achievements.versatileDesc"),
      icon: "V",
      unlocked: moodCount >= 1 && journalCount >= 1,
      progress: (moodCount >= 1 ? 1 : 0) + (journalCount >= 1 ? 1 : 0),
      target: 2,
    },
  ];
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const moods = await db.moods
      .where("userId")
      .equals(user!.id)
      .toArray();
    const journals = await db.journals
      .where("userId")
      .equals(user!.id)
      .toArray();

    const moodDates = moods.map((m) => m.createdAt);
    const journalDates = journals.map((j) => j.createdAt);
    const allDates = [...moodDates, ...journalDates];

    const streak = calculateStreak(moodDates);
    const uniqueDays = new Set(allDates.map((d) => d.slice(0, 10))).size;
    const avgMood =
      moods.length > 0
        ? moods.reduce((sum, m) => sum + m.value, 0) / moods.length
        : 0;

    const list = buildAchievements(
      t,
      moods.length,
      journals.length,
      streak,
      uniqueDays,
      avgMood
    );

    setAchievements(list);
    setPoints(list.filter((a) => a.unlocked).length * 100);
  };

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6 pb-20 md:pb-0 lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("achievements.title")}</h2>
        <p className="text-muted-foreground">
          {t("achievements.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("achievements.totalScore")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{points}</span>
            <span className="text-muted-foreground">{t("achievements.points")}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {unlocked.length} {t("achievements.of")} {achievements.length} {t("achievements.unlocked")}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {unlocked.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">{t("achievements.unlockedSection")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {unlocked.map((a) => (
              <Card key={a.id} className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {a.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <CardDescription>{a.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">{t("achievements.lockedSection")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {locked.map((a) => (
              <Card key={a.id} className="opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
                      {a.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <CardDescription>{a.description}</CardDescription>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-muted-foreground/40 transition-all"
                          style={{
                            width: `${(a.progress / a.target) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.progress} / {a.target}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
