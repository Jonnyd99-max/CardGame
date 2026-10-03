import { useRegisterSW } from "virtual:pwa-register/react";
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      window.setInterval(() => {
        if (navigator.onLine) void registration.update().catch(() => {});
      }, 60_000);
      window.addEventListener("focus", () => {
        if (navigator.onLine) void registration.update().catch(() => {});
      });
    },
  });
  if (!needRefresh) return null;
  return (
    <aside className="update-prompt" role="status">
      <strong>New version available!</strong>
      <p>
        Your collection is saved. Finish your fight before updating—an
        unfinished battle will restart.
      </p>
      <button
        className="primary"
        onClick={() => void updateServiceWorker(true)}
      >
        Update now
      </button>
      <button className="text-button" onClick={() => setNeedRefresh(false)}>
        Later
      </button>
    </aside>
  );
}
