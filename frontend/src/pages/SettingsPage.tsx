import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { requestNotificationPermission } from "../lib/firebase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Select } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

interface Preferences {
  user_id: string;
  theme: string;
  notifications_enabled: boolean;
  show_onboarding: boolean;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isDemo } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("notifications_enabled") === "true";
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const stored = localStorage.getItem("show_onboarding");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    if (!isDemo) {
      api
        .get<Preferences>("/api/user/preferences")
        .then((data) => {
          setNotificationsEnabled(data.notifications_enabled);
          setShowOnboarding(data.show_onboarding);
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme as "light" | "dark" | "system");
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    const val = newTheme as "light" | "dark" | "system";
    setTheme(val);
    if (!isDemo) await savePrefs({ theme: val });
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("notifications_enabled", String(enabled));

    if (enabled) {
      try {
        const token = await requestNotificationPermission();
        if (!token) {
          setNotificationsEnabled(false);
          localStorage.setItem("notifications_enabled", "false");
          return;
        }
      } catch {
        setNotificationsEnabled(false);
        localStorage.setItem("notifications_enabled", "false");
        return;
      }
    }

    if (!isDemo) await savePrefs({ notifications_enabled: enabled });
  };

  const handleOnboardingChange = async (show: boolean) => {
    setShowOnboarding(show);
    localStorage.setItem("show_onboarding", String(show));
    if (!isDemo) await savePrefs({ show_onboarding: show });
  };

  const savePrefs = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api.put<Preferences>("/api/user/preferences", updates);
    } catch {
      // silently fail in demo/offline
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl lg:space-y-8 animate-fade-in">
      <div>
        <h2>{t("settings.title")}</h2>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("settings.theme")}</Label>
            <Select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-40"
            >
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.dark")}</option>
              <option value="system">{t("settings.system")}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("settings.language")}</Label>
            <Select
              value={i18n.language}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                localStorage.setItem("language", e.target.value);
              }}
              className="w-40"
            >
              <option value="cs">Čeština</option>
              <option value="en">English</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.dailyReminder")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.dailyReminderDesc")}
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.other")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.onboarding")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.onboardingDesc")}
              </p>
            </div>
            <Switch
              checked={showOnboarding}
              onCheckedChange={handleOnboardingChange}
            />
          </div>
        </CardContent>
      </Card>

      {saving && (
        <p className="text-sm text-muted-foreground">{t("settings.saving")}</p>
      )}
    </div>
  );
}
