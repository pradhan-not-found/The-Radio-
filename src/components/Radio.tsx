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

  const MUSIC_LIBRARY: Record<string, { offset: number, count: number }> = {
    'DURGA PUJA':     { offset: 0, count: 7 },
    'MAHALAYA':       { offset: 5, count: 2 },
    'MAHALAYA SONGS': { offset: 10, count: 2 },
  };

  const PLAYLIST_DATA: Record<string, { title: string, artist: string, duration: string, img: string }[]> = {
    'DURGA PUJA': [
      { title: 'Dugga Elo', artist: 'Monali Thakur', duration: '2:27', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80' },
      { title: 'Dugga Ma (Original Motion Picture Soundtrack)', artist: 'Arijit Singh', duration: '4:31', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' },
      { title: 'Ebar Jeno Onno Rokom Pujo', artist: 'Nakash Aziz Official', duration: '3:33', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' },
      { title: 'Dhak Baja Kashor Baja', artist: 'Shreya Ghoshal Official', duration: '4:26', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=80' },
      { title: 'Bolo Dugga Elo', artist: 'Kaushik-Guddu', duration: '3:20', img: 'https://images.unsplash.com/photo-1516280440502-a2fc99496c53?w=100&q=80' },
      { title: 'Aamaar Dugga', artist: 'Monali Thakur', duration: '3:20', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&q=80' },
      { title: 'Dhaker Taley', artist: 'Abhijeet', duration: '4:43', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80' }
    ],
    'MAHALAYA': [
      { title: 'Mahisasuramardini - Full', artist: 'Birendra Krishna Bhadra', duration: '1:28:00', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' },
      { title: 'Ya Chandi', artist: 'Chorus', duration: '4:15', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' }
    ],
    'MAHALAYA SONGS': [
      { title: 'Jago Tumi Jago', artist: 'Sujata Sarkar', duration: '3:45', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=80' },
      { title: 'Bajlo Tomar Alor Benu', artist: 'Supriti Ghosh', duration: '4:10', img: 'https://images.unsplash.com/photo-1516280440502-a2fc99496c53?w=100&q=80' }
    ]
  };

  const [activeCat, setActiveCat] = useState('DURGA PUJA');
  const [activeSong, setActiveSong] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const [level,    setLevel]    = useState(0);
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [ytData,   setYtData]   = useState<{title: string, videoId: string, category: string} | null>(null);
  
  const holdRef = useRef(false);

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
    radioAudio.setMix(power ? signal : 0, 1.0, muted || !power);
    // Removed radioAudio.tuneTo() so WebAudio doesn't play the MP3s
  }, [muted, power, signal]);

  useEffect(() => { 
    void applyAudio(); 
    if (power) void radioAudio.power(true); 
  }, [applyAudio, power]);

  // Sync YouTube Player
  useEffect(() => {
    if (ytPlayer && ytPlayer.playVideo) {
      if (power && (modeIdx === 2 || lock) && !muted) {
        ytPlayer.playVideo();
      } else {
        ytPlayer.pauseVideo();
      }
    }
  }, [power, lock, muted, modeIdx, ytPlayer]);

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
            <div className="digital-content" style={{ display: 'flex', width: '100%', padding: '12px', gap: '16px', zIndex: 10 }}>
              
              {/* Left side: Thumbnail */}
              <div className="digital-thumbnail">
                {ytData ? (
                  <img 
                    src={`https://img.youtube.com/vi/${ytData.videoId}/hqdefault.jpg`} 
                    alt="Thumbnail" 
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80'; }}
                  />
                ) : (
                  <div className="digital-placeholder" />
                )}
              </div>
              
              {/* Right side: Dropdowns & Controls */}
              <div className="digital-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                
                <div className="digital-top-bar" style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="browse-playlist-btn" 
                    onClick={() => setShowPlaylist(true)}
                    disabled={!power}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/></svg>
                    Browse Playlists
                  </button>
                </div>

                <div className="digital-title" title={PLAYLIST_DATA[activeCat]?.[activeSong]?.title || ytData?.title || 'No signal'}>
                  {power ? (PLAYLIST_DATA[activeCat]?.[activeSong]?.title || ytData?.title || 'Tuning...') : 'POWER OFF'}
                </div>
                
                <div className="digital-controls">
                  <button className="digital-ctrl-btn" disabled={!power} onClick={() => { ytPlayer?.pauseVideo(); setMuted(true); }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </button>
                  <button className="digital-ctrl-btn" disabled={!power} onClick={() => { ytPlayer?.playVideo(); setMuted(false); }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <button className="digital-ctrl-btn" disabled={!power} onClick={() => { 
                    const nextSong = (activeSong + 1) % MUSIC_LIBRARY[activeCat].count;
                    setActiveSong(nextSong);
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
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
            value={modeIdx !== 2 ? freq : level * 100}
            min={band==="FM"?FM_MIN:AM_MIN}
            max={band==="FM"?FM_MAX:AM_MAX}
            size={76}
            soundType="tune"
            onChange={v => modeIdx !== 2 && setFreq(clampFrequency(band,v))}
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
                onClick={() => { setActiveSong(idx); ytPlayer?.playVideo(); setShowPlaylist(false); }}
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
        opts={{ playerVars: { autoplay: 0, controls: 0, loop: 1, listType: 'playlist', list: 'PLJAiFJ6bGyew' } }} 
        onReady={(e) => setYtPlayer(e.target)} 
      />
    </div>
    </>
  );
}
