import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import flowerImg from "./assets/flower.png";
import flower1Img from "./assets/flower1.png";
import radioImg from "./assets/radio.png";
import alponaImg from "./assets/alpona.png";
import logo1Img from "./assets/logo1.png";

export function ContentPage() {
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

  const downloadSlide = async (id: string, filename: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Temporarily hide UI or button if needed, but we capture specific id
    const canvas = await html2canvas(el, { 
      scale: 4, // 540x675 * 4 = 2160x2700 (Ultra HD)
      useCORS: true, 
      backgroundColor: '#fffdf7',
      onclone: (clonedDoc, clonedEl) => {
        // Strip the transform scale before capturing so it renders at full size!
        clonedEl.style.transform = 'none';
      }
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadAllSlides = async () => {
    // Show a downloading indicator or just proceed (UI will freeze slightly during capture)
    const zip = new JSZip();
    
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`slide-${i}`);
      if (!el) continue;
      
      const canvas = await html2canvas(el, { 
        scale: 4, 
        useCORS: true, 
        backgroundColor: '#fffdf7',
        onclone: (clonedDoc, clonedEl) => {
          clonedEl.style.transform = 'none';
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      
      zip.file(`the_radio_slide${i}.png`, base64Data, {base64: true});
    }
    
    const content = await zip.generateAsync({type: "blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "The_Radio_Instagram_Deck.zip";
    link.click();
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    width: '270px' // Scaled down visual width
  };

  const innerSlideWrapperStyle: React.CSSProperties = {
    width: '270px',
    height: '337.5px', // Exactly half of 675
    position: 'relative'
  };

  const slideStyle: React.CSSProperties = {
    width: '540px',
    height: '675px',
    minWidth: '540px',
    minHeight: '675px',
    backgroundColor: '#fffdf7',
    position: 'absolute',
    top: 0,
    left: 0,
    transform: 'scale(0.5)',
    transformOrigin: 'top left',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '30px 20px',
    boxSizing: 'border-box',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
    borderRadius: '0', // Sharp corners for Instagram realism
    fontFamily: "'SeasonMix', serif" // Force inheritance inside slides
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#11110F',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 20px',
      gap: '40px',
      fontFamily: "'SeasonMix', serif",
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <div style={{ color: '#E8E5DD', textAlign: 'center', marginBottom: '10px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '42px', margin: 0, color: '#8a2b2b', textShadow: '0 2px 10px rgba(138,43,43,0.3)' }}>Instagram Carousels</h2>
        <p style={{ opacity: 0.8, marginTop: '8px', fontSize: '18px' }}>Download these perfectly sized 4:5 slides for your Instagram.</p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        width: '100%',
        maxWidth: '1800px', // Allow full desktop width
        margin: '0 auto',
        paddingBottom: '40px'
      }}>

        {/* EXPORT HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px 24px',
          borderRadius: '12px',
          marginBottom: '-10px',
          boxSizing: 'border-box'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '20px', letterSpacing: '1px' }}>Instagram Deck</div>
          <button onClick={downloadAllSlides} style={{
            padding: '12px 28px', 
            background: 'linear-gradient(135deg, #8a2b2b, #6b2121)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontSize: '18px', 
            boxShadow: '0 8px 24px rgba(138,43,43,0.4)', 
            fontFamily: "'SeasonMix', serif", 
            letterSpacing: '1px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >Download All (5)</button>
        </div>

        {/* SLIDE 1 */}
        <div style={wrapperStyle}>
          <div style={innerSlideWrapperStyle}>
            <div id="slide-1" style={{...slideStyle, isolation: 'isolate'}}>
              {/* Background watermark */}
              <img src={flowerImg} alt="" style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '100%',
                opacity: 0.03, // Very faint background
                pointerEvents: 'none'
              }} />
              
              <div style={{ textAlign: 'center', zIndex: 1, marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{
                  color: '#8a2b2b',
                  fontSize: '64px',
                  margin: '0',
                  lineHeight: 1,
                  fontWeight: 'bold',
                  textShadow: '0 4px 12px rgba(138, 43, 43, 0.15)'
                }}>The Radio</h1>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '16px 0' }}>
                  <img src={coloredAlpona} alt="" style={{ height: '14px', opacity: 0.8 }} />
                </div>

                <div style={{
                  color: '#8a2b2b',
                  fontSize: '18px',
                  margin: 0,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  fontWeight: 'normal'
                }}>Devi Paksha Edition</div>
                
                <p style={{
                  color: '#4a3b34',
                  fontSize: '20px',
                  marginTop: '16px',
                  lineHeight: 1.4,
                  fontWeight: 'normal',
                  opacity: 0.85
                }}>A completely immersive auditory simulation.</p>
              </div>

              <div style={{ zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', flex: 1, width: '100%' }}>
                <img src={radioImg} alt="Radio" style={{
                  width: '95%', // Keep side spaces visible
                  maxWidth: 'none',
                  filter: 'drop-shadow(0px -10px 40px rgba(138,43,43,0.35))',
                  position: 'absolute',
                  bottom: '-25px', // Sit flush with the bottom without chopping the volume knob
                  left: '50%',
                  transform: 'translateX(-50%)'
                }} />
              </div>
            </div>
          </div>
          <button onClick={() => downloadSlide('slide-1', 'the_radio_slide1.png')} style={{
            padding: '12px 24px', background: '#8a2b2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%', boxShadow: '0 4px 12px rgba(138,43,43,0.3)', fontFamily: "'SeasonMix', serif", letterSpacing: '1px'
          }}>Download Slide 1</button>
        </div>

        {/* SLIDE 2: Curated Playlists */}
        <div style={wrapperStyle}>
          <div style={innerSlideWrapperStyle}>
            <div id="slide-2" style={{...slideStyle, justifyContent: 'center'}}>
              <img src={flowerImg} alt="" style={{
                position: 'absolute',
                top: '20%',
                right: '-30%',
                width: '140%',
                opacity: 0.05,
                pointerEvents: 'none'
              }} />

              <div style={{ zIndex: 1, width: '100%', padding: '0 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left', flex: 1, boxSizing: 'border-box' }}>
                <h1 style={{
                  color: '#8a2b2b',
                  fontSize: '60px',
                  margin: '0 0 16px 0',
                  lineHeight: 1.05,
                  fontWeight: 'bold'
                }}>Curated<br/>Auditory<br/>Journey</h1>
                
                <img src={coloredAlpona} alt="" style={{ height: '14px', marginBottom: '32px', opacity: 0.8 }} />
                
                <p style={{
                  color: '#4a3b34',
                  fontSize: '22px',
                  lineHeight: 1.6,
                  margin: '0 0 20px 0',
                  fontWeight: 'normal'
                }}>
                  Switch seamlessly between exclusive <span style={{color: '#8a2b2b'}}>Mahalaya</span> broadcasts and iconic <span style={{color: '#8a2b2b'}}>Durga Pujo</span> anthems.
                </p>
                
                <p style={{
                  color: '#7a6358',
                  fontSize: '18px',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 'normal'
                }}>
                  A digital playlist perfectly integrated into the retro dial.
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => downloadSlide('slide-2', 'the_radio_slide2.png')} style={{
            padding: '12px 24px', background: '#8a2b2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%', boxShadow: '0 4px 12px rgba(138,43,43,0.3)', fontFamily: "'SeasonMix', serif", letterSpacing: '1px'
          }}>Download Slide 2</button>
        </div>

        {/* SLIDE 3: Tactile Realism (Zoomed Radio) */}
        <div style={wrapperStyle}>
          <div style={innerSlideWrapperStyle}>
            <div id="slide-3" style={{...slideStyle, padding: '40px', alignItems: 'flex-start', justifyContent: 'flex-start', isolation: 'isolate'}}>
              
              {/* Background watermark */}
              <img src={flowerImg} alt="" style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '100%',
                opacity: 0.05,
                pointerEvents: 'none',
                zIndex: 0
              }} />

              {/* Original Radio Composition */}
              <div style={{
                position: 'absolute',
                top: '30%',
                right: '-40%',
                width: '160%',
                height: '160%',
                zIndex: 1
              }}>
                <img src={radioImg} alt="Radio Knobs" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: '80% 50%',
                  filter: 'drop-shadow(0px 30px 40px rgba(138,43,43,0.3))'
                }} />
              </div>

              {/* Completely transparent text block floating in the top left */}
              <div style={{ zIndex: 2, maxWidth: '85%' }}>
                <h1 style={{
                  color: '#8a2b2b',
                  fontSize: '52px',
                  margin: '0 0 16px 0',
                  lineHeight: 1.1,
                  letterSpacing: '1px',
                  fontWeight: 'bold'
                }}>Tactile<br/>Realism</h1>
                
                <p style={{
                  color: '#4a3b34',
                  fontSize: '22px',
                  lineHeight: 1.5,
                  margin: 0,
                  fontWeight: 'normal'
                }}>
                  Rotate the knobs. Hear the heavy mechanical clicks. Feel the nostalgia.
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => downloadSlide('slide-3', 'the_radio_slide3.png')} style={{
            padding: '12px 24px', background: '#8a2b2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%', boxShadow: '0 4px 12px rgba(138,43,43,0.3)', fontFamily: "'SeasonMix', serif", letterSpacing: '1px'
          }}>Download Slide 3</button>
        </div>

        {/* SLIDE 4: Key Features */}
        <div style={wrapperStyle}>
          <div style={innerSlideWrapperStyle}>
            <div id="slide-4" style={{...slideStyle, justifyContent: 'center'}}>
              <img src={flowerImg} alt="" style={{
                position: 'absolute',
                top: '-20%',
                left: '-20%',
                width: '100%',
                opacity: 0.05,
                pointerEvents: 'none'
              }} />

              <div style={{ zIndex: 1, textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{
                  color: '#8a2b2b',
                  fontSize: '48px',
                  margin: '0',
                  lineHeight: 1.1,
                  fontWeight: 'bold'
                }}>Immersive<br/>Features</h1>
                <img src={coloredAlpona} alt="" style={{ height: '14px', margin: '16px 0', opacity: 0.8 }} />
              </div>

              <div style={{ zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { title: "Realistic Simulation", desc: "Fully interactive 3D styled knobs." },
                  { title: "Tuning Mechanics", desc: "Moving indicator needle with authentic static." },
                  { title: "Digital Mode", desc: "Switch from FM to sleek curated playlists." },
                  { title: "Tactile Audio", desc: "Heavy mechanical clicks and thud sounds." }
                ].map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255,253,247,0.85)', padding: '12px 20px', borderRadius: '0', border: '1px solid rgba(138,43,43,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                      <span style={{ fontSize: '32px', color: '#8a2b2b', lineHeight: 1 }}>{i + 1}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ color: '#8a2b2b', fontSize: '20px', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                        {feature.title}
                      </div>
                      <div style={{ color: '#7a6358', fontSize: '15px', lineHeight: 1.3, fontWeight: 'normal' }}>
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => downloadSlide('slide-4', 'the_radio_slide4.png')} style={{
            padding: '12px 24px', background: '#8a2b2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%', boxShadow: '0 4px 12px rgba(138,43,43,0.3)', fontFamily: "'SeasonMix', serif", letterSpacing: '1px'
          }}>Download Slide 4</button>
        </div>

        {/* SLIDE 5: Call to action / QR */}
        <div style={wrapperStyle}>
          <div style={innerSlideWrapperStyle}>
            <div id="slide-5" style={{...slideStyle, justifyContent: 'center'}}>
              <img src={flowerImg} alt="" style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-20%',
                width: '130%',
                opacity: 0.08,
                pointerEvents: 'none',
                transform: 'rotate(180deg)'
              }} />

              <div style={{ textAlign: 'center', zIndex: 1, marginBottom: '30px' }}>
                <h1 style={{
                  color: '#8a2b2b',
                  fontSize: '48px',
                  margin: '0 0 16px 0',
                  lineHeight: 1.1,
                  fontWeight: 'bold'
                }}>Experience<br/>The Magic</h1>
                <p style={{ color: '#7a6358', fontSize: '20px', margin: 0, fontWeight: 'normal' }}>
                  Scan the code below to tune in live.
                </p>
              </div>

              <div style={{
                padding: '24px',
                background: 'white',
                borderRadius: '0',
                boxShadow: '0 24px 48px rgba(138, 43, 43, 0.15)',
                zIndex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '2px solid rgba(138, 43, 43, 0.1)'
              }}>
                <QRCodeCanvas 
                  value="https://the-radio.vercel.app"
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#8a2b2b" // Professional burgundy QR code
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: logo1Img, // Use logo to excavate the hole perfectly
                    x: undefined,
                    y: undefined,
                    height: 60,
                    width: 60,
                    excavate: true,
                  }}
                />
                <img src={logo1Img} alt="Logo" style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'contain' 
                }} />
              </div>

              <div style={{ zIndex: 1, textAlign: 'center', marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={coloredAlpona} alt="" style={{ height: '16px', margin: '0 0 20px 0', opacity: 0.8 }} />
                <p style={{
                  color: '#8a2b2b',
                  fontSize: '24px',
                  margin: 0,
                  letterSpacing: '1px'
                }}>the-radio.vercel.app</p>
              </div>
            </div>
          </div>
          <button onClick={() => downloadSlide('slide-5', 'the_radio_slide5.png')} style={{
            padding: '12px 24px', background: '#8a2b2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%', boxShadow: '0 4px 12px rgba(138,43,43,0.3)', fontFamily: "'SeasonMix', serif", letterSpacing: '1px'
          }}>Download Slide 5</button>
        </div>

      </div>
    </div>
  );
}
