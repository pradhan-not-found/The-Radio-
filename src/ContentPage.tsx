import { QRCodeCanvas } from 'qrcode.react';
import flowerImg from "./assets/flower.png";

export function ContentPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fffdf7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <img src={flowerImg} alt="" style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        opacity: 0.1,
        pointerEvents: 'none'
      }} />
      <img src={flowerImg} alt="" style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '50vw',
        opacity: 0.1,
        pointerEvents: 'none',
        transform: 'rotate(180deg)'
      }} />

      <div style={{
        background: '#ffffff',
        padding: '60px 80px',
        borderRadius: '32px',
        boxShadow: '0 24px 64px rgba(138, 43, 43, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        zIndex: 10,
        position: 'relative',
        border: '1px solid rgba(138, 43, 43, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'SeasonMix', serif",
            color: '#8a2b2b',
            fontSize: '84px',
            margin: '0 0 12px 0',
            lineHeight: 1,
            textShadow: '0 4px 12px rgba(138, 43, 43, 0.2)'
          }}>The Radio</h1>
          <p style={{
            color: '#7a6358',
            fontSize: '24px',
            margin: 0,
            fontFamily: "'SeasonMix', serif",
            letterSpacing: '3px'
          }}>EXPERIENCE THE MAGIC</p>
        </div>

        <div style={{
          padding: '20px',
          background: '#fffdf7',
          borderRadius: '24px',
          border: '3px dashed #8a2b2b',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <QRCodeCanvas 
            value="https://the-radio.vercel.app"
            size={300}
            bgColor="#fffdf7"
            fgColor="#2a2220"
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "/favicon.ico",
              x: undefined,
              y: undefined,
              height: 72,
              width: 72,
              excavate: true,
            }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#7a6358',
            fontSize: '20px',
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>Scan to Listen</p>
          <p style={{
            color: '#8a2b2b',
            fontSize: '18px',
            margin: 0,
            opacity: 0.8,
            fontFamily: 'monospace'
          }}>the-radio.vercel.app</p>
        </div>
      </div>
    </div>
  );
}
