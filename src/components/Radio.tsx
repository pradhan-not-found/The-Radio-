import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import YouTube, { YouTubePlayer } from 'react-youtube';
import { radioAudio } from "../radio/engine";
import {
  AM_MAX, AM_MIN, Band, clampFrequency,
  FM_MAX, FM_MIN, formatFrequency,
  PresetSlot, PublicStation, signalStrength,
} from "../radio/types";
import {
  playKnobTick,
  playKnobThud,
  playTuneSweep,
  playPowerOn,
  playPowerOff,
  playBandSwitch
} from "../radio/sounds";

const PRESET_KEY = "the-radio-presets";
const EMPTY: PresetSlot[] = Array.from({ length: 6 }, () => ({ band: "FM" as Band, frequency: 88.1 }));

function loadPresets(): PresetSlot[] {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as PresetSlot[];
    return p.length === 6 ? p : EMPTY;
  } catch { return EMPTY; }
}

/* ── tick marks ── */
type Mark = { v: number; kind: "major" | "minor" };

function fmMarks(): Mark[] {
  const out: Mark[] = [];
  const majors = new Set([88, 92, 96, 100, 104, 108]);
  for (let v = 88; v <= 108; v += 0.5) {
    out.push({ v, kind: majors.has(v) ? "major" : "minor" });
  }
  return out;
}

function amMarks(): Mark[] {
  const out: Mark[] = [];
  const majors = [54, 60, 70, 80, 100, 120, 140, 160];
  const minors = [57, 65, 75, 90, 110, 130, 150];
  
  for (const v of majors) {
    out.push({ v, kind: "major" });
  }
  for (const v of minors) {
    out.push({ v, kind: "minor" });
  }
  return out;
}

const amScaleMap = [
  { f: 54, p: 0 },
  { f: 60, p: 12 },
  { f: 70, p: 28 },
  { f: 80, p: 44 },
  { f: 100, p: 63 },
  { f: 120, p: 77 },
  { f: 140, p: 89 },
  { f: 160, p: 100 }
];

function pct(band: Band, v: number) {
  if (band === "FM") {
    // FM is linear
    return 2 + ((v - FM_MIN) / (FM_MAX - FM_MIN)) * 96;
  }
  
  // AM is logarithmic/custom non-linear
  if (v <= amScaleMap[0].f) return 2;
  if (v >= amScaleMap[amScaleMap.length - 1].f) return 2 + 96;
  
  for (let i = 0; i < amScaleMap.length - 1; i++) {
    const cur = amScaleMap[i];
    const nxt = amScaleMap[i + 1];
    if (v >= cur.f && v <= nxt.f) {
      const ratio = (v - cur.f) / (nxt.f - cur.f);
      const p = cur.p + ratio * (nxt.p - cur.p);
      return 2 + (p / 100) * 96;
    }
  }
  return 2;
}

/* ── Speaker dots ── */
function Dots({ level }: { level: number }) {
  const COLS = 26, ROWS = 10;
  return (
    <div className="dot-grid" style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gridTemplateRows: `repeat(${ROWS},1fr)` }}>
      {Array.from({ length: ROWS * COLS }, (_, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const cx = (COLS-1)/2, cy = (ROWS-1)/2;
        const n = Math.sqrt((col-cx)**2 + (row-cy)**2) / Math.sqrt(cx**2+cy**2);
        return (
          <div key={i} className={`dot${level > 0.04 && n < level*2.5 ? " lit" : ""}`} />
        );
      })}
    </div>
  );
}

/* ── Knob ── */
function Knob({ value, min, max, size=64, className="", soundType="tick", continuous=true, onChange }:
  { value:number; min:number; max:number; size?:number; className?:string; soundType?:"tick"|"thud"|"tune"; continuous?:boolean; onChange:(v:number)=>void }) {
  const drag = useRef(false), lastY = useRef(0);
  const lastVal = useRef(value);
  const isTuning = soundType === "tune";

  const apply = useCallback((dy: number) => {
    // Smoother dragging for precision tuning
    let next = value - (dy/350)*(max-min);
    next = Math.min(max, Math.max(min, next));
    
    // Play sounds on movement
    if (Math.abs(next - lastVal.current) > (max-min)*0.01) {
      if (soundType === "tune") {
        if (Math.random() > 0.6) playTuneSweep();
      } else if (soundType === "thud") {
        playKnobThud();
      } else {
        playKnobTick(continuous ? 0.4 : 1.0);
      }
      lastVal.current = next;
    }

    if (!continuous && soundType !== "tune") {
      next = Math.round(next);
    }

    onChange(next);
  }, [max, min, onChange, value, continuous, soundType]);

  useEffect(() => {
    const mv = (e: PointerEvent) => { if (drag.current) { apply(e.clientY - lastY.current); lastY.current = e.clientY; } };
    const up = () => { drag.current = false; };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
  }, [apply]);

  const angle = -135 + ((value-min)/(max-min))*270;

  return (
    <div className={`knob-wrap ${className}`}>
      {className.includes('volume') && (
        <div className="vol-dots" style={{position: 'absolute', width: size+28, height: size+28, pointerEvents: 'none'}}>
          {Array.from({length: 9}).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%', width: 3, height: 3, background: '#fff', borderRadius: '50%',
              transform: `translate(-50%, -50%) rotate(${-135 + i * (270/8)}deg) translateY(-${size/2 + 14}px)`
            }} />
          ))}
        </div>
      )}
      <div className="knob" style={{ width: size, height: size }}
        onPointerDown={e => { 
          drag.current=true; 
          lastY.current=e.clientY; 
          lastVal.current = value;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); 
          if (!isTuning) (soundType === "thud" ? playKnobThud() : playKnobTick());
        }}>
        <div className="knob-ring" style={{ transform: `rotate(${angle}deg)` }} />
        <div className="knob-face">
          <div className="knob-line" style={{ transform: `translateX(-50%) rotate(${angle}deg)`, transformOrigin: "bottom center" }} />
        </div>
      </div>
    </div>
  );
}

