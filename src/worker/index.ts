// Push notification handlers — injected into the next-pwa generated service worker

self.addEventListener("push", (event: any) => {
  if (!event.data) return;

  let data: any = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "EMS Notification", body: event.data.text() };
  }

  const title = data.title || "EMS System";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: { url: data.url || "/dashboard" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil((self as any).registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    (self as any).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: any[]) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) return client.focus();
        }
        if ((self as any).clients.openWindow) return (self as any).clients.openWindow(url);
      })
  );
});
