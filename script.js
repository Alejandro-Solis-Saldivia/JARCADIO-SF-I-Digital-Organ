    /* ============================================================
        JARCADIO SF-I — Digital Organ & Synthesizer (Main Script v1.0.0)
       ============================================================
          Developed by : Alejandro Jose Solis Saldivia
          Assistance AI : Claude (Anthropic) - claude.ai 
          Date : 2026
       ============================================================ */

    /* ──────────────────────────────────────────────
        MUSICAL CONFIGURATION
       ────────────────────────────────────────────── */

    const NOTES    = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const IS_BLACK = [false,true,false,true,false,false,true,false,true,false,true,false];

    /**
     *  PC Key Map → relative semitone (0 = C in actual octave).
     *
     *  Keyboard layout:
     * 
     *    C#4 D#4     F#4 G#4 A#4         C#5 D#5     F#5 G#5 A#5
     *    [2] [3]     [5] [6] [7]   ...   [s] [d]     [g] [h] [j]   ← first row (blacks)
     *  [q] [w] [e] [r] [t] [y] [u] ... [z] [x] [c] [v] [b] [n] [m] ← main row (whites)
     *  C4  D4  E4  F4  G4  A4  B4      C5  D5  E5  F5  G5  A5  B5
     */

    const KEY_MAP = {
      'q': 0, '2': 1, 'w': 2, '3': 3, 'e': 4, 'r': 5, '5': 6, 't': 7, '6': 8, 'y': 9,
      '7':10, 'u':11, 'z':12, 's':13, 'x':14, 'd':15, 'c':16, 'v':17, 'g':18, 'b':19,
      'h':20, 'n':21, 'j':22, 'm':23,
    };

    /* ──────────────────────────────────────────────
        GLOBAL STATE
       ────────────────────────────────────────────── */
    let currentOctave  = 4;
    let sustainActive  = false;
    let sustainedNotes = new Set();
    let activeKeys     = new Set();
    const MAX_OCT = 6, MIN_OCT = 2;
    const NUM_OCTAVES = 2;
    const TOTAL_WHITES = NUM_OCTAVES * 7; // Number of white keys in total: 14

    /* ──────────────────────────────────────────────
        KEY SIZES
        Keyboard dimensions are calculated in computeKeySize() 
        before each render. Black key sizes aren't in CSS in order to 
        do the positioning mathematically exact.
       ────────────────────────────────────────────── */
    let KEY_W = 52;  // white key width (px)
    let KEY_H = 180; // white key height (px)
    let BLK_W = 33;  // black key width (px)
    let BLK_H = 112; // black key height (px)

    /**
     * Calculates the optimum size for the keys in order to make the 
     * keyboard to fit in the available space of the keyboard-section.
     *
     * Keys fixed proportions (classical piano):
     *   BLK_W = 64% de KEY_W
     *   KEY_H = KEY_W × 3.3
     *   BLK_H = 62% de KEY_H
     *
     * Key_W is limited between 18px (minimum usable) and 56px (aesthetic).
     */
    function computeKeySize() {
      const section  = document.getElementById('keyboard-section');
      /* Remove internal padding: 14px on both sides = 28px */
      const available = section.clientWidth - 28;
      const rawW      = Math.floor(available / TOTAL_WHITES);

      KEY_W = Math.max(18, Math.min(56, rawW));
      KEY_H = Math.round(KEY_W * 3.3);
      BLK_W = Math.round(KEY_W * 0.64);
      BLK_H = Math.round(KEY_H * 0.62);
    }

    /* ──────────────────────────────────────────────
        AUDIO ENGINE (TONE.JS)
        Lazy initialization (first user gesture).
        Modern browsers require that the AudioContext
        is created or restarted from a user event.
       ────────────────────────────────────────────── */
    let reverb     = null;
    let masterVol  = null;
    let synth      = null;
    let audioReady = false;

    async function initAudio() {
      if (audioReady) return;
      await Tone.start();
      reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
      await reverb.ready;
      masterVol = new Tone.Volume(
        parseFloat(document.getElementById('vol-knob').value)
      ).connect(reverb);
      synth = createSynth(document.getElementById('timbre-select').value);
      audioReady = true;
    }

    /** 
     * Create sound synthesizer based on selected timbre.
     * Free previous one to avoid memory leaks.
     * @param {string} type
     */
    function createSynth(type) {
      if (synth) { synth.dispose(); synth = null; }
    
      const presets = {
        organ: {
          Type: 'AMSynth',
          options: {
            harmonicity: 2,
            detune: 0,
            oscillator: { type: 'fatsine4' },
            envelope:   { attack: 0.02, decay: 0.4, sustain: 0.0, release: 1.8 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.05, decay: 0.3, sustain: 0.0, release: 0.5 },
            volume: 10
          }
        },
        piano: {
          Type: 'PolySynth',
          options: {
            voice: Tone.Synth,
            maxPolyphony: 12,
            options: {
              oscillator: { type: 'triangle' },
              envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.2 }
            }
          }
        },
        synth: {
          Type: 'PolySynth',
          options: {
            voice: Tone.Synth,
            maxPolyphony: 8,
            options: {
              oscillator: { type: 'sawtooth' },
              envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.4 }
            }
          }
        },
        pad: {
          Type: 'PolySynth',
          options: {
            voice: Tone.Synth,
            maxPolyphony: 8,
            options: {
              oscillator: { type: 'sine' },
              envelope: { attack: 0.6, decay: 0.3, sustain: 0.8, release: 1.5 }
            }
          }
        },
        strings: {
          Type: 'PolySynth',
          options: {
            voice: Tone.Synth,
            maxPolyphony: 8,
            options: {
              oscillator: { type: 'sawtooth' },
              envelope: { attack: 0.3, decay: 0.1, sustain: 0.7, release: 0.8 }
            }
          }
        },
        bass: {
          Type: 'MonoSynth',
          options: {
            oscillator: { type: 'square' },
            envelope:   { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.4 },
            filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.4, baseFrequency: 200, octaves: 2 }
          }
        }
      };

      const p = presets[type];
      let s;
      if (p.Type === 'AMSynth') {
        s = new Tone.AMSynth(p.options);
      } else if (p.Type === 'MonoSynth') {
        s = new Tone.MonoSynth(p.options);
      } else {
        s = new Tone.PolySynth(p.options.voice, p.options.options);
        s.maxPolyphony = p.options.maxPolyphony || 8;
      }
      s.connect(masterVol);
      return s;
    }

    /* ──────────────────────────────────────────────
        CONTROL PANEL
       ────────────────────────────────────────────── */
    function changeTimbre(val) { if (audioReady) synth = createSynth(val); }
    function changeVolume(v)   { if (masterVol) masterVol.volume.value = parseFloat(v); }
    function changeReverb(v)   { if (reverb) reverb.wet.value = parseFloat(v); }

    function toggleSustain() {
      sustainActive = !sustainActive;
      document.getElementById('sustain-btn').classList.toggle('active', sustainActive);
      if (!sustainActive) {
        sustainedNotes.forEach(n => { try { synth.triggerRelease(n); } catch(e){} });
        sustainedNotes.clear();
      }
      deactivateElement();
    }

    function changeOctave(delta) {
      currentOctave = Math.min(MAX_OCT, Math.max(MIN_OCT, currentOctave + delta));
      document.getElementById('oct-display').textContent = currentOctave;
      document.getElementById('led-oct').textContent = `OCTAVE ${currentOctave}`;
      updateOctaveDots();
      buildKeyboard();
      buildKeymap();
      deactivateElement();
    }

    /* ──────────────────────────────────────────────
        KEYBOARD CONSTRUCTION
       ────────────────────────────────────────────
        Black key positions — exact formula:
       ────────────────────────────────────────────
        WHITE_INDEX[semitono] = number of white keys 
        before this semitone in the octave:
          C=0, D=1, E=2, F=3, G=4, A=5, B=6
          C#(1) → white index 0 (between C and D)
          D#(3) → white index 1 (between D and E)
          F#(6) → white index 3 (between F and G)
          G#(8) → white index 4 (between G and A)
          A#(10) → white index 5 (between A and B)

        For a black key in semitone S of octave O:
         globalWhiteIdx = O*7 + WHITE_INDEX[S]
         left = (globalWhiteIdx + 1) * KEY_W - BLK_W/2

        This centers the black key exactly on the right 
        edge of its white counterpart to its left.
    ────────────────────────────────────────────── */

    /**
     * Index of white key in the LEFT side of each semitone.
     * For white semitones: its own white index.
     * For black semitones: the index of the white key at its left.
     */
    const WHITE_INDEX = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

    /** Note Map → DOM element */
    let allKeyElements = {};

    /** Build a complete keyboard.
     *  1. Calculate key sizes based on available screen width.
     *  2. Create and position all keys (black and white).
     *  3. Attach mouse events to each key.
     *  4. Attach touch events to the container.
     */
    function buildKeyboard() {
      computeKeySize();

      const keyboard = document.getElementById('keyboard');
      keyboard.innerHTML = '';
      allKeyElements = {};

      /* Dimensions of the container calculated with precision */
      keyboard.style.width  = `${TOTAL_WHITES * KEY_W}px`;
      keyboard.style.height = `${KEY_H}px`;

      for (let oct = 0; oct < NUM_OCTAVES; oct++) {
        for (let semi = 0; semi < 12; semi++) {
          const noteStr = `${NOTES[semi]}${currentOctave + oct}`;
          const isBlack = IS_BLACK[semi];

          const key = document.createElement('div');
          key.className    = isBlack ? 'key-black' : 'key-white';
          key.dataset.note = noteStr;

          /* Note label (proportional size to the key) */
          const lbl = document.createElement('div');
          lbl.className   = 'key-label';
          lbl.style.fontSize = `${Math.max(6, KEY_W * 0.16)}px`;
          lbl.textContent = noteStr.replace('#','♯');
          key.appendChild(lbl);

          if (!isBlack) {
            /* ── WHITE KEY ──
               globalWhiteIdx = oct*7 + WHITE_INDEX[semi]
               left = globalWhiteIdx * KEY_W
               width = KEY_W - 1  (the -1 creates a visual gap of 1px between whites)
            */
            const wIdx = oct * 7 + WHITE_INDEX[semi];
            key.style.left   = `${wIdx * KEY_W}px`;
            key.style.width  = `${KEY_W - 1}px`;
            key.style.height = `${KEY_H}px`;
          } else {
            /* ── BLACK KEY ──
               Centers it on the right edge between its white counterpart's left and right.
               globalWhiteIdx = oct*7 + WHITE_INDEX[semi]
               left = (globalWhiteIdx + 1) * KEY_W - BLK_W/2
            */
            const wIdx = oct * 7 + WHITE_INDEX[semi];
            const xPos = (wIdx + 1) * KEY_W - Math.round(BLK_W / 2);
            key.style.left   = `${xPos}px`;
            key.style.width  = `${BLK_W}px`;
            key.style.height = `${BLK_H}px`;
          }

          /* ── MOUSE EVENTS ──
             Attach mouse events directly to each key, 
             not the container. This prevents scroll/zoom 
             interfering with panel control sliders and buttons.
             
             Mouse and touch coexist without conflict.
          */
          key.addEventListener('mousedown', e => {
            /* preventDefault prevents text selection but does not block focus */
            if(e.cancelable) e.preventDefault();
            playNote(noteStr);
          });
          key.addEventListener('mouseup',    () => stopNote(noteStr));
          key.addEventListener('mouseleave', () => stopNote(noteStr));

          keyboard.appendChild(key);
          allKeyElements[noteStr] = key;
        }
      }

      /* Attach multi-touch events to the container (after populating the DOM) */
      attachTouchListeners(keyboard);
    }

    /* ──────────────────────────────────────────────
        MULTI-TOUCH EVENTS
       ────────────────────────────────────────────
        A Map<touchIdentifier → noteString> is used to track 
        which note each finger touches. This allows for chords 
        (multiple notes played simultaneously) and glide (sliding 
        between keys).

        Use _touchHandlers on the container to store references 
        to handlers, avoiding using cloneNode() to eliminate 
        event listeners on keys.
      ────────────────────────────────────────────── */

    const touchNoteMap = new Map(); // identifier → noteString

    /** Find out which note corresponds to a touch point */
    function getNoteFromTouch(touch) {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return null;
      const keyEl = el.closest('[data-note]');
      return keyEl ? keyEl.dataset.note : null;
    }

    /** Register touch event handlers on the container.
     * Remove previous ones using the references stored in _touchHandlers.
     * Do not clone the node (cloning destroyed mouse event listeners on keys).
     */
    function attachTouchListeners(keyboard) {
      /* Remove old listeners if any */
      if (keyboard._touchHandlers) {
        const h = keyboard._touchHandlers;
        keyboard.removeEventListener('touchstart',  h.start);
        keyboard.removeEventListener('touchmove',   h.move);
        keyboard.removeEventListener('touchend',    h.end);
        keyboard.removeEventListener('touchcancel', h.cancel);
      }

      /* touchstart: new finger(s) touches the screen */
      const onStart = e => {
        if(e.cancelable) e.preventDefault(); // blocks scroll/zoom in the keyboard zone
        Array.from(e.changedTouches).forEach(t => {
          const note = getNoteFromTouch(t);
          if (note) { touchNoteMap.set(t.identifier, note); playNote(note); }
        });
      };

      /* touchmove: finger slides (glide between keys) */
      const onMove = e => {
        if(e.cancelable) e.preventDefault();
        Array.from(e.changedTouches).forEach(t => {
          const newNote = getNoteFromTouch(t);
          const oldNote = touchNoteMap.get(t.identifier);
          if (newNote !== oldNote) {
            if (oldNote) stopNote(oldNote);
            if (newNote) { touchNoteMap.set(t.identifier, newNote); playNote(newNote); }
            else           touchNoteMap.delete(t.identifier);
          }
        });
      };

      /* touchend: finger lifts → releases its note */
      const onEnd = e => {
        if(e.cancelable) e.preventDefault();
        Array.from(e.changedTouches).forEach(t => {
          const note = touchNoteMap.get(t.identifier);
          if (note) { stopNote(note); touchNoteMap.delete(t.identifier); }
        });
      };

      /* touchcancel: SO interrupts gesture → releases affected notes */
      const onCancel = e => {
        Array.from(e.changedTouches).forEach(t => {
          const note = touchNoteMap.get(t.identifier);
          if (note) { stopNote(note); touchNoteMap.delete(t.identifier); }
        });
      };

      keyboard.addEventListener('touchstart',  onStart,  { passive: false });
      keyboard.addEventListener('touchmove',   onMove,   { passive: false });
      keyboard.addEventListener('touchend',    onEnd,    { passive: false });
      keyboard.addEventListener('touchcancel', onCancel, { passive: false });

      /* Store references for cleaning them up in the next rebuild */
      keyboard._touchHandlers = { start:onStart, move:onMove, end:onEnd, cancel:onCancel };
    }

    /* ──────────────────────────────────────────────
        OCTAVE INDICATORS
       ────────────────────────────────────────────── */
    function updateOctaveDots() {
      const c = document.getElementById('oct-dots');
      c.innerHTML = '';
      for (let i = MIN_OCT; i <= MAX_OCT; i++) {
        const dot = document.createElement('div');
        dot.className = 'oct-dot' + (i === currentOctave ? ' active' : '');
        dot.title = `Octava ${i}`;
        dot.addEventListener('click', () => {
          currentOctave = i;
          document.getElementById('oct-display').textContent = i;
          document.getElementById('led-oct').textContent = `OCTAVE ${i}`;
          updateOctaveDots(); buildKeyboard(); buildKeymap();
        });
        c.appendChild(dot);
      }
    }

    /* ──────────────────────────────────────────────
        KEY MAPPING
       ────────────────────────────────────────────── */
    function buildKeymap() {
      const c = document.getElementById('keymap');
      c.innerHTML = '';
      const items = new Array(24);
      Object.entries(KEY_MAP).slice(0, 24).forEach(([k, semi]) => {
        const noteStr = `${NOTES[semi%12]}${currentOctave + Math.floor(semi/12)}`;
        const item = document.createElement('div');
        item.className = 'kmap-item';
        item.innerHTML =
          `<span class="kmap-key">${k.toUpperCase()}</span>` +
          `<span class="kmap-note">${noteStr.replace('#','♯')}</span>`;
        items[semi] = item;
      });
      items.forEach(item => { if (item) c.appendChild(item); });
    }

    /* ──────────────────────────────────────────────
        PLAYBACK
       ────────────────────────────────────────────── */
    function getNoteFromSemitone(semi) {
      return `${NOTES[semi%12]}${currentOctave + Math.floor(semi/12)}`;
    }

    function playNote(noteStr) {
      if (activeKeys.has(noteStr)) return;
      initAudio().then(() => {
        try {
          synth.triggerAttack(noteStr, Tone.now());
          activeKeys.add(noteStr);
          if (sustainActive) sustainedNotes.add(noteStr);
          highlightKey(noteStr, true);
          updateLED(noteStr);
          animateVU(true);
        } catch(e) { console.warn('[JARCADIO] playNote:', e); }
      });
    }

    function stopNote(noteStr) {
      if (!activeKeys.has(noteStr)) return;
      activeKeys.delete(noteStr);
      if (!sustainActive) { try { synth.triggerRelease(noteStr); } catch(e){} }
      highlightKey(noteStr, false);
      if (activeKeys.size === 0) { updateLED(null); animateVU(false); }
    }

    function highlightKey(noteStr, on) {
      const el = allKeyElements[noteStr];
      if (el) el.classList.toggle('active', on);
    }

    /* ──────────────────────────────────────────────
        LED & VU METER
       ────────────────────────────────────────────── */
    function updateLED(noteStr) {
      document.getElementById('led-note').textContent =
        noteStr ? noteStr.replace('#','♯') : '---';
    }

    let vuInterval = null;
    function animateVU(on) {
      const bars = document.querySelectorAll('.vu-bar');
      if (!on) {
        clearInterval(vuInterval); vuInterval = null;
        bars.forEach(b => { b.style.height='5px'; b.style.background='var(--green)'; });
        return;
      }
      if (vuInterval) return;
      vuInterval = setInterval(() => {
        bars.forEach(b => {
          const h = Math.random() * 28 + 5;
          b.style.height     = h + 'px';
          b.style.background = h > 26 ? '#e03c3c' : h > 18 ? '#f0d080' : 'var(--green)';
        });
      }, 80);
    }

    /* ──────────────────────────────────────────────
        COMPUTER KEYBOARD
       ────────────────────────────────────────────── */
    const pressedKeys = new Set();

    document.addEventListener('keydown', e => {


      if (e.repeat) return;
      if (e.key === 'ArrowLeft')  { changeOctave(-1); return; }
      if (e.key === 'ArrowRight') { changeOctave(1);  return; }
      if (e.key === ' ')          { if(e.cancelable) e.preventDefault(); toggleSustain(); return; }

      const k = e.key.toLowerCase();

      if (KEY_MAP[k] === undefined) return;

      if(e.cancelable) e.preventDefault();
      pressedKeys.add(k);
      playNote(getNoteFromSemitone(KEY_MAP[k]));

    });

    document.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();

      if (!pressedKeys.has(k)) return;
      pressedKeys.delete(k);
      if (KEY_MAP[k] !== undefined) stopNote(getNoteFromSemitone(KEY_MAP[k]));
    });

    /* ──────────────────────────────────────────────
        AVOID TO HIGHLITE BUTTON BY PRESSING A KEY
       ────────────────────────────────────────────── */
    function deactivateElement(){
      const focusedElement = document.activeElement;
        
      setTimeout(function() { 
            focusedElement.blur();
      }, 1); // Wait until deactivate the element in order to continue.
    }

    /* ──────────────────────────────────────────────
        SCREEN ORIENTATION
       ────────────────────────────────────────────── */
    const isTouchDevice = () =>
      navigator.maxTouchPoints > 0 || window.matchMedia('(pointer:coarse)').matches;

    function checkOrientation() {
      const overlay    = document.getElementById('orientation-overlay');
      const isPortrait = window.innerHeight > window.innerWidth;
      const isNarrow   = window.innerWidth < 500;
      if (isTouchDevice() && isPortrait && isNarrow) {
        overlay.classList.add('visible');
      } else {
        overlay.classList.remove('visible');
        /* Reconstruct keyboard at new screen width */
        buildKeyboard();
      }
    }

    async function tryLockOrientation() {
      if (!isTouchDevice()) return;
      try { if (screen.orientation?.lock) await screen.orientation.lock('landscape'); }
      catch(e) { /* fallback silently; the overlay serves as a guide */ }
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkOrientation, 150);
    });
    window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200));
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => setTimeout(checkOrientation, 200));
    }