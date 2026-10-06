export type Band = "FM" | "AM";

export type PublicStation = {
  id: string;
  name: string;
  callsign: string;
  frequency: number;
  band: Band;
  city: string;
  genre: string;
};

export type PresetSlot = {
  band: Band;
  frequency: number;
};

export const FM_MIN = 87.5;
export const FM_MAX = 108.0;
export const FM_STEP = 0.1;
export const AM_MIN = 530;
export const AM_MAX = 1700;
export const AM_STEP = 9;

export function clampFrequency(band: Band, value: number) {
  if (band === "FM") {
    const stepped = Math.round(value / FM_STEP) * FM_STEP;
    return Math.min(FM_MAX, Math.max(FM_MIN, Number(stepped.toFixed(1))));
  }
  const stepped = Math.round(value / AM_STEP) * AM_STEP;
  return Math.min(AM_MAX, Math.max(AM_MIN, stepped));
}

export function formatFrequency(band: Band, value: number) {
  return band === "FM" ? value.toFixed(1) : String(Math.round(value));
}

export function captureWidth(band: Band) {
  return band === "FM" ? 0.22 : 12;
}

export function signalStrength(
  frequency: number,
  stations: PublicStation[],
  band: Band,
) {
  const width = captureWidth(band);
  let best = 0;
  let bestStation: PublicStation | null = null;
  for (const station of stations) {
    if (station.band !== band) continue;
    const d = Math.abs(station.frequency - frequency);
    const s = Math.exp(-((d / width) ** 2));
    if (s > best) {
      best = s;
      bestStation = station;
    }
  }
  return { signal: best, station: best > 0.18 ? bestStation : null, lock: best > 0.55 };
}
