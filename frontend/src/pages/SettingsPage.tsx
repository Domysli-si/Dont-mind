import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { requestNotificationPermission } from "../lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

interface Preferences {
  user_id: string;
  theme: string;
  notifications_enabled: boolean;
  show_onboarding: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    api
      .get<Preferences>("/api/user/preferences")
      .then((data) => {
        setPrefs(data);
        setNotificationsEnabled(data.notifications_enabled);
        setShowOnboarding(data.show_onboarding);
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme as "light" | "dark" | "system");
        }
      })
      .catch(() => {});
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    const t = newTheme as "light" | "dark" | "system";
    setTheme(t);
    await savePrefs({ theme: t });
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);

    if (enabled) {
      const token = await requestNotificationPermission();
      if (!token) {
        setNotificationsEnabled(false);
        return;
      }
    }

    await savePrefs({ notifications_enabled: enabled });
  };

  const handleOnboardingChange = async (show: boolean) => {
    setShowOnboarding(show);
    await savePrefs({ show_onboarding: show });
  };

  const savePrefs = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await api.put<Preferences>(
        "/api/user/preferences",
        updates
      );
      setPrefs(updated);
    } catch {
      console.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nastaveni</h2>
        <p className="text-muted-foreground">
          Spravujte sve preference a nastaveni aplikace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vzhled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Motiv</Label>
            <Select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-40"
            >
              <option value="light">Svetly</option>
              <option value="dark">Tmavy</option>
              <option value="system">Systemovy</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upozorneni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Denni pripominka nalady</Label>
              <p className="text-sm text-muted-foreground">
                Pripomenuti zaznamenat naladu kazdý den.
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
          <CardTitle>Dalsi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Uvodni pruvodce</Label>
              <p className="text-sm text-muted-foreground">
                Zobrazit uvodni pruvodce pri dalsim prihlaseni.
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
        <p className="text-sm text-muted-foreground">Ukladam...</p>
      )}
    </div>
  );
}
