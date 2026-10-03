export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[92px] animate-pulse rounded-xl border bg-card shadow-sm"
          />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-xl border bg-card shadow-sm" />
    </div>
  );
}
