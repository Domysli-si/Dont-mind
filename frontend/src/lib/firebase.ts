import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;

try {
  app = initializeApp(firebaseConfig);
} catch {
  // Firebase not configured — running in demo/local mode
}

let messaging: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messaging && app && typeof window !== "undefined" && "Notification" in window) {
    try {
      messaging = getMessaging(app);
    } catch {
      // FCM not available
    }
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const msg = getMessagingInstance();
    if (!msg) return null;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const token = await getToken(msg, { vapidKey });
    return token;
  } catch {
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  const msg = getMessagingInstance();
  if (!msg) return;
  onMessage(msg, callback);
}
