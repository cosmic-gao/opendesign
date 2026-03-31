import { useEffect, useState } from "react";

export default function EventIndicator({
  lastEventAt,
  hasPendingJobs,
}: {
  lastEventAt: number;
  hasPendingJobs?: boolean;
}) {
  const [hasRecentEvent, setHasRecentEvent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastEventAt < 1000) {
        setHasRecentEvent(true);
      } else {
        setHasRecentEvent(false);
      }
    }, 500);

    return () => clearInterval(timer);
  });

  const loading = hasPendingJobs || hasRecentEvent;

  return (
    <div
      className="flex items-center justify-center"
      style={{ marginTop: -2, marginBottom: 2 }}
    >
      <div
        className={`${loading ? `bg-slate-700 animate-ping` : ``} w-1/2`}
        style={{ height: 1 }}
      ></div>
    </div>
  );
}
