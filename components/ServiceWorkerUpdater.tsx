"use client";

import { useEffect } from "react";

/**
 * Forces mobile PWAs and open browser tabs to check for Service Worker updates
 * when opened or brought back to foreground, and reloads once a new SW takes control.
 */
export function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let reloading = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const handleControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };

    const checkForUpdates = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (reg) => {
            if (reg.scope.includes("firebase-cloud-messaging-push-scope")) return;
            await reg.update();
          })
        );
      } catch {
        // Ignore transient network errors while offline
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdates();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void checkForUpdates();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
