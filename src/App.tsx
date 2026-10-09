import { useState, useEffect, useRef } from "react";
import html2canvas from 'html2canvas';
import { Radio } from "./components/Radio";
import flowerImg from "./assets/flower.webp";
import souradeep from "./assets/souradeep.webp";
import spotify from "./assets/spotify.webp";
import { QRCodeCanvas } from 'qrcode.react';
import flower1Img from "./assets/flower1.webp";
import alponaImg from "./assets/alpona.webp";
import logo1Img from "./assets/logo1.webp";
const PUJA_DATES: Record<string, string> = {
  "10-10": "Subho Mahalaya",
  "10-11": "Subho Prothoma",
  "10-12": "Subho Dwitiya",
  "10-13": "Subho Tritiya",
  "10-14": "Subho Chaturthi",
  "10-15": "Subho Panchami",
  "10-16": "Subho Maha Shashthi",
  "10-17": "Subho Maha Saptami",
  "10-18": "Subho Maha Saptami",
  "10-19": "Subho Maha Ashtami",
  "10-20": "Subho Maha Navami",
  "10-21": "Subho Bijoya Dashami",
};

const VerifiedTick = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="url(#goldGradient)" style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="100%" stopColor="#D49A36" />
      </linearGradient>
    </defs>
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
  const [onlineCount, setOnlineCount] = useState(() => {
    const today = new Date();
    const isMahalaya = today.getMonth() === 9 && today.getDate() === 10;
    if (isMahalaya) {
      return 890 + Math.floor(Math.random() * (2345 - 890 + 1));
    }
    return 123 + Math.floor(Math.random() * (345 - 123 + 1));
  });
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [radioPower, setRadioPower] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [coloredAlpona, setColoredAlpona] = useState<string>(alponaImg);

  useEffect(() => {
    const img = new Image();
    img.src = alponaImg;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#8a2b2b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setColoredAlpona(canvas.toDataURL("image/png"));
    };
  }, []);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };
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
    
    // Professional Poster Formatting
    clone.style.width = '900px';
    clone.style.padding = '60px 80px';
    clone.style.borderRadius = '0'; // Flat professional image look
    
    calendarRef.current.parentElement?.appendChild(clone);

    const watermark = clone.querySelector('#calendar-watermark') as HTMLElement;
    if (watermark) {
      watermark.style.display = 'flex';
      watermark.style.marginTop = '60px';
    }

    const innerContainer = clone.querySelector('.calendar-dates-container') as HTMLElement;
    if (innerContainer) {
      innerContainer.style.overflowY = 'visible';
      innerContainer.style.maxHeight = 'none';
      innerContainer.style.display = 'grid';
      innerContainer.style.gridTemplateColumns = '1fr 1fr'; // Split into 2 columns for a balanced aspect ratio
      innerContainer.style.gap = '20px 40px';
      innerContainer.style.paddingRight = '0';
      innerContainer.style.marginTop = '30px';
    }

    // Enhance the decorative flowers for the larger poster size
    const flowers = clone.querySelectorAll('.modal-bg-flower');
    flowers.forEach(f => {
      (f as HTMLElement).style.width = '350px';
      (f as HTMLElement).style.opacity = '0.12';
    });

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
    const timer = setInterval(() => setNow(new Date()), 1000);
    const onlineTimer = setInterval(() => {
      setOnlineCount(prev => {
        const today = new Date();
        const isMahalaya = today.getMonth() === 9 && today.getDate() === 10;
        
        // Fluctuate by -5 to +5
        let change = Math.floor(Math.random() * 11) - 5;
        // On Mahalaya, fluctuate a bit more wildly since numbers are bigger
        if (isMahalaya) change = Math.floor(Math.random() * 41) - 20; 
        
        let next = prev + change;
        
        if (isMahalaya) {
           if (next < 890) next = 890 + Math.floor(Math.random() * 20);
           if (next > 2345) next = 2345 - Math.floor(Math.random() * 20);
        } else {
           if (next < 123) next = 123 + Math.floor(Math.random() * 5);
           if (next > 345) next = 345 - Math.floor(Math.random() * 5);
        }
        return next;
      });
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
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  const pujoDate = new Date("2026-10-16T00:00:00");
  const daysLeft = Math.max(0, Math.ceil((pujoDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));

  return (
    <>
      <img src={flowerImg} alt="" className="bg-flower flower-tr" loading="eager" fetchPriority="high" />
      <img src={flowerImg} alt="" className="bg-flower flower-bl" loading="eager" fetchPriority="high" />
      
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
        <div className="countdown" style={{ gap: '4px' }}>
          {daysLeft} Days to Pujo
          <img src={flower1Img} alt="" style={{ height: '18px', width: 'auto', opacity: 0.9, transform: 'translateY(-1px)' }} />
        </div>
      </div>

      <header className="top-nav">
        <div className="nav-item-container">
          <button className="nav-icon-btn nav-tooltip-container" onClick={() => setActivePopup(activePopup === 'tea' ? null : 'tea')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
            <div className="custom-tooltip">Support Us</div>
          </button>
        </div>

        <div className="nav-item-container">
          <button className="nav-icon-btn nav-tooltip-container" onClick={() => setActivePopup(activePopup === 'creators' ? null : 'creators')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 592.832 592.832" fill="currentColor" stroke="currentColor" strokeWidth="35" strokeLinejoin="round" className="nav-svg">
              <path d="M480.416,309.333c0-15.125-31.168-70.912-46.72-97.813c1.429-7.68,4.053-25.237,4.053-51.52 c0-45.547-60.288-160-202.667-160C95.285,0,32.416,106.048,32.416,181.333c0,53.248,31.445,107.819,56.725,151.616 c14.72,25.536,28.608,49.643,28.608,61.717c0,27.157-44.16,80.981-61.184,99.435c-3.989,4.331-3.712,11.072,0.619,15.061 c2.048,1.92,4.651,2.837,7.232,2.837c2.88,0,5.739-1.152,7.829-3.435c6.848-7.403,66.837-73.536,66.837-113.899 c0-17.792-13.888-41.877-31.467-72.363c-24-41.6-53.867-93.419-53.867-140.971c0-52.203,44.331-160,181.333-160 c136,0,181.333,109.312,181.333,138.667c0,32.64-4.309,50.581-4.352,50.795c-0.661,2.688-0.256,5.547,1.131,7.936 c21.461,36.864,45.12,82.069,45.909,90.453c-0.981,2.944-12.032,8.64-23.552,11.072c-2.987,0.619-5.547,2.496-7.061,5.12 c-1.515,2.645-1.835,5.803-0.875,8.683l8.576,25.749l-5.995,5.995c-2.624,2.624-3.392,6.251-2.709,9.643 c-1.472,0.704-2.944,1.536-4.352,2.773c-3.072,2.709-6.72,7.787-6.72,16.448c0,8.533,3.584,13.867,6.208,17.771 c2.581,3.883,4.459,6.699,4.459,14.229c0,8.32-3.179,14.72-44.395,21.483c-28.181,4.608-94.272,28.267-94.272,53.184 c0,5.888,4.629,11.499,10.517,11.499c5.909,0,10.517-3.947,10.539-9.835c3.776-7.616,41.643-28.075,76.672-33.813 c26.261-4.267,62.272-10.155,62.272-42.517c0-14.059-4.864-21.312-8.085-26.112c-2.155-3.221-2.581-4.011-3.904-5.973 c5.845,0.832,11.179-3.435,11.904-9.259c0.277-2.24-0.32-4.331-1.301-6.187l8.917-8.917c2.859-2.859,3.861-7.083,2.581-10.923 l-7.125-21.376C463.669,333.696,480.416,324.992,480.416,309.333z" />
              <path d="M331.04,162.283c0-27.157-19.093-50.773-44.437-54.891c-15.659-2.517-31.467,1.813-43.413,11.968 c-3.051,2.603-5.781,5.504-8.128,8.64c-2.347-3.136-5.077-6.037-8.128-8.64c-11.925-10.155-27.733-14.507-43.413-11.968 c-25.323,4.139-44.437,27.755-44.437,56.277c0,14.251,5.547,27.648,15.616,37.717l72.832,72.832 c2.091,2.069,4.821,3.115,7.552,3.115c2.731,0,5.461-1.045,7.509-3.136l72.832-72.832 C325.493,191.275,331.04,177.92,331.04,162.283z M300.384,186.304l-65.301,65.28l-65.301-65.28 c-6.037-6.037-9.365-14.101-9.365-24c0-16.832,11.413-31.36,26.539-33.835c1.856-0.32,3.691-0.469,5.504-0.469 c7.616,0,14.805,2.603,20.672,7.595c7.168,6.123,11.285,15.019,11.285,24.405c0,5.888,4.779,10.667,10.667,10.667 s10.667-4.779,10.667-10.667c0-9.387,4.117-18.283,11.285-24.384c7.253-6.187,16.597-8.661,26.155-7.168 c15.147,2.475,26.56,17.003,26.56,35.221C309.749,172.096,306.336,180.331,300.384,186.304z" />
            </svg>
            <div className="custom-tooltip">Creator</div>
          </button>
        </div>

        <div className="nav-item-container">
          <button className="nav-icon-btn nav-tooltip-container" onClick={() => setActivePopup(activePopup === 'calendar' ? null : 'calendar')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div className="custom-tooltip">Puja Calendar</div>
          </button>
        </div>

        <div className="nav-divider" />

        <a href="https://open.spotify.com/playlist/0SKKks3QMZ0IQcaoy3L3f9?si=8L7vba1WTRWB7JGsABYayQ&utm_source=copy-link&pi=M1OrbgwqSh6GE" target="_blank" rel="noopener noreferrer" className="spotify-link nav-tooltip-container">
          <img src={spotify} alt="Spotify" loading="eager" fetchPriority="high" />
          <svg className="redirect-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
          <div className="custom-tooltip">Listen on Spotify</div>
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
              <QRCodeCanvas
                value="upi://pay?pa=souradeeppradhan7@okicici&pn=The%20Radio&cu=INR"
                size={220} // Render large for crispness
                style={{ width: '100%', height: '100%' }} // Fluidly fill the responsive CSS container
                bgColor="#E8E5DD"
                fgColor="#1a1a1a"
                level="H"
                imageSettings={{
                  src: logo1Img,
                  height: 40,
                  width: 40,
                  excavate: true, // Clear dots behind logo for 100% universal scanner compatibility
                }}
              />
            </div>

            <span className="contact-prompt mt-4">Scan with any UPI app</span>

            <div className="email-pill mt-2">
              <span className="email-text">souradeeppradhan7@okicici</span>
              <button className="copy-btn" onClick={() => handleCopy('souradeeppradhan7@okicici')} style={{ width: '85px' }}>
                {copiedText === 'souradeeppradhan7@okicici' ? (
                  <span style={{ color: '#88d49e' }}>COPIED!</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    COPY
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {activePopup === 'creators' && (
        <>
          <div className="modal-backdrop" onClick={() => setActivePopup(null)} />
          <div className="creators-modal-large">
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-tr" loading="eager" fetchPriority="high" />
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-bl" loading="eager" fetchPriority="high" />
            
            <button className="close-btn abs-close" onClick={() => setActivePopup(null)} title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="modal-subtitle">MADE WITH BHALOBASHA BY</h3>

            <div className="creator-cards-container">
              <div className="creator-card-lg">
                <img src={souradeep} alt="Souradeep Pradhan" className="creator-avatar-lg" loading="eager" fetchPriority="high" />
                <h4 className="creator-name-lg">
                  Souradeep Pradhan
                  <VerifiedTick />
                </h4>
                <div className="creator-socials">
                  <a href="https://www.linkedin.com/in/souradeep-pradhan/" target="_blank" rel="noopener noreferrer" className="social-icon" title="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/pradhan_da/" target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a href="https://x.com/bysoura" target="_blank" rel="noopener noreferrer" className="social-icon" title="X (Twitter)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
                <button className="copy-btn" onClick={() => handleCopy('souradeeppradhan7@gmail.com')} style={{ width: '85px' }}>
                  {copiedText === 'souradeeppradhan7@gmail.com' ? (
                    <span style={{ color: '#88d49e' }}>COPIED!</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      COPY
                    </>
                  )}
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
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-tr" style={{ opacity: 0.1, width: '200px' }} loading="eager" fetchPriority="high" />
            <img src={flowerImg} alt="" className="modal-bg-flower modal-flower-bl" style={{ opacity: 0.1, width: '200px' }} loading="eager" fetchPriority="high" />
            
            <button className="close-btn abs-close" data-html2canvas-ignore onClick={() => setActivePopup(null)} title="Close" style={{ color: '#1a1a1a', background: '#f4ede4' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <button className="download-btn" data-html2canvas-ignore onClick={handleDownload} title="Download Calendar" style={{ position: 'absolute', top: '24px', left: '24px', background: '#f4ede4', color: '#1a1a1a', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <h3 className="modal-subtitle" style={{ color: '#8a2b2b', fontFamily: "'SeasonMix', serif", fontSize: 'clamp(28px, 8vw, 42px)', border: 'none', letterSpacing: '1px', marginBottom: '8px', textTransform: 'none', textAlign: 'center' }}>Puja Calendar</h3>
              <img src={coloredAlpona} alt="" crossOrigin="anonymous" style={{ 
                height: '24px', 
                width: 'auto', 
                opacity: 0.85
              }} />
            </div>

            <div className="calendar-dates-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', overflowY: 'auto', touchAction: 'pan-y', flex: 1, minHeight: 0, paddingRight: '8px' }}>
              {Object.entries(PUJA_DATES).map(([date, event]) => {
                const parts = date.split('-');
                const formatted = `Oct ${parts[1]}`;
                const eventName = event.replace('Subho ', '').replace('Maha ', '');
                const eventWords = eventName.split(' ');
                
                return (
                  <div key={date} className="calendar-row">
                    <span style={{ fontFamily: "'Switzer', sans-serif", fontWeight: 600, fontSize: 'clamp(14px, 4vw, 16px)', color: '#8a2b2b', letterSpacing: '0.5px', flexShrink: 0 }}>{formatted.toUpperCase()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: "'SeasonMix', serif", fontSize: 'clamp(18px, 5.5vw, 26px)', color: '#1a1a1a', textAlign: 'right', lineHeight: 1.2 }}>
                        {eventName}
                      </span>
                      <img src={flower1Img} alt="" style={{ height: 'clamp(14px, 4vw, 18px)', width: 'auto', opacity: 0.85 }} />
                    </span>
                  </div>
                );
              })}
            </div>
            

            
            <div id="calendar-watermark" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(138,43,43,0.15)', gap: '12px', width: '100%' }}>
              <img src="/favicon.ico" alt="The Radio" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} loading="eager" fetchPriority="high" />
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

      <div className="footer-time">
        {formattedTime}
      </div>
    </>
  );
}
