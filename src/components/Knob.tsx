import { useCallback, useEffect, useRef } from "react";

type KnobProps = {
  value: number;
  min: number;
  max: number;
  size?: number;
  label: string;
  accent?: string;
  onChange: (value: number) => void;
};

export function Knob({
  value,
  min,
  max,
  size = 92,
  label,
  accent = "#c9a227",
  onChange,
}: KnobProps) {
  const dragging = useRef(false);
  const lastY = useRef(0);

  const setFromDelta = useCallback(
    (dy: number) => {
      const range = max - min;
      const next = value - (dy / 140) * range;
      onChange(Math.min(max, Math.max(min, next)));
    },
    [max, min, onChange, value],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromDelta(e.clientY - lastY.current);
      lastY.current = e.clientY;
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromDelta]);

  const t = (value - min) / (max - min);
  const angle = -135 + t * 270;

  return (
    <div className="knob-wrap">
      <div
        className="knob"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          dragging.current = true;
          lastY.current = e.clientY;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
      >
        <div className="knob-ring" />
        <div className="knob-face" style={{ transform: `rotate(${angle}deg)` }}>
          <span className="knob-tick" style={{ background: accent }} />
        </div>
      </div>
      <span className="knob-label">{label}</span>
    </div>
  );
}
