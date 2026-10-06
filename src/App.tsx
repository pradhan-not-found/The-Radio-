import { useState, useEffect, useRef } from "react";
import html2canvas from 'html2canvas';
import { Radio } from "./components/Radio";
import flowerImg from "./assets/flower.png";
import souradeep from "./assets/souradeep.png";
import sampurna from "./assets/sampurna.png";
import spotify from "./assets/spotify.png";
import { QRCodeSVG } from 'qrcode.react';

const PUJA_DATES: Record<string, string> = {
  "10-10": "Subho Mahalaya",
  "10-11": "Subho Prothoma",
  "10-12": "Subho Dwitiya",
  "10-13": "Subho Tritiya",
  "10-14": "Subho Chaturthi",
  "10-15": "Subho Panchami",
  "10-16": "Subho Maha Shashthi",
  "10-17": "Subho Maha Saptami",
  "10-18": "Subho Maha Ashtami",
  "10-19": "Subho Maha Navami",
  "10-20": "Subho Bijoya Dashami",
};

const VerifiedTick = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" style={{marginLeft: '4px', display: 'inline-block', verticalAlign: 'text-bottom'}}>
    <path d="m23 12-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"></path>
  </svg>
);

function getGreeting(date: Date) {
  const monthDay = `${date.getMonth() + 1}-${date.getDate()}`;
  if (PUJA_DATES[monthDay]) {
    return { text: PUJA_DATES[monthDay], isFestive: true };
  }
  
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return { text: "Good Morning", isFestive: false };
  if (hour >= 12 && hour < 17) return { text: "Good Afternoon", isFestive: false };
  if (hour >= 17 && hour < 21) return { text: "Good Evening", isFestive: false };
  return { text: "Good Night", isFestive: false };
}