/* ══ RADIO ══ */
export function Radio({ onPowerChange }: { onPowerChange?: (p: boolean) => void }) {
  const [stations] = useState<PublicStation[]>([
    { id: "mahalaya", name: "Mahalaya - Birendra Krishna Bhadra", frequency: 88.1, band: "FM", callsign: "MHL", city: "Kolkata", genre: "Devotional" },
    { id: "mahalaya2", name: "Mahalaya (Arijit Singh)", frequency: 93.5, band: "FM", callsign: "PJO", city: "Kolkata", genre: "Modern" },
    { id: "mahalaya3", name: "Devi Paksha Special", frequency: 98.3, band: "FM", callsign: "DVP", city: "Kolkata", genre: "Special" },
    { id: "mahalaya4", name: "Pujo Mix", frequency: 104.0, band: "FM", callsign: "MIX", city: "Kolkata", genre: "Mix" }
  ]);
  const [power,    setPower]    = useState(false); // Always starts OFF
  const [band,     setBand]     = useState<Band>("FM");
  const [freq,     setFreq]     = useState(88.1);
  const [muted,    setMuted]    = useState(false);
  const [modeIdx,  setModeIdx]  = useState(1); // 0: AFC, 1: FM, 2: Digital
  const [presets,  setPresets]  = useState<PresetSlot[]>(loadPresets);


  const PLAYLIST_DATA: Record<string, { videoId: string, title: string, artist: string, duration: string, img: string }[]> = {
    'DURGA PUJA': [
      { videoId: 'SFJeglBF5cg', title: 'Dugga Elo', artist: 'Monali Thakur', duration: '2:27', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80' },
      { videoId: 'FBOt8rMUcio', title: 'Dugga Ma (Original Motion Picture Soundtrack)', artist: 'Arijit Singh', duration: '4:31', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' },
      { videoId: 'ZFBq075jwiE', title: 'Ebar Jeno Onno Rokom Pujo', artist: 'Nakash Aziz Official', duration: '3:33', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' },
      { videoId: '7uzjfZ423Kc', title: 'Dhak Baja Kashor Baja', artist: 'Shreya Ghoshal Official', duration: '4:26', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=80' },
      { videoId: 'OHznU-L0JqI', title: 'Bolo Dugga Elo', artist: 'Kaushik-Guddu', duration: '3:20', img: 'https://images.unsplash.com/photo-1516280440502-a2fc99496c53?w=100&q=80' },
      { videoId: 'w6SQsKD2U-Y', title: 'Aamaar Dugga', artist: 'Monali Thakur', duration: '3:20', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&q=80' },
      { videoId: 'aL1POTi_EhE', title: 'Dhaker Taley', artist: 'Abhijeet', duration: '4:43', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80' }
    ],
    'MAHALAYA': [
      { videoId: '6Z0UaR-i7H8', title: 'Mahisasuramardini - Full', artist: 'Birendra Krishna Bhadra', duration: '1:28:00', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' },
      { videoId: '1Yycc3tejNw', title: 'Ya Chandi', artist: 'Chorus', duration: '4:15', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' }
    ],
    'MAHALAYA SONGS': [
      { videoId: '8FytVk54-dw', title: 'Ya Chandi with lyrics | Chorus | Pankaj Kumar Mullick | Bani Kumar', artist: 'Saregama Bengali', duration: '2:03', img: 'https://i.ytimg.com/vi_webp/8FytVk54-dw/maxresdefault.webp' },
      { videoId: 'UQHikCYHrx0', title: 'Simhasta Sashishekhara | Mahalaya Song | Mahishasura Mardini | Birendra Krishna Bhadra | Chorus', artist: 'Saregama Bengali', duration: '1:08', img: 'https://i.ytimg.com/vi_webp/UQHikCYHrx0/maxresdefault.webp' },
      { videoId: '2Zqlb00ttCU', title: 'Bajlo Tomar Aalor Benu With Narration | Audio | Birendra Krishna Bhadra and Supriti Ghosh', artist: 'Saregama Bengali', duration: '4:47', img: 'https://i.ytimg.com/vi_webp/2Zqlb00ttCU/maxresdefault.webp' },
      { videoId: 'IfSJy3_Lkuo', title: 'Jago Durga Dashapraharanadharinee With Lyrics | Dwijen Mukherjee', artist: 'Saregama Bengali', duration: '2:11', img: 'https://i.ytimg.com/vi_webp/IfSJy3_Lkuo/maxresdefault.webp' },
      { videoId: '61NfXV1R6cw', title: 'Ogo Amar Agamani Alo with lyrics', artist: 'Bangla Bhakti Geeti', duration: '3:37', img: 'https://i.ytimg.com/vi_webp/61NfXV1R6cw/maxresdefault.webp' },
      { videoId: '6rwF1iQPVzc', title: 'Tabo Achintya Rupa-Charita-Mahima | Audio | Manabendra Mukherjee | Pankaj Kumar Mullick | Bani Kumar', artist: 'Saregama Bengali', duration: '4:25', img: 'https://i.ytimg.com/vi_webp/6rwF1iQPVzc/maxresdefault.webp' },
      { videoId: 'GJccKU4_5wg', title: 'Aham Rudrebhirvasubhischara | Mahishasura Mardini | Chorus | Audio', artist: 'Saregama Bengali', duration: '4:06', img: 'https://i.ytimg.com/vi_webp/GJccKU4_5wg/maxresdefault.webp' },
      { videoId: 'FrHp3pXxeNU', title: 'Akhila-Bimane Taba Jaya-Gane | Mahishasura Mardini | Krishna Dasgupta | Audio', artist: 'Saregama Bengali', duration: '4:08', img: 'https://i.ytimg.com/vi_webp/FrHp3pXxeNU/maxresdefault.webp' },
      { videoId: 'Uwe7xGARrfA', title: 'Jayanti Mangala Kali | Mahalaya Song | Birendra Krishna Bhadra | Pankaj Kumar Mullick, others', artist: 'Saregama Bengali', duration: '7:10', img: 'https://i.ytimg.com/vi_webp/Uwe7xGARrfA/maxresdefault.webp' },
      { videoId: 'CWy7if8ilNs', title: 'Subhra Sankha-rabe | Shyamal Mitra', artist: 'Koushik Baidya', duration: '3:06', img: 'https://i.ytimg.com/vi_webp/CWy7if8ilNs/maxresdefault.webp' },
      { videoId: 'h5O3igngxCU', title: 'Jatajutasamayuktamardhendukrita-Sekharam | Mahishasura Mardini | Chorus | Audio', artist: 'Saregama Bengali', duration: '4:32', img: 'https://i.ytimg.com/vi_webp/h5O3igngxCU/maxresdefault.webp' },
      { videoId: 'hh6ngvUwzzw', title: 'Namo Chandi Namo Chandi | Mahalaya Song | Birendra Krishna Bhadra | Bimalbhushan', artist: 'Saregama Bengali', duration: '3:14', img: 'https://i.ytimg.com/vi_webp/hh6ngvUwzzw/maxresdefault.webp' },
      { videoId: 'qdx842oMwnA', title: 'Ma Go Tabu Beene Sangeeta | Mahishasura Mardini | Sumitra Sen | Pankaj Kumar Mullick | Audio', artist: 'Saregama Bengali', duration: '3:45', img: 'https://i.ytimg.com/vi_webp/qdx842oMwnA/maxresdefault.webp' },
      { videoId: '-ZJtci1_Ih0', title: 'Bimane Bimane | Mahishasura Mardini | Sandhya Mukherjee | Audio', artist: 'Saregama Bengali', duration: '3:06', img: 'https://i.ytimg.com/vi_webp/-ZJtci1_Ih0/maxresdefault.webp' },
      { videoId: 'AB4IUcvuEXs', title: 'Jaya Jaya Japyajaye | Mahishasura Mardini | Pankaj Kumar Mullick | Audio', artist: 'Saregama Bengali', duration: '2:37', img: 'https://i.ytimg.com/vi_webp/AB4IUcvuEXs/maxresdefault.webp' },
      { videoId: 'zuVw7KFPQnk', title: 'He Chinmoyi with lyrics | Tarun Banerjee', artist: 'Saregama Bengali', duration: '3:17', img: 'https://i.ytimg.com/vi_webp/zuVw7KFPQnk/maxresdefault.webp' },
      { videoId: '3E2PduduZSI', title: 'Amala Kirane | Mahalaya Song | Birendra Krishna Bhadra | Pratima Bandyopadhyay', artist: 'Saregama Bengali', duration: '4:14', img: 'https://i.ytimg.com/vi_webp/3E2PduduZSI/maxresdefault.webp' },
      { videoId: 'Uwe7xGARrfA', title: 'Jayanti Mangala Kali | Mahalaya Song | Birendra Krishna Bhadra | Pankaj Kumar Mullick, others', artist: 'Saregama Bengali', duration: '7:10', img: 'https://i.ytimg.com/vi_webp/Uwe7xGARrfA/maxresdefault.webp' },
      { videoId: 'VAV6OQMe-to', title: 'Santi Dile Bhari | Mahishasura Mardini | Utpala Sen | Audio', artist: 'Saregama Bengali', duration: '2:18', img: 'https://i.ytimg.com/vi_webp/VAV6OQMe-to/maxresdefault.webp' }
    ],
    'PRADHAN DA MIX': [
      { videoId: 'SFJeglBF5cg', title: 'Dugga Elo', artist: 'Monali Thakur', duration: '2:27', img: 'https://i.ytimg.com/vi/SFJeglBF5cg/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAb5Sk7tUpdGaM9DFnM5n0IcSTHTQ' },
      { videoId: 'FBOt8rMUcio', title: 'Dugga Ma', artist: 'Release - Topic', duration: '4:31', img: 'https://i.ytimg.com/vi/FBOt8rMUcio/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLA1Yr9z6xt40020vS0oyO8-5xHYUw' },
      { videoId: 'ZFBq075jwiE', title: 'Ebar Jeno Onno Rokom Pujo', artist: 'Release - Topic', duration: '3:35', img: 'https://i.ytimg.com/vi/ZFBq075jwiE/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCSbZKWEBkwamzVL_2f0GMjRzMHYQ' },
      { videoId: '7uzjfZ423Kc', title: 'Dhak Baja Kashor Baja', artist: 'Shreya Ghoshal Official', duration: '4:26', img: 'https://i.ytimg.com/vi/7uzjfZ423Kc/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDLp26rgJYoJ2_BOAKk-P-9nCXt-A' },
      { videoId: 'OHznU-L0JqI', title: 'Bolo Dugga Elo (ORIGINAL)', artist: 'Sunidhi Chauhan Official', duration: '3:20', img: 'https://i.ytimg.com/vi/OHznU-L0JqI/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAsMpDpShaTwR3vQ1HEvmj9bv0yYA' },
      { videoId: 'w6SQsKD2U-Y', title: 'Aamaar Dugga', artist: 'Monali Thakur', duration: '3:20', img: 'https://i.ytimg.com/vi/w6SQsKD2U-Y/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDpJGB1oZYduP9FKspMLThrTgqhGg' },
      { videoId: 'aL1POTi_EhE', title: 'Dhaker Taley (ORIGINAL)', artist: 'Release - Topic', duration: '4:43', img: 'https://i.ytimg.com/vi/aL1POTi_EhE/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCbco3C-adVsV2A37DqyZtoeVuLog' },
      { videoId: 'MgOAjrDnY7A', title: 'Dugga Elo (ORIGINAL)', artist: 'Akriti Kakar, Debanjali B Joshi - Topic', duration: '3:58', img: 'https://i.ytimg.com/vi/MgOAjrDnY7A/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAcAE8VzswFs53htzeMr6OI-kpTtw' },
      { videoId: 'blqKo-7S-rA', title: 'Shundori Komola', artist: 'Release - Topic', duration: '3:14', img: 'https://i.ytimg.com/vi/blqKo-7S-rA/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDggfsCat0uj5QQNDpFGKFXHi9NxQ' },
      { videoId: 'upYGF3YAHeo', title: 'O Menoka O Menoka', artist: 'ANTARA NANDY', duration: '3:16', img: 'https://i.ytimg.com/vi/upYGF3YAHeo/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCGYuq7DraGG3QH_foXzw87QZJZxg' },
      { videoId: 'p_hqO0sJh-I', title: 'Ailo Uma Barite', artist: 'ANTARA NANDY', duration: '3:53', img: 'https://i.ytimg.com/vi/p_hqO0sJh-I/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDMBeOg39LMxcwHYas11RUwi7rIzg' },
      { videoId: 'x_Nar1eYzBM', title: 'Uma Ashe Notun Saje', artist: 'Ankita Bhattacharyya', duration: '3:06', img: 'https://i.ytimg.com/vi/x_Nar1eYzBM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCH-vqOiXftXQO20TNAUI5WyyI8JA' },
      { videoId: 'I5uMBp5wDhI', title: 'Abar Elo Maa', artist: 'Rahul Dutta', duration: '3:07', img: 'https://i.ytimg.com/vi/I5uMBp5wDhI/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLC_xi5T4Bb6hZT_H3VbaNX33Wvpxg' },
      { videoId: 'CWtqPoZrUoA', title: 'Joy Joy Durga Ma', artist: 'Agnibha Bandyopadhyay - Topic', duration: '5:51', img: 'https://i.ytimg.com/vi/CWtqPoZrUoA/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDQviqOTRDE1jLO4Q_-w8-H6ylkpA' },
      { videoId: 'uLSEEBGr4Ag', title: 'Durga Maa', artist: 'Akassh', duration: '3:41', img: 'https://i.ytimg.com/vi/uLSEEBGr4Ag/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBRiE0MXIKOhtTfuMB2Cc-vW5_Fnw' },
      { videoId: 'W-YAf-bHkCw', title: 'Gouri Elo Dekhe Jalo', artist: 'DOHAR FOLK', duration: '5:40', img: 'https://i.ytimg.com/vi/W-YAf-bHkCw/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAsm9YUrMXRtxbm5fyIOu-Uai3Hxw' },
      { videoId: 'JOQdF0wRjYY', title: 'Dhak Baaja Komor Nacha', artist: 'Release - Topic', duration: '3:33', img: 'https://i.ytimg.com/vi/JOQdF0wRjYY/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDb5UbyN-UvNJ5OhKtSHi9DZY8Naw' },
      { videoId: 'Ku7mJminJxI', title: 'Durge Durge Durgatinashini', artist: 'Asha Bhosle - Topic', duration: '5:10', img: 'https://i.ytimg.com/vi/Ku7mJminJxI/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAWPm6hmQcTij3GJadTQk52yAxkfQ' },
      { videoId: 'z-T4qiQMXaw', title: 'Rupang Dehi', artist: 'Snita Pramanik Ghosh - Topic', duration: '4:18', img: 'https://i.ytimg.com/vi/z-T4qiQMXaw/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCFo0sZF6p3xWk2xu21ljbZtYJdBg' },
      { videoId: '1Yycc3tejNw', title: 'Aigiri Nandini', artist: 'Rajalakshmee Sanjay Official', duration: '15:02', img: 'https://i.ytimg.com/vi/1Yycc3tejNw/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLArqKPZbn-1kNXTiYOrdJs12TtXeQ' },
      { videoId: 'nLrpLXaWbxk', title: 'Baja Sanai Aar Baja Re Dhol', artist: 'Abhijeet Unplugged', duration: '4:44', img: 'https://i.ytimg.com/vi/nLrpLXaWbxk/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBXlVICSA8J7ehPqPdfzCdLjPkMJQ' },
      { videoId: 'ZusnukjtotQ', title: 'Maa Ashchhe (From "Maa Ashchhe")', artist: 'Sanjeev Tiwari - Topic', duration: '3:27', img: 'https://i.ytimg.com/vi/ZusnukjtotQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLA-R8iV88TjXQpxi3xfKLXo_InAMQ' },
      { videoId: 'hDve9YmTZq4', title: 'Esho Maa Durga', artist: 'Shamik Guha Roy', duration: '3:57', img: 'https://i.ytimg.com/vi/hDve9YmTZq4/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCm3mh-nnfUQiKcEwwhoysJGGe_OA' },
      { videoId: 'P-aQkwwCMbY', title: 'Maa Go Tui', artist: 'Release - Topic', duration: '2:00', img: 'https://i.ytimg.com/vi/P-aQkwwCMbY/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBFn71nOQDGzSlPTMg0sJcPRSRXXA' },
      { videoId: 'sto9TBxGibE', title: 'Jago Uma (ORIGINAL)', artist: 'Rupankar', duration: '5:18', img: 'https://i.ytimg.com/vi/sto9TBxGibE/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAV9H6i3ncE9d85LdKFUZ7JzLJpUg' },
      { videoId: 'mXqUIFUYqpM', title: 'Aigiri Nandini (feat. Samarthan, Ramprakash) (Rock Version)', artist: 'Sowrabha - Topic', duration: '4:57', img: 'https://i.ytimg.com/vi/mXqUIFUYqpM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCBjGuAoVvXY6qY-y21tmi6LKQiHg' },
      { videoId: 'UpeueoYgHnE', title: 'Aaj Baaje', artist: 'Somchanda Bhattacharya - Topic', duration: '3:34', img: 'https://i.ytimg.com/vi/UpeueoYgHnE/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCy_IYlMbAPJKEKn_-h93VpMHE0pw' },
      { videoId: 'haJg9VgzMM0', title: 'Pujo Pujo Gondho', artist: 'Anupam Roy', duration: '2:47', img: 'https://i.ytimg.com/vi/haJg9VgzMM0/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLA9vN4tDE6VrL9qbRnhY47G-spP2A' },
      { videoId: 'E40N8rKKTCc', title: 'Pujor Dhaak Theme', artist: 'SUROBAIBHAB ( Bibhabendu Bhattacharya Official)', duration: '1:31', img: 'https://i.ytimg.com/vi/E40N8rKKTCc/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDmEUaGsjpHGZLu-LbkBuAy4x5r7w' },
      { videoId: 'srJlx60zfBQ', title: 'Pujor Gaan', artist: 'Poushali Bhattacharya - Topic', duration: '4:45', img: 'https://i.ytimg.com/vi/srJlx60zfBQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAyoTHOpwNcQbs-3tMFafpwrSq_WQ' },
      { videoId: 'jwMo3vrsL7s', title: 'Gouri Elo (From "Raktabeej")', artist: 'DOHAR FOLK', duration: '3:57', img: 'https://i.ytimg.com/vi/jwMo3vrsL7s/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLA7Afs_T85dvFxFR1emnpxSuB0saw' },
      { videoId: 'nH65Xk8kPjQ', title: 'Aham Rudre', artist: 'Release - Topic', duration: '2:39', img: 'https://i.ytimg.com/vi/nH65Xk8kPjQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCOqHKrGHHpNg5HAq7fRy0bBONLMw' },
      { videoId: '2TmguxqQG54', title: 'Elo Re Pujo Elo', artist: 'Nakash Aziz Official', duration: '3:13', img: 'https://i.ytimg.com/vi/2TmguxqQG54/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCtxlZfY7C6P_priyznEYkMYCK--g' },
      { videoId: 'Rx7l8bjzjg4', title: 'Chaarpashe Aalo Hok', artist: 'Release - Topic', duration: '11:34', img: 'https://i.ytimg.com/vi/Rx7l8bjzjg4/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCC6G8ltNk87kwCJpg30Fpy6tJ3qA' },
      { videoId: 'CYcqPK0Dl60', title: 'O Thakur', artist: 'Upal Sengupta - Topic', duration: '2:54', img: 'https://i.ytimg.com/vi/CYcqPK0Dl60/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLA9HGShjz-d6XhfzGqyzu24bX9WAQ' },
      { videoId: 'PEiFJAy_zsM', title: 'Shubho Shubho', artist: 'Altamash Faridi', duration: '3:14', img: 'https://i.ytimg.com/vi/PEiFJAy_zsM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCy3akaOTOPY_sMVGkyIF8kLlOcjg' },
      { videoId: 'YnU9c1aj5hY', title: 'He Maa Durga Maa', artist: 'Aseema Panda', duration: '5:12', img: 'https://i.ytimg.com/vi/YnU9c1aj5hY/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAJeaJ8PamS4_RgdZJTIAadTIKlsw' },
      { videoId: 'VNI_XEx7z-g', title: 'Durga Maa Eseche', artist: 'Akassh', duration: '3:07', img: 'https://i.ytimg.com/vi/VNI_XEx7z-g/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCBR5mwzwyeXpKQPIQZe2dYQvp2sg' },
      { videoId: 'avySoa5OW1w', title: 'Eseche Maa Durga Maa - (DJ Remix)', artist: 'Keshab Dey', duration: '3:03', img: 'https://i.ytimg.com/vi/avySoa5OW1w/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDd4EPkoiI8wM5MG5ngkxVWI8_dmA' },
      { videoId: 'hDukD5TJmV4', title: 'Kolki', artist: 'Monami Ghosh - Topic', duration: '4:05', img: 'https://i.ytimg.com/vi/hDukD5TJmV4/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBzx3N1YlW7h035JK5gifsgnM7DUA' },
      { videoId: 'LLer3VPOcxg', title: 'Dugga Ma Asche', artist: 'Infra', duration: '3:34', img: 'https://i.ytimg.com/vi/LLer3VPOcxg/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDz4gieZWUnYP5uT3rZyIugFs7JGw' },
      { videoId: 'BvIcx9ev8X0', title: 'Debi Sajer Gaan', artist: 'Rupak Tiary', duration: '3:01', img: 'https://i.ytimg.com/vi/BvIcx9ev8X0/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAISKXTHTKAazeN3TVuxJy6CMVXyg' },
      { videoId: 'j9_MLElmS9g', title: 'Meri Maa Ke Barabar Koi Nahi', artist: 'Jubin Nautiyal', duration: '4:59', img: 'https://i.ytimg.com/vi/j9_MLElmS9g/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAxEzcu-UxHmdmBkK03pR9zu64W-w' },
      { videoId: 'cFsCf0MGuuA', title: 'Bajlo Tomar Aalor Benu', artist: 'Release - Topic', duration: '5:16', img: 'https://i.ytimg.com/vi/cFsCf0MGuuA/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBoqvJb6R6uvpVVpdmu_vkM4JMd5g' },
      { videoId: '63X0l49OyjI', title: 'Durge Durge Durgatinashini', artist: 'Release - Topic', duration: '3:43', img: 'https://i.ytimg.com/vi/63X0l49OyjI/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDB4HtWBk4bwFukVMqh5wUqkfnOzQ' },
      { videoId: '_GUdZJQun2I', title: 'Madhukaitava Vidhwangsi', artist: 'Tushar Dutta - Topic', duration: '9:49', img: 'https://i.ytimg.com/vi/_GUdZJQun2I/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCdqc8LgbDAd-F2-h2-ayRRshuoiQ' },
      { videoId: 'j7nWykTLEMs', title: 'Bajlo Tomar Alor Benu', artist: 'Sriparna Das - Topic', duration: '4:44', img: 'https://i.ytimg.com/vi/j7nWykTLEMs/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBDGiu__c-mK6es1jhnRCxF9WccSQ' },
      { videoId: 'DxaNt-pmObM', title: 'Bajlo Tomar Aalor Benu With Narration', artist: 'Supriti Ghosh - Topic', duration: '4:24', img: 'https://i.ytimg.com/vi/DxaNt-pmObM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDimSFm0giV5vCFFbcdLLCln0HMDw' },
      { videoId: '43_oBh4YsQs', title: 'Phagun Haoyay Haoyay (From "Bhalobashar Bari")', artist: 'Jayati Chakraborty', duration: '2:35', img: 'https://i.ytimg.com/vi/43_oBh4YsQs/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDLXci2LeDL7HkpDO0bfe0ycZuRzA' },
      { videoId: '_RmN29SHVS8', title: 'Ogo Amar Agamani-alo', artist: 'Sipra Basu - Topic', duration: '3:20', img: 'https://i.ytimg.com/vi/_RmN29SHVS8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAQ5FqE5tB3y77V1nqGZbSVvVQzXA' },
      { videoId: 'PRTXLKCV6Nk', title: 'ওগো আমার আগমনী আলো', artist: 'Samadrita Ghosh', duration: '4:51', img: 'https://i.ytimg.com/vi/PRTXLKCV6Nk/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAtOOJgjACZDvvGKiAGW3iTjTtRpA' },
      { videoId: 'gbGVjyHq8iA', title: 'Durge Durge Durgatinashini', artist: 'Asha Bhosle - Topic', duration: '5:10', img: 'https://i.ytimg.com/vi/gbGVjyHq8iA/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLATmeIGl9WS1iZsPZda-7kPAq7BPw' },
      { videoId: 'ocCQ1UVsel8', title: 'Agomonir Gaan', artist: 'Anupam Roy', duration: '5:47', img: 'https://i.ytimg.com/vi/ocCQ1UVsel8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLB3eyMkKRowYqub8yI38UJJ8lGv6g' },
      { videoId: '707QgEnx8Hs', title: 'Saajan Rock the Dotara (Folk - Bandish Mix)', artist: 'Timir Biswas Studio', duration: '4:28', img: 'https://i.ytimg.com/vi/707QgEnx8Hs/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLD73IZTltxvnPJr5gSayMIgz-wx9A' },
      { videoId: 'd-NMikRHMQQ', title: 'Pujar Gaan (From "Hooligaanism")', artist: 'Hooligaanism - Topic', duration: '6:33', img: 'https://i.ytimg.com/vi/d-NMikRHMQQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLD4LMtceHmal66wNXsUZSUqOhgqug' },
      { videoId: 'ADpMft-PUb8', title: 'Gouri Elo', artist: 'Aritra Dasgupta - Topic', duration: '5:35', img: 'https://i.ytimg.com/vi/ADpMft-PUb8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLB9jVHIHqOR3b-mPcPYFDYa5IqZBQ' },
      { videoId: 'S-XOArX0faE', title: 'Doob De Re Mon', artist: 'Nirmalya Roy', duration: '2:16', img: 'https://i.ytimg.com/vi/S-XOArX0faE/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBu5RYu-uhxw5H2a7OaLEgIyTMd5g' },
      { videoId: '-umiui0IOLc', title: 'Apur Paayer Chhaap', artist: 'Arijit Singh', duration: '4:07', img: 'https://i.ytimg.com/vi/-umiui0IOLc/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDgls5gFBG2vryZeJv-QoKBTEvQtQ' }
    ],
  };

  const [activeCat, setActiveCat] = useState('PRADHAN DA MIX');
  const [activeSong, setActiveSong] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const [level,    setLevel]    = useState(0);
  const [volume,   setVolume]   = useState(100);
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [ytData,   setYtData]   = useState<{title: string, videoId: string, category: string} | null>(null);
  
  const holdRef = useRef(false);
  const stateRef = useRef({ activeCat, activeSong });

  useEffect(() => {
    stateRef.current = { activeCat, activeSong };
    if (power && ytPlayer) {
      const currentList = PLAYLIST_DATA[activeCat];
      if (currentList && currentList[activeSong]) {
        ytPlayer.loadVideoById(currentList[activeSong].videoId);
      }
    }
  }, [activeCat, activeSong, power, ytPlayer]);
  const { signal, station, lock } = useMemo(() => signalStrength(freq, stations, band), [freq, stations, band]);

  useEffect(() => { localStorage.setItem(PRESET_KEY, JSON.stringify(presets)); }, [presets]);

  // Notify parent of initial power state on mount
  useEffect(() => { onPowerChange?.(power); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      // If we are locked and playing youtube, simulate VU meter. Otherwise use static level.
      if (power && lock && ytPlayer && ytPlayer.getPlayerState() === 1) {
        setLevel(0.3 + Math.random() * 0.4); // Simulated VU for YouTube
      } else {
        const a = radioAudio.getAnalyser();
        if (a) { const b = new Uint8Array(a.frequencyBinCount); a.getByteFrequencyData(b); setLevel(b.reduce((s,v)=>s+v,0)/b.length/255); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [power, lock, ytPlayer]);

  const applyAudio = useCallback(async () => {
    radioAudio.setMix(power ? signal : 0, volume / 100, muted || !power);
    // Removed radioAudio.tuneTo() so WebAudio doesn't play the MP3s
  }, [muted, power, signal, volume]);

  useEffect(() => { 
    void applyAudio(); 
    if (power) void radioAudio.power(true); 
  }, [applyAudio, power]);

  // Sync YouTube Player
  useEffect(() => {
    if (ytPlayer && ytPlayer.playVideo) {
      ytPlayer.setVolume(volume);
      if (power && (modeIdx === 2 || lock) && !muted) {
        ytPlayer.playVideo();
      } else {
        ytPlayer.pauseVideo();
      }
    }
  }, [power, lock, muted, modeIdx, ytPlayer, volume]);

  // Extract YouTube Data for Digital Display
  useEffect(() => {
    if (!ytPlayer || !ytPlayer.getVideoData) return;
    const interval = setInterval(() => {
      try {
        const data = ytPlayer.getVideoData();
        if (data && data.video_id) {
          setYtData(prev => prev?.videoId === data.video_id ? prev : { 
            title: data.title, 
            videoId: data.video_id,
            category: activeCat
          });
        }
      } catch(e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [ytPlayer, activeCat]);

  // Handle category/song changes
  useEffect(() => {
    if (ytPlayer && ytPlayer.playVideoAt) {
      if (power && modeIdx === 2) {
        const catConfig = MUSIC_LIBRARY[activeCat];
        if (catConfig) {
          ytPlayer.playVideoAt(catConfig.offset + activeSong);
        }
      }
    }
  }, [activeCat, activeSong, ytPlayer, power, modeIdx]);

  const togglePower = async (next = !power) => {
    if (next) playPowerOn();
    else playPowerOff();
    setPower(next);
    onPowerChange?.(next);
    await radioAudio.power(next);
  };

  // Sync mode knob with band
  useEffect(() => {
    if (modeIdx === 0 || modeIdx === 1) { setBand("FM"); } 
    else if (modeIdx === 2) { setBand("FM"); /* Digital mode */ }
  }, [modeIdx]);

  const fmNums = [88,92,96,100,104,108];
  const amNums = [54,60,70,80,100,120,140,160];
  const fmM = fmMarks();
  const amM = amMarks();

  return (
    <>
    <div className={`radio-shell ${power?"on":"off"}`}>
      
      {/* Realistic Telescoping Antenna mounted on the back */}
      <div className="antenna-wrapper">
        <div className="antenna-segment seg-4">
          <div className="antenna-tip" />
        </div>
        <div className="antenna-segment seg-3" />
        <div className="antenna-segment seg-2" />
        <div className="antenna-segment seg-1" />
        <div className="antenna-base" />
      </div>

      {/* ── DIAL PANEL (Top half) ── */}
      <div className="top-panel">
        <div className="scale-display" style={{ display: 'flex', alignItems: 'stretch' }}>
          {modeIdx !== 2 ? (
            <>
              <div className="scale-labels">
                <div className="lbl-fm">FM</div>
                <div className="lbl-am">AM</div>
              </div>
              
              <div className="scale-track-area">
                {/* Physical red plastic needle behind glass */}
                <div className="dial-needle" style={{left:`${pct(band,freq)}%`}}/>
                
                <div className="tuning-center-line" />
                
                <div className="scale-row fm-row">
                  {fmNums.map(n=>(
                    <span key={n} style={{position: 'absolute', left: `${pct("FM", n)}%`, transform: 'translateX(-50%)'}}>{n}</span>
                  ))}
                </div>
                
                <div className="tick-track fm-ticks">
                  {fmM.map(({v,kind})=>(
                    <div key={v} className={`tick ${kind}`} style={{left:`${pct("FM",v)}%`}}/>
                  ))}
                </div>
                
                <div className="tick-track am-ticks">
                  {amM.map(({v,kind})=>(
                    <div key={v} className={`tick ${kind}`} style={{left:`${pct("AM",v)}%`}}/>
                  ))}
                </div>
                
                <div className="scale-row am-row">
                  {amNums.map(n=>(
                    <span key={n} style={{position: 'absolute', left: `${pct("AM", n)}%`, transform: 'translateX(-50%)'}}>{n}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Digital Music Player UI (Replaces the tuning dial) */
            <div className="digital-content" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0', gap: '16px', zIndex: 10 }}>
              
              {/* Left side: Thumbnail */}
              <div className="digital-thumbnail">
                {ytData ? (
                  <img 
                    src={PLAYLIST_DATA[activeCat]?.[activeSong]?.img || `https://img.youtube.com/vi/${ytData.videoId}/mqdefault.jpg`} 
                    alt="Thumbnail" 
                    onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${ytData.videoId}/mqdefault.jpg`; }}
                  />
                ) : (
                  <div className="digital-placeholder" />
                )}
              </div>
              
              {/* Right side: Information & Controls */}
              <div className="digital-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                
                {/* Title & Artist */}
                <div className="digital-text-container" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div className="digital-title" title={PLAYLIST_DATA[activeCat]?.[activeSong]?.title || ytData?.title || 'No signal'}>
                    {power ? (PLAYLIST_DATA[activeCat]?.[activeSong]?.title || ytData?.title || 'Tuning...') : 'POWER OFF'}
                  </div>
                  <div className="digital-artist" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {power ? (PLAYLIST_DATA[activeCat]?.[activeSong]?.artist || 'Unknown Artist') : ''}
                  </div>
                </div>
                
                {/* Controls Row */}
                <div className="digital-controls" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  
                  {/* Play/Pause Toggle */}
                  <button 
                    className={`digital-ctrl-btn toggle-btn ${!muted && power ? 'playing' : ''}`} 
                    disabled={!power} 
                    onClick={() => { 
                      if (muted) { ytPlayer?.playVideo(); setMuted(false); } 
                      else { ytPlayer?.pauseVideo(); setMuted(true); }
                    }}
                  >
                    {muted ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg> // Play
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> // Pause
                    )}
                  </button>

                  {/* Next Song */}
                  <button className="digital-ctrl-btn" disabled={!power} onClick={() => { 
                    const nextSong = (activeSong + 1) % (PLAYLIST_DATA[activeCat]?.length || 1);
                    setActiveSong(nextSong);
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
                  
                  {/* Browse Playlists */}
                  <button 
                    className="browse-playlist-btn" 
                    onClick={() => setShowPlaylist(true)}
                    disabled={!power}
                    style={{ marginLeft: 'auto', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', color: '#E8E5DD', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { if (power) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                    onMouseOut={(e) => { if (power) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/></svg>
                    Browse
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="tuning-lbl-area">
          <span className="tuning-lbl">{modeIdx !== 2 ? 'Tuning' : 'Volume'}</span>
        </div>
        
        <div className="dial-knob-col">
          <Knob
            className="knob-large"
            value={modeIdx !== 2 ? freq : volume}
            min={modeIdx !== 2 ? (band==="FM"?FM_MIN:AM_MIN) : 0}
            max={modeIdx !== 2 ? (band==="FM"?FM_MAX:AM_MAX) : 100}
            size={76}
            soundType="tune"
            onChange={v => {
              if (modeIdx !== 2) setFreq(clampFrequency(band,v));
              else setVolume(v);
            }}
          />
        </div>
      </div>

      {/* ── LOWER BODY (Speaker left, controls right) ── */}
      <div className="bottom-panel">
        <div className="speaker-grille">
          <Dots level={power&&!muted?level:0}/>
        </div>
        
        <div className="ctrl-col">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px'}}>
            <div style={{display: 'flex', flexDirection: 'column', height: '64px', justifyContent: 'space-between', fontSize: '15px', color: '#8C8478', fontWeight: 600, letterSpacing: '0.5px'}}>
              <span style={{color: modeIdx===0 ? '#E8E5DD' : '#8C8478', textShadow: modeIdx===0 ? '0 1px 2px #000' : 'none', transition: 'color 0.3s'}}>AFC</span>
              <span style={{color: modeIdx===1 ? '#E8E5DD' : '#8C8478', textShadow: modeIdx===1 ? '0 1px 2px #000' : 'none', transition: 'color 0.3s'}}>FM</span>
              <span style={{color: modeIdx===2 ? '#E8E5DD' : '#8C8478', textShadow: modeIdx===2 ? '0 1px 2px #000' : 'none', transition: 'color 0.3s'}}>Digital</span>
            </div>
            
            {/* Clickable mode knob */}
            <div 
              className="knob knob-small" 
              style={{ width: 64, height: 64, cursor: 'pointer' }}
              onClick={() => {
                playBandSwitch();
                setModeIdx((modeIdx + 1) % 3);
              }}
            >
              <div className="knob-ring" style={{ transform: `rotate(${-135 + (modeIdx / 2) * 270}deg)`, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              <div className="knob-face">
                <div className="knob-line" style={{ transform: `translateX(-50%) rotate(${-135 + (modeIdx / 2) * 270}deg)`, transformOrigin: "bottom center", transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>
          </div>

          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px'}}>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '64px', gap: '8px'}}>
              <span style={{fontSize: '18px', color: '#E8E5DD', fontWeight: 600, letterSpacing: '0.5px', textShadow: '0 1px 2px #000'}}>Power</span>
              <div style={{display: 'flex', gap: '16px', fontSize: '13px', color: '#8C8478', fontWeight: 500}}>
                <span style={{color: !power ? '#E8E5DD' : '#8C8478', textShadow: !power ? '0 1px 2px #000' : 'none', transition: 'color 0.3s'}}>Off</span>
                <span style={{color: power ? '#E8E5DD' : '#8C8478', textShadow: power ? '0 1px 2px #000' : 'none', transition: 'color 0.3s'}}>On</span>
              </div>
            </div>
            {/* Round circle power button wrapper */}
            <div style={{ position: 'relative' }}>
              <button
                className={`radio-power-btn ${power ? 'on' : ''}`}
                onPointerDown={() => togglePower(!power)}
                title={power ? 'Turn Off' : 'Turn On'}
              >
                {/* Power icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="radio-power-icon">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ═══════ EXTRA CONTROLS (Bottom panel for app features) ═══════ */}
    <div className="extra-panel">
      <button className={`power-btn ${power?"on":""}`} onClick={()=>void togglePower()}>
        <div className="power-led"/>
      </button>
      
      <div className="info-bar">
        <div className="info-freq">{power ? formatFrequency(band,freq) : "---"}</div>
        <div className="info-station">{power?(station?station.name:"TUNING…"):"STANDBY"}</div>
      </div>
      
      <button className="ctrl-btn" onClick={()=>setMuted(m=>!m)}>{muted?"UNMUTE":"MUTE"}</button>
      
      {presets.map((p,i)=>(
        <button key={i} className="preset-btn"
          onClick={()=>{
             if (holdRef.current) { holdRef.current=false; return; }
             playKnobThud();
             const pr = presets[i]; setModeIdx(pr.band==="FM"?1:2); setFreq(pr.frequency);
          }}
          onContextMenu={e=>{e.preventDefault(); playKnobTick(1.5); setPresets(prev => { const c=[...prev]; c[i]={band,frequency:freq}; return c; });}}
          title={`P${i+1}: ${formatFrequency(p.band,p.frequency)} ${p.band}`}>
          P{i+1}
        </button>
      ))}
    </div>

    {/* Spotify-like Playlist Modal */}
    {showPlaylist && createPortal(
      <div className="popup-overlay" onClick={() => setShowPlaylist(false)} style={{ zIndex: 9999 }}>
        <div className="playlist-modal" onClick={e => e.stopPropagation()}>
          <div className="playlist-header">
            <h2 className="playlist-title">PLAYLISTS</h2>
            <button className="playlist-close" onClick={() => setShowPlaylist(false)}>✕</button>
          </div>
          
          <div className="playlist-tabs">
            {Object.keys(PLAYLIST_DATA).map(cat => (
              <button 
                key={cat} 
                className={`playlist-tab ${activeCat === cat ? 'active' : ''}`}
                onClick={() => { setActiveCat(cat); setActiveSong(0); }}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="playlist-desc">
            The main curated {activeCat.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())} playlist.
          </div>
          
          <div className="playlist-tracks">
            {PLAYLIST_DATA[activeCat]?.map((song, idx) => (
              <div 
                key={idx} 
                className={`playlist-track-row ${activeSong === idx ? 'playing' : ''}`}
                onClick={() => { 
                  setActiveSong(idx); 
                  setShowPlaylist(false); 
                }}
              >
                <div className="track-number">{(idx + 1).toString().padStart(2, '0')}</div>
                <img className="track-thumb" src={song.img} alt={song.title} />
                <div className="track-info">
                  <div className="track-name">{song.title}</div>
                  <div className="track-artist">{song.artist}</div>
                </div>
                <div className="track-duration">{song.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── YouTube Player (Hidden visually but needs to be rendered for API to work) ── */}
    <div style={{ position: 'absolute', opacity: 0.01, pointerEvents: 'none', width: '200px', height: '200px', top: '-9999px', left: '-9999px', zIndex: -1 }}>
      <YouTube 
        opts={{ playerVars: { autoplay: 1, controls: 0 } }} 
        onReady={(e) => setYtPlayer(e.target)} 
        onStateChange={(e) => {
          if (e.data === 0) { // ENDED
             const current = stateRef.current;
             const nextSong = (current.activeSong + 1) % (PLAYLIST_DATA[current.activeCat]?.length || 1);
             setActiveSong(nextSong);
          }
        }}
      />
    </div>
    </>
  );
}
