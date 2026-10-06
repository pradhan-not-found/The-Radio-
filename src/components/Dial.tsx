import { Band, FM_MAX, FM_MIN, formatFrequency } from "../radio/types";

type DialProps = {
  band: Band;
  frequency: number;
  labels: number[];
};

export function Dial({ band, frequency, labels }: DialProps) {
  const min = band === "FM" ? FM_MIN : 530;
  const max = band === "FM" ? FM_MAX : 1700;
  const t = (frequency - min) / (max - min);
  const left = 4 + t * 92;

  return (
    <div className="dial">
      <div className="dial-glass">
        <div className="dial-scale">
          {labels.map((n) => {
            const p = (n - min) / (max - min);
            return (
              <span key={n} className="dial-mark" style={{ left: `${4 + p * 92}%` }}>
                <i />
                {formatFrequency(band, n)}
              </span>
            );
          })}
        </div>
        <div className="dial-needle" style={{ left: `${left}%` }} />
      </div>
      <div className="dial-caption">{band === "FM" ? "MHz" : "kHz"}</div>
    </div>
  );
}