export function App() {
  const [now, setNow] = useState(new Date());
  const [onlineCount, setOnlineCount] = useState(127);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [radioPower, setRadioPower] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!calendarRef.current) return;
    
    // Create a clone to prevent visual jumping during download
    const clone = calendarRef.current.cloneNode(true) as HTMLElement;
    
    // Append to same parent to preserve inherited styles, but hide it offscreen
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.transform = 'none';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.zIndex = '-1';
    
    calendarRef.current.parentElement?.appendChild(clone);

    const watermark = clone.querySelector('#calendar-watermark') as HTMLElement;
    if (watermark) watermark.style.display = 'flex';

    const innerContainer = clone.querySelector('.calendar-dates-container') as HTMLElement;
    if (innerContainer) {
      innerContainer.style.overflowY = 'visible';
      innerContainer.style.maxHeight = 'none';
    }

    try {
      // Small delay to ensure DOM updates applied
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(clone, { 
        backgroundColor: '#fffdf7', 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = 'puja-calendar-2026.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      clone.remove();
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    const onlineTimer = setInterval(() => {
      setOnlineCount(prev => Math.max(100, prev + Math.floor(Math.random() * 7) - 3));
    }, 4500);
    return () => {
      clearInterval(timer);
      clearInterval(onlineTimer);
    };
  }, []);

  const greetingInfo = getGreeting(now);
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const pujoDate = new Date("2026-10-16T00:00:00");
  const daysLeft = Math.max(0, Math.ceil((pujoDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));

  return (
    <>
      <img src={flowerImg} alt="" className="bg-flower flower-tr" />
      <img src={flowerImg} alt="" className="bg-flower flower-bl" />
      
      <div className="occasion-text">
        <div className="date">{formattedDate}</div>
        <div className="greeting">
          {greetingInfo.text} {greetingInfo.isFestive && <span className="lotus">🪷</span>}
        </div>
      </div>

      <div className="center-pill">
        <div className="live-status">
          <span className="live-dot" />
          <span>{onlineCount} Online</span>
        </div>
        <div className="nav-divider" />
        <div className="countdown">
          {daysLeft} Days to Pujo
        </div>
      </div>

      <header className="top-nav">
        <div className="nav-item-container">
          <button className="nav-icon-btn" onClick={() => setActivePopup(activePopup === 'tea' ? null : 'tea')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </button>
        </div>

        <div className="nav-item-container">
          <button className="nav-icon-btn" onClick={() => setActivePopup(activePopup === 'creators' ? null : 'creators')} title="Creators">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </div>

        <div className="nav-item-container">
          <button className="nav-icon-btn" onClick={() => setActivePopup(activePopup === 'calendar' ? null : 'calendar')} title="Puja Calendar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>

        <div className="nav-divider" />

        <a href="https://spotify.com" target="_blank" rel="noopener noreferrer" className="spotify-link" title="Listen on Spotify">
          <img src={spotify} alt="Spotify" />
          <svg className="redirect-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </a>
      </header>

      {/* MODALS */}
      {activePopup === 'tea' && (
        <>
          <div className="modal-backdrop" onClick={() => setActivePopup(null)} />
          <div className="creators-modal-large">
            <button className="close-btn abs-close" onClick={() => setActivePopup(null)} title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="modal-subtitle">BUY US A CHAI</h3>

            <p className="chai-description">
              If The Radio made your Pujo a little nicer, you know what to do. One cup of chai, and we're back to the adda.
            </p>

            <div className="qr-box-large">
              <QRCodeSVG
                value="upi://pay?pa=souradeeppradhan7@okicici&pn=The%20Radio&cu=INR"
                size={170}
                bgColor="#E8E5DD"
                fgColor="#1a1a1a"
                level="H"
                imageSettings={{
                  src: "/favicon.ico",
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            <span className="contact-prompt mt-4">Scan with any UPI app</span>

            <div className="email-pill mt-2">
              <span className="email-text">souradeeppradhan7@okicici</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('souradeeppradhan7@okicici')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                COPY
              </button>
            </div>
          </div>
        </>
      )}

      {activePopup === 'creators' && (
        <>
          <div className="modal-backdrop" onClick={() => setActivePopup(null)} />
          <div className="creators-modal-large">
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-tr" />
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-bl" />
            
            <button className="close-btn abs-close" onClick={() => setActivePopup(null)} title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="modal-subtitle">MADE WITH BHALOBASHA BY</h3>

            <div className="creator-cards-container">
              <div className="creator-card-lg">
                <img src={souradeep} alt="Souradeep Pradhan" className="creator-avatar-lg" />
                <h4 className="creator-name-lg">Souradeep Pradhan <VerifiedTick /></h4>
                <div className="creator-socials">
                  <a href="#" className="social-icon" title="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                  <a href="#" className="social-icon" title="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="creator-card-lg">
                <img src={sampurna} alt="Sampurna Chandra" className="creator-avatar-lg" />
                <h4 className="creator-name-lg">Sampurna Chandra <VerifiedTick /></h4>
                <div className="creator-socials">
                  <a href="#" className="social-icon" title="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                  <a href="#" className="social-icon" title="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="modal-divider"></div>

            <div className="modal-footer-contact">
              <span className="contact-prompt">Want to get in touch?</span>
              <div className="email-pill">
                <span className="email-text">souradeeppradhan7@gmail.com</span>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText('souradeeppradhan7@gmail.com')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  COPY
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activePopup === 'calendar' && (
        <>
          <div className="modal-backdrop" onClick={() => setActivePopup(null)} />
          <div className="creators-modal-large calendar-modal" ref={calendarRef}>
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-tr" style={{ opacity: 0.1, width: '200px' }} />
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-bl" style={{ opacity: 0.1, width: '200px' }} />
            
            <button className="close-btn abs-close" data-html2canvas-ignore onClick={() => setActivePopup(null)} title="Close" style={{ color: '#1a1a1a', background: '#f4ede4' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <button className="download-btn" data-html2canvas-ignore onClick={handleDownload} title="Download Calendar" style={{ position: 'absolute', top: '16px', left: '16px', background: '#f4ede4', color: '#1a1a1a', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <h3 className="modal-subtitle" style={{ color: '#8a2b2b', fontFamily: "'SeasonMix', serif", fontSize: 'clamp(28px, 8vw, 42px)', border: 'none', letterSpacing: '1px', marginBottom: '8px', textTransform: 'none', textAlign: 'center' }}>Puja Calendar</h3>
              <svg width="120" height="20" viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10C30 10 30 0 50 0C70 0 70 10 90 10C110 10 110 20 130 20C150 20 150 10 170 10" stroke="#8a2b2b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" opacity="0.4" transform="scale(0.6) translate(10, 5)"/>
                <circle cx="60" cy="10" r="4" fill="#8a2b2b" opacity="0.6" />
                <path d="M50 10 L45 5 L55 5 Z" fill="#d4af37" transform="rotate(45 50 10)" opacity="0.8"/>
                <path d="M70 10 L65 5 L75 5 Z" fill="#d4af37" transform="rotate(-45 70 10)" opacity="0.8"/>
                <line x1="10" y1="10" x2="40" y2="10" stroke="#d4af37" strokeWidth="1" opacity="0.5"/>
                <line x1="80" y1="10" x2="110" y2="10" stroke="#d4af37" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>

            <div className="calendar-dates-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '8px' }}>
              {Object.entries(PUJA_DATES).map(([date, event]) => {
                const parts = date.split('-');
                const formatted = `Oct ${parts[1]}`;
                const eventName = event.replace('Subho ', '').replace('Maha ', '');
                const eventWords = eventName.split(' ');
                
                return (
                  <div key={date} className="calendar-row">
                    <span style={{ fontFamily: "'Switzer', sans-serif", fontWeight: 600, fontSize: 'clamp(14px, 4vw, 16px)', color: '#8a2b2b', letterSpacing: '0.5px', flexShrink: 0 }}>{formatted.toUpperCase()}</span>
                    <span style={{ fontFamily: "'SeasonMix', serif", fontSize: 'clamp(18px, 5.5vw, 26px)', color: '#1a1a1a', textAlign: 'right', lineHeight: 1.2 }}>
                      {eventWords.map((word, i) => <span key={i} style={{ display: 'block' }}>{word}</span>)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div id="calendar-watermark" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(138,43,43,0.15)', gap: '12px', width: '100%' }}>
              <img src="/favicon.ico" alt="The Radio" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
              <span style={{ fontFamily: "'SeasonMix', serif", fontSize: '20px', color: '#8a2b2b', fontWeight: 'bold', letterSpacing: '1px' }}>Curated by The Radio</span>
            </div>
          </div>
        </>
      )}



      <main className="stage">
        {!radioPower && (
          <div className="stage-hint">
            <div className="stage-hint-text">Click to<br />play!</div>
            <svg className="stage-hint-arrow desktop-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M80,10 Q40,15 10,65" />
              <polyline points="10,40 10,65 35,62" />
            </svg>
            <svg className="stage-hint-arrow mobile-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M30,80 Q45,45 30,10" />
              <polyline points="15,25 30,10 45,25" />
            </svg>
          </div>
        )}
        <Radio onPowerChange={setRadioPower} />
      </main>
    </>
  );
}
