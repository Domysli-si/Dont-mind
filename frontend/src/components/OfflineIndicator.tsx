import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OfflineIndicator() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-fade-in lg:top-20 print:hidden">
      <div className="flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-dark shadow-lg">
        <WifiOff className="h-4 w-4" />
        {t("offline.label")}
      </div>
    </div>
  );
}
