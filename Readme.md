# JARCADIO SF-I — Digital Organ & Synthesizer

JARCADIO SF-I is a professional-grade web-based digital organ and synthesizer. It offers a low-latency musical experience directly in the browser, featuring multi-touch support, octave control, and a responsive design optimized for both desktop and mobile devices.

https://github.com/user-attachments/assets/289f0ed9-4990-42aa-9254-450e1ca914c2

## 🚀 Live Preview
You can try the fully functional synthesizer here: [JARCADIO SF-I Live Demo](https://alejandro-solis.epizy.com/Developed_Projects/Keyboard/)

## ✨ Features
- **High-Fidelity Audio:** Powered by Tone.js and Web Audio API.
- **Polyphonic Capabilities:** Play multiple notes simultaneously with smooth synthesis.
- **Dynamic Octave Shift:** Easily navigate through different musical ranges.
- **Sustain Pedal Simulation:** Integrated sustain toggle for expressive playing.
- **Responsive Interface:** Optimized for landscape mode on mobile devices with orientation alerts.
- **Interactive Key Mapping:** Visual feedback for both mouse/touch and PC keyboard inputs.

## 🛠️ Built With
- **Tone.js:** For the audio synthesis engine.
- **JavaScript (ES6+):** Core logic and event handling.
- **CSS3:** Custom styling with a retro-futuristic dark theme.
- **HTML5:** Semantic structure and UI layout.

## 📁 Project Structure
```text
.
├── index.html       # Core Logic & UI
├── script.js        # Main JavaScript logic
├── style.css        # Visual styles and animations
└── Tone.js          # Audio Web Sound Engine library
```

### ⚙️ Installation & Setup

To run this project locally and explore the source code, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tu-usuario/JARCADIO-SF-I-Digital-Organ.git
   cd JARCADIO-SF-I-Digital-Organ
   ```

2. **No External Dependencies:** This project includes `Tone.js` locally. You don't need to run `npm install` or download additional assets.

3. **Run a Local Server:** To avoid CORS (Cross-Origin Resource Sharing) issues when loading the audio engine and styles, it is recommended to use a local server rather than opening the file directly:

   * **Using VS Code:** Install the **Live Server** extension, right-click `index.html` and select "Open with Live Server".
   * **Using Python:** Run the following command in your terminal:
     ```bash
     python3 -m http.server 8000
     ```
     Then go to `http://localhost:8000` in your browser.


## 🎹 How to Use
1. **Mouse/Touch:** Click or tap the keys directly on the screen.
2. **PC Keyboard:** Use the mapped keys (Q, W, E, R, T, Y, U for white keys, and numeric keys for sharps).
```text
    C#4 D#4     F#4 G#4 A#4         C#5 D#5     F#5 G#5 A#5
    [2] [3]     [5] [6] [7]   ...   [s] [d]     [g] [h] [j]   ← first row (blacks)
  [q] [w] [e] [r] [t] [y] [u] ... [z] [x] [c] [v] [b] [n] [m] ← main row (whites)
  C4  D4  E4  F4  G4  A4  B4      C5  D5  E5  F5  G5  A5  B5
````  
3. **Octave Control:** Use the arrow buttons to shift the keyboard range.
4. **Sustain:** Toggle the "SUSTAIN" button to hold notes.

## 📄 License
This project is licensed under the MIT License.

### 🤝 Credits & Acknowledgments

  * **Lead Developer:**  Alejandro Solis (Electronic Engineer)
  * **AI Collaborative Support:** **Claude (Anthropic):** Assisted in the initial core logic and UI architecture.
  * **Inspiration:** Developed as a practical application of **Virtual Instrumentation** and Digital Signal Processing (DSP) applied to web environments.
  * **Sound Engine:** Built with [Tone.js](https://tonejs.github.io/), an incredible framework for creating interactive music in the browser.

---
Developed by **Alejandro Solis** | [LinkedIn](https://www.linkedin.com/in/alejandrosolis2020) | [GitHub](https://github.com/Alejandro-Solis-Saldivia/)
