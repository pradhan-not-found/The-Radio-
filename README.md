# 📻 The Radio (Devi Paksha Edition)

![The Radio Preview](https://img.shields.io/badge/Status-Live-success) ![React](https://img.shields.io/badge/React-18.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)

A meticulously crafted, hyper-realistic web-based Radio experience. Built to emulate the tactile satisfaction of physical vintage hardware while delivering modern, high-quality audio streaming. 

This special **Devi Paksha Edition** comes pre-loaded with curated Mahalaya broadcasts and Durga Puja playlists.

## ✨ Features

- **True-to-Life 3D UI**: Fully CSS-rendered hardware components. No image placeholders—everything from the tactile volume knobs and tuning dial to the glowing LED indicators and multi-piece physical buttons are built using advanced CSS 3D transforms, gradients, and dynamic drop shadows.
- **Dual Broadcasting Modes**:
  - **📻 AM Mode (Analog)**: Authentic radio static generation using the native **Web Audio API**. Features frequency-based tuning, dynamic white-noise generation, and a responsive analog VU meter.
  - **🎵 FM Mode (Digital)**: Crystal clear digital streaming powered by a custom YouTube iframe integration. Includes a beautifully designed Spotify-style modal to browse and select curated playlists.
- **📱 True Background Play**: Deep integration with the browser's `MediaSession` API allows for uninterrupted playback and native lock-screen media controls on mobile devices (iOS & Android).
- **Responsive Excellence**: Fluidly scales from 4K desktop monitors down to mobile screens, maintaining its vintage aspect ratio and tactile usability everywhere.
- **🤝 Integrated Support System**: Built-in interactive donation modal featuring a highly optimized, universally scannable UPI QR code.

## 🛠️ Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Pure Vanilla CSS (CSS Variables, Flexbox/Grid, 3D Transforms, custom `@font-face`)
- **Audio Engine**: Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`)
- **Media Handling**: `react-player` (YouTube integration) & `navigator.mediaSession`

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed (v16 or higher).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pradhan-not-found/The-Radio-.git
   ```
2. Navigate to the project directory:
   ```bash
   cd "The Radio"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and visit `http://localhost:5173/`

## 🎨 Design Philosophy

The aesthetic of **The Radio** relies on a clean, beige editorial tone (`#E8E5DD`) paired with high-contrast hardware elements. Every interaction—from flipping the power switch to pressing the background play button—is accompanied by a realistic tactile UI change and a synchronized mechanical sound effect.

## 👨‍💻 Created By

Made with Bhalobasha (Love) by **Souradeep Pradhan**
- [LinkedIn](https://www.linkedin.com/in/souradeep-pradhan/)
- [Instagram](https://www.instagram.com/pradhan_da/)
- [X (Twitter)](https://x.com/bysoura)
