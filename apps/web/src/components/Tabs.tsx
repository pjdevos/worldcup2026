export type ScheduleTab = "groups" | "calendar" | "bracket";

const ITEMS: Array<{ id: ScheduleTab; label: string }> = [
  { id: "groups", label: "Poules" },
  { id: "calendar", label: "Speelkalender" },
  { id: "bracket", label: "Knock-out" },
];

export function Tabs({
  value,
  onChange,
}: {
  value: ScheduleTab;
  onChange: (next: ScheduleTab) => void;
}) {
  return (
    <div className="tabs">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={`tab ${value === it.id ? "is-active" : ""}`}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
