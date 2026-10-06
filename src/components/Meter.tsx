type MeterProps = {
  value: number;
  label: string;
};

export function Meter({ value, label }: MeterProps) {
  const needles = Math.round(Math.min(1, Math.max(0, value)) * 12);
  return (
    <div className="meter">
      <div className="meter-bars">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={i < needles ? (i > 8 ? "on hot" : "on") : ""}
          />
        ))}
      </div>
      <em>{label}</em>
    </div>
  );
}
