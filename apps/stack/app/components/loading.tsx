export function LoadingDots() {
  return (
    <span className="inline-flex min-w-[24px]">
      <span
        className="overflow-hidden"
        style={{
          animation: "loading-dots 1.5s steps(4) infinite",
        }}
      >
        ...
      </span>
      <style jsx>{`
        @keyframes loading-dots {
          0% {
            clip-path: inset(0 100% 0 0);
          }
          25% {
            clip-path: inset(0 66% 0 0);
          }
          50% {
            clip-path: inset(0 33% 0 0);
          }
          75% {
            clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
    </span>
  );
}

export function Loading({ text = "Loading" }: { text?: string }) {
  return (
    <div className="flex items-center text-gray-500 p-6 text-sm">
      {text}
      <LoadingDots />
    </div>
  );
}
