import { useState, useEffect } from "react";
import { Radio } from "./components/Radio";
import flowerImg from "./assets/flower.png";
import souradeep from "./assets/souradeep.png";
import sampurna from "./assets/sampurna.png";
import spotify from "./assets/spotify.png";

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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
              <div className="qr-placeholder-content">QR Code</div>
            </div>

            <span className="contact-prompt mt-4">Scan with any UPI app</span>

            <div className="email-pill mt-2">
              <span className="email-text">yourname@upi</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('yourname@upi')}>
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
                <span className="email-text">example@gmail.com</span>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText('example@gmail.com')}>
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
          <div className="creators-modal-large" style={{ backgroundColor: '#ffffff', color: '#1a1a1a', padding: '40px 32px' }}>
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-tr" style={{ opacity: 0.15 }} />
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-bl" style={{ opacity: 0.15 }} />
            
            <button className="close-btn abs-close" onClick={() => setActivePopup(null)} title="Close" style={{ color: '#1a1a1a', background: '#f4ede4' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="modal-subtitle" style={{ color: '#8a2b2b', fontFamily: "'SeasonMix', serif", fontSize: '38px', border: 'none', letterSpacing: '2px', marginBottom: '24px', textTransform: 'none' }}>Puja Calendar 2026</h3>

            <div className="calendar-dates-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(PUJA_DATES).map(([date, event]) => {
                const parts = date.split('-');
                const formatted = `Oct ${parts[1]}`;
                const eventName = event.replace('Subho ', '').replace('Maha ', '');
                return (
                  <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', background: 'rgba(244, 237, 228, 0.3)' }}>
                    <span style={{ fontFamily: "'Switzer', sans-serif", fontWeight: 600, fontSize: '15px', color: '#666', letterSpacing: '0.5px' }}>{formatted.toUpperCase()}</span>
                    <span style={{ fontFamily: "'SeasonMix', serif", fontSize: '26px', color: '#1a1a1a' }}>{eventName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}



      <main className="stage">
        {!radioPower && (
          <div className="stage-hint">
            <div className="stage-hint-text">Click to<br />play!</div>
            <svg className="stage-hint-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {/* Arrow curves from text on beige background, pointing left/down toward the radio's power button */}
              <path d="M80,10 Q40,15 10,65" />
              <polyline points="10,40 10,65 35,62" />
            </svg>
          </div>
        )}
        <Radio onPowerChange={setRadioPower} />
      </main>
    </>
  );
}
