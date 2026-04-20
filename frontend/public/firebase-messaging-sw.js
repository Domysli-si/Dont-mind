/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG__?.apiKey,
  authDomain: self.__FIREBASE_CONFIG__?.authDomain,
  projectId: self.__FIREBASE_CONFIG__?.projectId,
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId,
  appId: self.__FIREBASE_CONFIG__?.appId,
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "dont-worry";
  const options = {
    body: payload.notification?.body || "Cas zaznamenat svou naladu!",
    icon: "/pwa-192x192.png",
    badge: "/favicon.svg",
  };
  self.registration.showNotification(title, options);
});
