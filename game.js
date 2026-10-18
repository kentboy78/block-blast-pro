/**
 * Block Blast+ Pro — Enhanced iOS Standalone Web Game
 */

// 1. Feature-detected fallback for Declarative Invoker Commands (`commandfor` / `command`)
// Follows modern-web-guidance `declarative-dialog-popover-control`
if (!('commandForElement' in HTMLButtonElement.prototype)) {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('button[commandfor][command]');
    if (!btn) return;
    const targetId = btn.getAttribute('commandfor');
    const cmd = btn.getAttribute('command');
    const target = document.getElementById(targetId);
    if (!target) return;

    if (cmd === 'show-modal' && typeof target.showModal === 'function') {
      target.showModal();
    } else if (cmd === 'close' && typeof target.close === 'function') {
      target.close();
    } else if (cmd === 'toggle-popover' && typeof target.togglePopover === 'function') {
      target.togglePopover();
    } else if (cmd === 'show-popover' && typeof target.showPopover === 'function') {
      target.showPopover();
    } else if (cmd === 'hide-popover' && typeof target.hidePopover === 'function') {
      target.hidePopover();
    }
  });
}

// Register Service Worker for 100% offline iPhone Home Screen Web App support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

const BOARD_SIZE = 8;
const MAX_ENERGY = 5;
const GRID_GAP = 3;

const COLORS = [
  { id: 'coral', css: 'color-coral', hex: '#f43f5e' },
  { id: 'amber', css: 'color-amber', hex: '#f59e0b' },
  { id: 'emerald', css: 'color-emerald', hex: '#10b981' },
  { id: 'sky', css: 'color-sky', hex: '#0ea5e9' },
  { id: 'violet', css: 'color-violet', hex: '#8b5cf6' },
  { id: 'magenta', css: 'color-magenta', hex: '#ec4899' },
  { id: 'lime', css: 'color-lime', hex: '#84cc16' },
  { id: 'cyan', css: 'color-cyan', hex: '#14b8a6' }
];

// Polyomino Shape Library (matrix of 0/1, weight, colorIndex)
const SHAPES = [
  // Single & Dominoes
  { name: 'dot', weight: 6, color: 1, matrix: [[1]] },
  { name: 'domino-h', weight: 9, color: 3, matrix: [[1, 1]] },
  { name: 'domino-v', weight: 9, color: 3, matrix: [[1], [1]] },

  // Trominoes
  { name: 'line3-h', weight: 10, color: 2, matrix: [[1, 1, 1]] },
  { name: 'line3-v', weight: 10, color: 2, matrix: [[1], [1], [1]] },
  { name: 'corner2-tl', weight: 9, color: 0, matrix: [[1, 1], [1, 0]] },
  { name: 'corner2-tr', weight: 9, color: 0, matrix: [[1, 1], [0, 1]] },
  { name: 'corner2-bl', weight: 9, color: 0, matrix: [[1, 0], [1, 1]] },
  { name: 'corner2-br', weight: 9, color: 0, matrix: [[0, 1], [1, 1]] },

  // Tetrominoes
  { name: 'square2x2', weight: 11, color: 1, matrix: [[1, 1], [1, 1]] },
  { name: 'line4-h', weight: 8, color: 3, matrix: [[1, 1, 1, 1]] },
  { name: 'line4-v', weight: 8, color: 3, matrix: [[1], [1], [1], [1]] },
  { name: 't-up', weight: 8, color: 4, matrix: [[0, 1, 0], [1, 1, 1]] },
  { name: 't-down', weight: 8, color: 4, matrix: [[1, 1, 1], [0, 1, 0]] },
  { name: 't-left', weight: 8, color: 4, matrix: [[0, 1], [1, 1], [0, 1]] },
  { name: 't-right', weight: 8, color: 4, matrix: [[1, 0], [1, 1], [1, 0]] },
  { name: 'l-1', weight: 7, color: 5, matrix: [[1, 0], [1, 0], [1, 1]] },
  { name: 'l-2', weight: 7, color: 5, matrix: [[0, 1], [0, 1], [1, 1]] },
  { name: 'l-3', weight: 7, color: 5, matrix: [[1, 1, 1], [1, 0, 0]] },
  { name: 'l-4', weight: 7, color: 5, matrix: [[1, 1, 1], [0, 0, 1]] },
  { name: 'z-h', weight: 7, color: 6, matrix: [[1, 1, 0], [0, 1, 1]] },
  { name: 's-h', weight: 7, color: 6, matrix: [[0, 1, 1], [1, 1, 0]] },
  { name: 'z-v', weight: 6, color: 6, matrix: [[0, 1], [1, 1], [1, 0]] },
  { name: 's-v', weight: 6, color: 6, matrix: [[1, 0], [1, 1], [0, 1]] },

  // Pentominoes & Classic Block Blast Big Shapes
  { name: 'line5-h', weight: 5, color: 7, matrix: [[1, 1, 1, 1, 1]] },
  { name: 'line5-v', weight: 5, color: 7, matrix: [[1], [1], [1], [1], [1]] },
  { name: 'big-corner-tl', weight: 6, color: 0, matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { name: 'big-corner-tr', weight: 6, color: 0, matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
  { name: 'big-corner-bl', weight: 6, color: 0, matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { name: 'big-corner-br', weight: 6, color: 0, matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { name: 'rect-2x3', weight: 5, color: 2, matrix: [[1, 1, 1], [1, 1, 1]] },
  { name: 'rect-3x2', weight: 5, color: 2, matrix: [[1, 1], [1, 1], [1, 1]] },
  { name: 'square3x3', weight: 5, color: 1, matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] }
];

// Tiny 1-sample silent WAV data URI used to unlock iOS AVAudioSession even when the iPhone ringer switch is muted
const SILENT_WAV_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// Synthesized Web Audio Sound Engine (with iOS Silent Switch & Gesture Unlock)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.unlocked = false;
    this.htmlAudioPrimer = null;
    this.setupIOSAudioUnlock();
  }

  setupIOSAudioUnlock() {
    const unlock = () => {
      if (!this.enabled) return;

      // 1. Set iOS 17+ AudioSession type to 'playback' so game sound works even when the iPhone ringer switch is on silent
      if ('audioSession' in navigator && navigator.audioSession) {
        try {
          navigator.audioSession.type = 'playback';
        } catch (_) {}
      }

      // 2. Initialize & resume Web Audio context
      this.init();

      // 3. Play a tiny silent WAV buffer + HTMLAudioElement primer once to unlock iOS WebKit audio hardware
      if (!this.unlocked && this.ctx) {
        try {
          const buf = this.ctx.createBuffer(1, 1, 22050);
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.ctx.destination);
          src.start(0);

          if (!this.htmlAudioPrimer) {
            this.htmlAudioPrimer = new Audio(SILENT_WAV_URI);
            this.htmlAudioPrimer.volume = 0.01;
          }
          const playPromise = this.htmlAudioPrimer.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }

          if (this.ctx.state === 'running') {
            this.unlocked = true;
          }
        } catch (_) {}
      }
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  init() {
    if ('audioSession' in navigator && navigator.audioSession) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (_) {}
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }
  }

  haptic(pattern = 10) {
    if (!this.enabled) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.22, delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const schedule = () => {
      try {
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + duration * 0.5);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      } catch (_) {}
    };

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(schedule).catch(() => {});
    } else {
      schedule();
    }
  }

  playPickup() {
    this.playTone(380, 0.055, 'triangle', 0.18);
    this.haptic(6);
  }

  playPlace() {
    this.playTone(260, 0.075, 'triangle', 0.25);
    this.playTone(390, 0.09, 'sine', 0.22, 0.02);
    this.haptic(10);
  }

  playClear(linesCount, combo) {
    const baseNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    const pitchShift = Math.min(combo - 1, 6) * 45;
    const count = Math.min(linesCount + 2, baseNotes.length);
    for (let i = 0; i < count; i++) {
      this.playTone(baseNotes[i] + pitchShift, 0.22, 'triangle', 0.24, i * 0.05);
    }
    this.haptic([15, 25, 20]);
  }

  playAllClear() {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    chord.forEach((f, idx) => {
      this.playTone(f, 0.34, 'sine', 0.24, idx * 0.055);
    });
    this.haptic([20, 35, 40]);
  }

  playPowerup() {
    this.playTone(440, 0.08, 'sine', 0.2, 0);
    this.playTone(660, 0.13, 'triangle', 0.22, 0.045);
    this.haptic(12);
  }

  playError() {
    this.playTone(170, 0.12, 'sawtooth', 0.15, 0);
    this.haptic([10, 20, 10]);
  }

  playGameOver() {
    const notes = [392.0, 349.23, 311.13, 261.63];
    notes.forEach((f, idx) => {
      this.playTone(f, 0.22, 'triangle', 0.24, idx * 0.12);
    });
    this.haptic([30, 40, 60]);
  }
}

const sfx = new SoundEngine();

// Lightweight Particle FX Engine on Canvas
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  burstCell(r, c, hexColor) {
    if (!this.width) this.resize();
    const cellW = (this.width - 12) / BOARD_SIZE;
    const cx = 6 + (c + 0.5) * cellW;
    const cy = 6 + (r + 0.5) * cellW;

    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4 + (Math.random() - 0.5) * 0.5;
      const speed = 1.6 + Math.random() * 3.0;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: 4 + Math.random() * 4,
        color: hexColor || '#38bdf8',
        alpha: 1
      });
    }

    if (!this.animating) {
      this.animating = true;
      requestAnimationFrame(() => this.loop());
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.alpha -= 0.045;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
    }
  }
}

// Main Game State & Controller
class BlockBlastGame {
  constructor() {
    this.mode = 'pro'; // 'pro' | 'gem' | 'pure'
    this.board = this.createEmptyBoard();
    // Reusable scratch board for preview simulation (zero GC allocation during touch move!)
    this.scratchBoard = this.createEmptyBoard();
    this.score = 0;
    this.bestScores = { pro: 0, gem: 0, pure: 0 };
    this.combo = 0;
    this.maxCombo = 1;
    this.movesSinceClear = 0;
    this.linesClearedTotal = 0;
    this.gemsCollected = 0;
    this.gemTarget = 12;
    this.energy = 2;
    this.tray = [null, null, null];
    this.holdPiece = null;
    this.undoSnapshot = null;
    this.undoUsedThisTray = false;
    this.bombTargeting = false;

    // Drag & Keyboard Interaction State
    this.activeDrag = null;
    this.previewKey = '';
    this.previewedCells = [];
    this.proxyPool = [];
    this.kbdSelection = null;

    this.cacheDOM();
    this.fx = new ParticleSystem(this.fxCanvas);
    this.initBoardDOM();
    this.initProxyPool();
    this.hideFloatingProxy();
    this.bindEvents();
    this.loadSavedState();
  }

  createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );
  }

  cacheDOM() {
    this.boardFrame = document.getElementById('board-frame');
    this.boardGrid = document.getElementById('board-grid');
    this.fxCanvas = document.getElementById('fx-canvas');
    this.floatingBanners = document.getElementById('floating-banners');
    this.scoreEl = document.getElementById('current-score');
    this.bestEl = document.getElementById('best-score');
    this.comboPill = document.getElementById('combo-pill');
    this.comboText = document.getElementById('combo-text');
    this.gemPill = document.getElementById('gem-pill');
    this.gemText = document.getElementById('gem-text');
    this.mercyIndicator = document.getElementById('mercy-indicator');
    this.modeLabel = document.getElementById('current-mode-label');
    this.powerupBar = document.getElementById('powerup-bar');
    this.energyCountEl = document.getElementById('energy-count');
    this.energyFillEl = document.getElementById('energy-fill');
    this.btnRotate = document.getElementById('btn-rotate');
    this.btnBomb = document.getElementById('btn-bomb');
    this.btnReroll = document.getElementById('btn-reroll');
    this.btnUndo = document.getElementById('btn-undo');
    this.undoBadge = document.getElementById('undo-badge');
    this.dockStage = document.querySelector('.dock-stage');
    this.holdVault = document.getElementById('hold-vault');
    this.vaultPlaceholder = document.getElementById('vault-placeholder');
    this.floatingProxy = document.getElementById('floating-drag-piece');
    this.kbdHintBar = document.getElementById('kbd-hint-bar');

    this.handleEls = {
      0: document.getElementById('tray-slot-0'),
      1: document.getElementById('tray-slot-1'),
      2: document.getElementById('tray-slot-2'),
      hold: document.getElementById('tray-slot-hold')
    };

    this.slotEls = {
      0: document.getElementById('piece-slot-0'),
      1: document.getElementById('piece-slot-1'),
      2: document.getElementById('piece-slot-2'),
      hold: document.getElementById('piece-slot-hold')
    };

    this.modeDialog = document.getElementById('mode-dialog');
    this.gameoverDialog = document.getElementById('gameover-dialog');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.soundIcon = document.getElementById('sound-icon');
  }

  initBoardDOM() {
    this.boardGrid.innerHTML = '';
    this.cellEls = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowEls = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute('role', 'gridcell');
        this.boardGrid.appendChild(cell);
        rowEls.push(cell);
      }
      this.cellEls.push(rowEls);
    }
  }

  // Pre-allocate 25 reusable child nodes for the floating proxy so picking up a piece never allocates DOM nodes
  initProxyPool() {
    this.floatingProxy.innerHTML = '';
    this.proxyPool = [];
    for (let i = 0; i < 25; i++) {
      const div = document.createElement('div');
      this.floatingProxy.appendChild(div);
      this.proxyPool.push(div);
    }
  }

  hideFloatingProxy() {
    this.floatingProxy.hidden = true;
    this.floatingProxy.style.display = 'none';
    this.floatingProxy.style.transform = 'translate3d(-9999px, -9999px, 0)';
  }

  bindEvents() {
    this.soundToggleBtn.addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      this.soundToggleBtn.setAttribute('aria-pressed', String(sfx.enabled));
      this.soundIcon.textContent = sfx.enabled ? '🔊' : '🔇';
      if (sfx.enabled) sfx.playPickup();
    });

    document.querySelectorAll('.mode-option-card').forEach((card) => {
      card.addEventListener('click', () => {
        const selectedMode = card.dataset.mode;
        document.querySelectorAll('.mode-option-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        if (this.modeDialog.open) this.modeDialog.close();
        this.startNewGame(selectedMode);
      });
    });

    document.getElementById('restart-current-btn').addEventListener('click', () => {
      if (this.modeDialog.open) this.modeDialog.close();
      this.startNewGame(this.mode);
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
      if (this.gameoverDialog.open) this.gameoverDialog.close();
      this.startNewGame(this.mode);
    });

    const rescueRotateBtn = document.getElementById('rescue-rotate-btn');
    if (rescueRotateBtn) {
      rescueRotateBtn.addEventListener('click', () => {
        if (this.gameoverDialog.open) this.gameoverDialog.close();
        this.useRotatePowerup();
      });
    }

    document.getElementById('rescue-bomb-btn').addEventListener('click', () => {
      if (this.gameoverDialog.open) this.gameoverDialog.close();
      this.executeCenterEmergencyBlast();
    });

    this.btnRotate.addEventListener('click', () => this.useRotatePowerup());
    this.btnBomb.addEventListener('click', () => this.toggleBombMode());
    this.btnReroll.addEventListener('click', () => this.useRerollPowerup());
    this.btnUndo.addEventListener('click', () => this.useUndoPowerup());

    this.boardGrid.addEventListener('pointermove', (e) => {
      if (!this.bombTargeting) return;
      const cell = e.target.closest('.board-cell');
      this.clearBombPreview();
      if (cell) {
        this.showBombPreview(Number(cell.dataset.r), Number(cell.dataset.c));
      }
    });

    this.boardGrid.addEventListener('pointerdown', (e) => {
      if (!this.bombTargeting) return;
      const cell = e.target.closest('.board-cell');
      if (cell) {
        e.preventDefault();
        this.detonateBombAt(Number(cell.dataset.r), Number(cell.dataset.c));
      }
    });

    // Bind dedicated drag handles
    Object.entries(this.handleEls).forEach(([slotKey, handleEl]) => {
      if (handleEl) this.setupDragHandle(slotKey, handleEl);
    });

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  setupDragHandle(slotKey, handle) {
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const piece = this.getPieceFromSlot(slotKey);
      if (!piece) return;

      if (this.bombTargeting) {
        this.cancelBombMode();
      }
      this.cancelKeyboardPlacement();

      event.preventDefault();
      sfx.playPickup();

      // Measure board geometry once on pointerdown (zero forced layout during drag)
      const boardRect = this.boardGrid.getBoundingClientRect();
      const vaultRect = this.mode !== 'pure' ? this.holdVault.getBoundingClientRect() : null;
      const cellStride = (boardRect.width + GRID_GAP) / BOARD_SIZE;
      const cellSize = cellStride - GRID_GAP;

      const rows = piece.matrix.length;
      const cols = piece.matrix[0].length;
      const proxyWidth = cols * cellSize + (cols - 1) * GRID_GAP;
      const proxyHeight = rows * cellSize + (rows - 1) * GRID_GAP;

      // Center horizontally on finger and lift comfortably above thumb on touch devices
      const touchLiftY = event.pointerType === 'touch' ? 76 : 14;
      const offsetX = proxyWidth * 0.5;
      const offsetY = proxyHeight * 0.5 + touchLiftY;

      this.activeDrag = {
        slotKey,
        piece,
        pointerId: event.pointerId,
        boardRect,
        vaultRect,
        cellSize,
        cellStride,
        offsetX,
        offsetY,
        targetCell: null,
        overVault: false
      };
      this.previewKey = '';

      handle.classList.add('dragging', 'dragging-source');
      try {
        handle.setPointerCapture(event.pointerId);
      } catch (_) {}

      this.renderFloatingProxy(piece, cellSize);
      this.updateFloatingProxyPosition(event.clientX, event.clientY);
    });

    handle.addEventListener('pointermove', (event) => {
      if (!this.activeDrag || this.activeDrag.pointerId !== event.pointerId) return;
      this.updateFloatingProxyPosition(event.clientX, event.clientY);
    });

    const finishDrag = (event, cancelled = false) => {
      if (!this.activeDrag || this.activeDrag.pointerId !== event.pointerId) return;
      const drag = this.activeDrag;
      this.activeDrag = null;
      this.previewKey = '';

      handle.classList.remove('dragging', 'dragging-source');
      this.hideFloatingProxy();
      this.holdVault.classList.remove('vault-hover');
      this.clearBoardPreviews();

      if (!cancelled) {
        if (drag.overVault && drag.slotKey !== 'hold' && this.mode !== 'pure') {
          this.swapSlotWithHold(Number(drag.slotKey));
          return;
        }
        if (drag.targetCell) {
          this.placePieceOnBoard(drag.slotKey, drag.piece, drag.targetCell.r, drag.targetCell.c);
          return;
        }
        if (!this.hasAnyValidMove()) {
          this.showGameOverModal(false);
          return;
        }
        if (!this.hasAnyTrayMove() && this.holdPiece && this.canPieceFitAnywhere(this.holdPiece)) {
          this.spawnBanner('💡 Use your piece in HOLD!');
        }
      }
    };

    handle.addEventListener('pointerup', (e) => finishDrag(e, false));
    handle.addEventListener('pointercancel', (e) => finishDrag(e, true));
    handle.addEventListener('lostpointercapture', (e) => finishDrag(e, true));

    handle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const piece = this.getPieceFromSlot(slotKey);
        if (!piece) return;
        e.preventDefault();
        e.stopPropagation();
        this.startKeyboardPlacement(slotKey, piece);
      }
    });
  }

  renderFloatingProxy(piece, cellSize) {
    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;
    const total = rows * cols;
    const px = `${cellSize.toFixed(1)}px`;

    this.floatingProxy.style.gridTemplateColumns = `repeat(${cols}, ${px})`;
    this.floatingProxy.style.gridTemplateRows = `repeat(${rows}, ${px})`;

    const colorCss = COLORS[piece.color].css;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const div = this.proxyPool[idx++];
        div.style.display = 'block';
        if (piece.matrix[r][c]) {
          div.className = piece.gems && piece.gems[r]?.[c]
            ? `block-tile ${colorCss} has-gem`
            : `block-tile ${colorCss}`;
        } else {
          div.className = '';
        }
      }
    }
    for (let i = total; i < this.proxyPool.length; i++) {
      this.proxyPool[i].style.display = 'none';
    }

    this.floatingProxy.hidden = false;
    this.floatingProxy.style.display = 'grid';
  }

  updateFloatingProxyPosition(clientX, clientY) {
    const drag = this.activeDrag;
    if (!drag) return;

    // Pure 1:1 smooth finger tracking — no artificial snap-pull jitter on the floating piece!
    const x = clientX - drag.offsetX;
    const y = clientY - drag.offsetY;
    this.floatingProxy.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // 1. Check Hold Vault hover
    const vaultRect = drag.vaultRect;
    if (vaultRect && drag.slotKey !== 'hold') {
      if (
        clientX >= vaultRect.left - 10 &&
        clientX <= vaultRect.right + 10 &&
        clientY >= vaultRect.top - 10 &&
        clientY <= vaultRect.bottom + 10
      ) {
        if (!drag.overVault) {
          drag.overVault = true;
          drag.targetCell = null;
          this.holdVault.classList.add('vault-hover');
          if (this.previewKey !== 'vault') {
            this.previewKey = 'vault';
            this.clearBoardPreviews();
          }
        }
        return;
      }
    }
    if (drag.overVault) {
      drag.overVault = false;
      this.holdVault.classList.remove('vault-hover');
    }

    // 2. Exact fractional board coordinate of piece top-left (0, 0)
    const boardRect = drag.boardRect;
    const rawCol = (x - boardRect.left) / drag.cellStride;
    const rawRow = (y - boardRect.top) / drag.cellStride;

    const rCenter = Math.round(rawRow);
    const cCenter = Math.round(rawCol);

    // 3. Magnetic 3x3 neighborhood search for the board ghost target
    let bestPlacement = null;
    let bestDist = 1.25;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = rCenter + dr;
        const c = cCenter + dc;
        const dist = Math.hypot(r - rawRow, c - rawCol);
        if (dist < bestDist && this.canPlacePiece(drag.piece.matrix, r, c)) {
          bestDist = dist;
          bestPlacement = { r, c };
        }
      }
    }

    drag.targetCell = bestPlacement;

    const nextKey = bestPlacement ? `${bestPlacement.r},${bestPlacement.c}` : 'none';
    if (nextKey !== this.previewKey) {
      this.previewKey = nextKey;
      this.clearBoardPreviews();
      if (bestPlacement) {
        this.showPlacementPreview(drag.piece, bestPlacement.r, bestPlacement.c);
      }
    }
  }

  startKeyboardPlacement(slotKey, piece) {
    let startR = 3;
    let startC = 3;
    outer: for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.canPlacePiece(piece.matrix, r, c)) {
          startR = r;
          startC = c;
          break outer;
        }
      }
    }
    this.kbdSelection = { slotKey, piece, r: startR, c: startC };
    this.kbdHintBar.hidden = false;
    this.clearBoardPreviews();
    if (this.canPlacePiece(piece.matrix, startR, startC)) {
      this.showPlacementPreview(piece, startR, startC);
    }
  }

  cancelKeyboardPlacement() {
    if (!this.kbdSelection) return;
    this.kbdSelection = null;
    this.kbdHintBar.hidden = true;
    this.clearBoardPreviews();
  }

  handleKeyDown(e) {
    if (!this.kbdSelection) return;
    const sel = this.kbdSelection;
    const maxR = BOARD_SIZE - sel.piece.matrix.length;
    const maxC = BOARD_SIZE - sel.piece.matrix[0].length;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.cancelKeyboardPlacement();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      sel.r = Math.max(0, sel.r - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      sel.r = Math.min(maxR, sel.r + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      sel.c = Math.max(0, sel.c - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      sel.c = Math.min(maxC, sel.c + 1);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      this.useRotatePowerup();
      const updatedPiece = this.getPieceFromSlot(sel.slotKey);
      if (updatedPiece) sel.piece = updatedPiece;
    } else if (e.key === 'h' || e.key === 'H') {
      if (sel.slotKey !== 'hold' && this.mode !== 'pure') {
        e.preventDefault();
        const idx = Number(sel.slotKey);
        this.cancelKeyboardPlacement();
        this.swapSlotWithHold(idx);
        return;
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.canPlacePiece(sel.piece.matrix, sel.r, sel.c)) {
        const { slotKey, piece, r, c } = sel;
        this.cancelKeyboardPlacement();
        this.placePieceOnBoard(slotKey, piece, r, c);
      } else {
        sfx.playError();
      }
      return;
    } else {
      return;
    }

    this.clearBoardPreviews();
    if (this.canPlacePiece(sel.piece.matrix, sel.r, sel.c)) {
      this.showPlacementPreview(sel.piece, sel.r, sel.c);
    }
  }

  getPieceFromSlot(slotKey) {
    if (slotKey === 'hold') return this.holdPiece;
    return this.tray[Number(slotKey)];
  }

  canPlacePiece(matrix, baseR, baseC, boardState = this.board) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    if (baseR < 0 || baseC < 0 || baseR + rows > BOARD_SIZE || baseC + cols > BOARD_SIZE) {
      return false;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] && boardState[baseR + r][baseC + c] !== null) {
          return false;
        }
      }
    }
    return true;
  }

  canPieceFitAnywhere(piece, boardState = this.board) {
    if (!piece) return false;
    for (let r = 0; r <= BOARD_SIZE - piece.matrix.length; r++) {
      for (let c = 0; c <= BOARD_SIZE - piece.matrix[0].length; c++) {
        if (this.canPlacePiece(piece.matrix, r, c, boardState)) {
          return true;
        }
      }
    }
    return false;
  }

  clearBoardPreviews() {
    for (let i = 0; i < this.previewedCells.length; i++) {
      const [r, c] = this.previewedCells[i];
      const cellEl = this.cellEls[r][c];
      cellEl.classList.remove('ghost-preview', 'will-clear');
      if (!this.board[r][c]) {
        cellEl.className = 'board-cell';
      }
    }
    this.previewedCells.length = 0;
  }

  showPlacementPreview(piece, baseR, baseC) {
    const colorCss = COLORS[piece.color].css;
    // Copy current board into reusable scratchBoard without allocating new arrays
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.scratchBoard[r][c] = this.board[r][c];
      }
    }

    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (piece.matrix[r][c]) {
          const br = baseR + r;
          const bc = baseC + c;
          this.scratchBoard[br][bc] = 1;
          const cellEl = this.cellEls[br][bc];
          cellEl.classList.add(colorCss, 'ghost-preview');
          this.previewedCells.push([br, bc]);
        }
      }
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      let rowFull = true;
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.scratchBoard[r][c] === null) {
          rowFull = false;
          break;
        }
      }
      if (rowFull) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          this.cellEls[r][c].classList.add('will-clear');
          this.previewedCells.push([r, c]);
        }
      }
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
      let colFull = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (this.scratchBoard[r][c] === null) {
          colFull = false;
          break;
        }
      }
      if (colFull) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          this.cellEls[r][c].classList.add('will-clear');
          this.previewedCells.push([r, c]);
        }
      }
    }
  }

  saveUndoState() {
    this.undoSnapshot = {
      board: this.board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
      score: this.score,
      combo: this.combo,
      movesSinceClear: this.movesSinceClear,
      linesClearedTotal: this.linesClearedTotal,
      gemsCollected: this.gemsCollected,
      energy: this.energy,
      tray: this.tray.map((p) => (p ? structuredClone(p) : null)),
      holdPiece: this.holdPiece ? structuredClone(this.holdPiece) : null
    };
  }

  placePieceOnBoard(slotKey, piece, baseR, baseC) {
    if (!this.canPlacePiece(piece.matrix, baseR, baseC)) {
      sfx.playError();
      return;
    }

    this.saveUndoState();

    let blocksPlaced = 0;
    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (piece.matrix[r][c]) {
          const hasGem = Boolean(piece.gems && piece.gems[r]?.[c]);
          this.board[baseR + r][baseC + c] = {
            color: piece.color,
            gem: hasGem
          };
          blocksPlaced++;
        }
      }
    }

    if (slotKey === 'hold') {
      this.holdPiece = null;
    } else {
      this.tray[Number(slotKey)] = null;
    }

    const fullRows = [];
    const fullCols = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (this.board[r].every((cell) => cell !== null)) fullRows.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (this.board[r][c] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(c);
    }

    const totalLines = fullRows.length + fullCols.length;
    let pointsEarned = blocksPlaced * 10;

    if (totalLines > 0) {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.movesSinceClear = 0;
      this.linesClearedTotal += totalLines;

      const cellsToClear = new Set();
      fullRows.forEach((r) => {
        for (let c = 0; c < BOARD_SIZE; c++) cellsToClear.add(`${r},${c}`);
      });
      fullCols.forEach((c) => {
        for (let r = 0; r < BOARD_SIZE; r++) cellsToClear.add(`${r},${c}`);
      });

      let gemsInClear = 0;
      cellsToClear.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        const cellData = this.board[r][c];
        if (cellData) {
          if (cellData.gem) gemsInClear++;
          this.fx.burstCell(r, c, COLORS[cellData.color].hex);
          this.board[r][c] = null;
        }
      });

      if (this.mode === 'gem' && gemsInClear > 0) {
        this.gemsCollected = Math.min(this.gemTarget, this.gemsCollected + gemsInClear);
        pointsEarned += gemsInClear * 75;
      }

      const lineBase = totalLines === 1 ? 100 : totalLines === 2 ? 260 : totalLines === 3 ? 500 : totalLines * 220;
      const comboBonus = lineBase * this.combo;
      pointsEarned += comboBonus;

      const isBoardEmpty = this.board.every((row) => row.every((cell) => cell === null));
      if (isBoardEmpty) {
        pointsEarned += 500;
        sfx.playAllClear();
        this.spawnBanner('🌟 ALL CLEAR! +500');
      } else {
        sfx.playClear(totalLines, this.combo);
        if (this.combo > 1 && totalLines > 1) {
          this.spawnBanner(`🔥 ${totalLines}× LINES • COMBO ×${this.combo}!`);
        } else if (this.combo > 1) {
          this.spawnBanner(`🔥 COMBO ×${this.combo}! +${comboBonus}`);
        } else if (totalLines >= 2) {
          const labels = ['', '', 'DOUBLE BLAST!', 'TRIPLE BLAST!', 'MEGA BLAST!', 'ULTRA BLAST!'];
          this.spawnBanner(`⚡ ${labels[Math.min(totalLines, 5)]} +${comboBonus}`);
        }
      }

      if (totalLines >= 2 || this.combo >= 2) {
        this.boardFrame.classList.remove('board-shake');
        void this.boardFrame.offsetWidth;
        this.boardFrame.classList.add('board-shake');
      }

      if (this.mode !== 'pure') {
        const energyGain = totalLines >= 2 || this.combo >= 2 ? 2 : 1;
        this.energy = Math.min(MAX_ENERGY, this.energy + energyGain);
      }
    } else {
      sfx.playPlace();
      this.movesSinceClear += 1;
      if (this.movesSinceClear >= 3) {
        this.combo = 0;
      }
    }

    this.addScore(pointsEarned);

    if (this.tray.every((p) => p === null)) {
      this.undoUsedThisTray = false;
      this.dealNewTray();
    }

    this.renderAll();
    this.saveState();
    this.checkPostActionState();
  }

  checkPostActionState() {
    if (this.mode === 'gem' && this.gemsCollected >= this.gemTarget) {
      setTimeout(() => this.showGameOverModal(true), 280);
      return;
    }

    if (!this.hasAnyValidMove()) {
      this.spawnBanner('❌ NO MORE MOVES — GAME OVER!');
      setTimeout(() => this.showGameOverModal(false), 320);
      return;
    }

    if (!this.hasAnyTrayMove() && this.mode !== 'pure' && this.holdPiece && this.canPieceFitAnywhere(this.holdPiece)) {
      this.spawnBanner('💡 Tray blocked — use your HOLD piece!');
    }
  }

  swapSlotWithHold(slotIdx) {
    const trayPiece = this.tray[slotIdx];
    if (!trayPiece) return;

    this.saveUndoState();
    const prevHold = this.holdPiece;
    this.holdPiece = trayPiece;
    this.tray[slotIdx] = prevHold;

    sfx.playPowerup();
    if (this.tray.every((p) => p === null)) {
      this.dealNewTray();
    }
    this.renderAll();
    this.saveState();
    this.checkPostActionState();
  }

  dealNewTray() {
    const newTray = [];
    let simBoard = this.board.map((row) => [...row]);

    for (let i = 0; i < 3; i++) {
      const candidate = this.pickSmartPieceForBoard(simBoard);
      newTray.push(candidate);
      simBoard = this.simulateBestPlacement(simBoard, candidate);
    }

    this.tray = newTray;
  }

  pickSmartPieceForBoard(boardState) {
    const fittingShapes = SHAPES.filter((s) => this.canPieceFitAnywhere(s, boardState));
    const pool = fittingShapes.length > 0 ? fittingShapes : SHAPES;

    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const shape of pool) {
      roll -= shape.weight;
      if (roll <= 0) {
        chosen = shape;
        break;
      }
    }

    const matrix = chosen.matrix.map((row) => [...row]);
    let gems = null;

    if (this.mode === 'gem') {
      gems = matrix.map((row) => row.map((cell) => (cell && Math.random() < 0.28 ? 1 : 0)));
    }

    return {
      name: chosen.name,
      color: chosen.color,
      matrix,
      gems
    };
  }

  simulateBestPlacement(boardState, piece) {
    const nextBoard = boardState.map((row) => [...row]);
    let bestRC = null;
    let bestScore = -999;

    for (let r = 0; r <= BOARD_SIZE - piece.matrix.length; r++) {
      for (let c = 0; c <= BOARD_SIZE - piece.matrix[0].length; c++) {
        if (this.canPlacePiece(piece.matrix, r, c, nextBoard)) {
          const testBoard = nextBoard.map((row) => [...row]);
          for (let pr = 0; pr < piece.matrix.length; pr++) {
            for (let pc = 0; pc < piece.matrix[0].length; pc++) {
              if (piece.matrix[pr][pc]) testBoard[r + pr][c + pc] = { color: piece.color };
            }
          }
          let lines = 0;
          for (let rr = 0; rr < BOARD_SIZE; rr++) {
            if (testBoard[rr].every((x) => x !== null)) lines++;
          }
          for (let cc = 0; cc < BOARD_SIZE; cc++) {
            if (testBoard.every((row) => row[cc] !== null)) lines++;
          }
          if (lines > bestScore) {
            bestScore = lines;
            bestRC = { r, c };
          }
        }
      }
    }

    if (bestRC) {
      for (let pr = 0; pr < piece.matrix.length; pr++) {
        for (let pc = 0; pc < piece.matrix[0].length; pc++) {
          if (piece.matrix[pr][pc]) {
            nextBoard[bestRC.r + pr][bestRC.c + pc] = { color: piece.color };
          }
        }
      }
      const fullRows = [];
      const fullCols = [];
      for (let rr = 0; rr < BOARD_SIZE; rr++) {
        if (nextBoard[rr].every((x) => x !== null)) fullRows.push(rr);
      }
      for (let cc = 0; cc < BOARD_SIZE; cc++) {
        if (nextBoard.every((row) => row[cc] !== null)) fullCols.push(cc);
      }
      fullRows.forEach((rr) => {
        for (let cc = 0; cc < BOARD_SIZE; cc++) nextBoard[rr][cc] = null;
      });
      fullCols.forEach((cc) => {
        for (let rr = 0; rr < BOARD_SIZE; rr++) nextBoard[rr][cc] = null;
      });
    }

    return nextBoard;
  }

  rotateMatrixCW(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  }

  useRotatePowerup() {
    if (this.mode === 'pure' || this.energy < 1) {
      sfx.playError();
      return;
    }
    const hasPiece = this.tray.some((p) => p !== null) || this.holdPiece !== null;
    if (!hasPiece) return;

    this.energy -= 1;
    this.tray = this.tray.map((p) => {
      if (!p) return null;
      return {
        ...p,
        matrix: this.rotateMatrixCW(p.matrix),
        gems: p.gems ? this.rotateMatrixCW(p.gems) : null
      };
    });
    if (this.holdPiece) {
      this.holdPiece = {
        ...this.holdPiece,
        matrix: this.rotateMatrixCW(this.holdPiece.matrix),
        gems: this.holdPiece.gems ? this.rotateMatrixCW(this.holdPiece.gems) : null
      };
    }

    sfx.playPowerup();
    this.spawnBanner('↻ PIECES ROTATED!');
    this.renderAll();
    this.saveState();
    this.checkPostActionState();
  }

  toggleBombMode() {
    if (this.mode === 'pure' || this.energy < 2) {
      sfx.playError();
      return;
    }
    this.bombTargeting = !this.bombTargeting;
    this.boardFrame.classList.toggle('bomb-targeting', this.bombTargeting);
    this.btnBomb.classList.toggle('active-mode', this.bombTargeting);
    if (!this.bombTargeting) {
      this.clearBombPreview();
    } else {
      sfx.playPickup();
      this.spawnBanner('💣 TAP BOARD TO BLAST 3×3');
    }
  }

  cancelBombMode() {
    this.bombTargeting = false;
    this.boardFrame.classList.remove('bomb-targeting');
    this.btnBomb.classList.remove('active-mode');
    this.clearBombPreview();
  }

  clearBombPreview() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.cellEls[r][c].classList.remove('bomb-zone');
      }
    }
  }

  showBombPreview(centerR, centerC) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerR + dr;
        const c = centerC + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          this.cellEls[r][c].classList.add('bomb-zone');
        }
      }
    }
  }

  detonateBombAt(centerR, centerC) {
    if (this.energy < 2) return;
    this.saveUndoState();
    this.energy -= 2;
    this.cancelBombMode();

    let clearedBlocks = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerR + dr;
        const c = centerC + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const cell = this.board[r][c];
          if (cell) {
            clearedBlocks++;
            if (this.mode === 'gem' && cell.gem) {
              this.gemsCollected = Math.min(this.gemTarget, this.gemsCollected + 1);
            }
            this.fx.burstCell(r, c, COLORS[cell.color].hex);
            this.board[r][c] = null;
          } else {
            this.fx.burstCell(r, c, '#fb7185');
          }
        }
      }
    }

    this.boardFrame.classList.remove('board-shake');
    void this.boardFrame.offsetWidth;
    this.boardFrame.classList.add('board-shake');

    sfx.playClear(2, 2);
    this.addScore(clearedBlocks * 25);
    this.spawnBanner(`💥 BOOM! +${clearedBlocks * 25}`);
    this.renderAll();
    this.saveState();
    this.checkPostActionState();
  }

  executeCenterEmergencyBlast() {
    if (this.energy >= 2) {
      this.detonateBombAt(3, 3);
    }
  }

  useRerollPowerup() {
    if (this.mode === 'pure' || this.energy < 2) {
      sfx.playError();
      return;
    }
    this.saveUndoState();
    this.energy -= 2;
    this.dealNewTray();
    sfx.playPowerup();
    this.spawnBanner('🎲 FRESH SMART DEAL!');
    this.renderAll();
    this.saveState();
    this.checkPostActionState();
  }

  useUndoPowerup() {
    if (this.mode === 'pure' || !this.undoSnapshot || this.undoUsedThisTray) {
      sfx.playError();
      return;
    }
    const snap = this.undoSnapshot;
    this.board = snap.board;
    this.score = snap.score;
    this.combo = snap.combo;
    this.movesSinceClear = snap.movesSinceClear;
    this.linesClearedTotal = snap.linesClearedTotal;
    this.gemsCollected = snap.gemsCollected;
    this.energy = snap.energy;
    this.tray = snap.tray;
    this.holdPiece = snap.holdPiece;
    this.undoSnapshot = null;
    this.undoUsedThisTray = true;

    sfx.playPowerup();
    this.spawnBanner('↩️ MOVE UNDONE');
    this.renderAll();
    this.saveState();
    this.checkPostActionState();
  }

  hasAnyTrayMove() {
    return this.tray.some((p) => p && this.canPieceFitAnywhere(p));
  }

  hasAnyValidMove() {
    if (this.hasAnyTrayMove()) return true;
    if (this.mode !== 'pure' && this.holdPiece && this.canPieceFitAnywhere(this.holdPiece)) {
      return true;
    }
    return false;
  }

  canRescueWithRotate() {
    if (this.mode === 'pure' || this.energy < 1) return false;
    const pieces = [...this.tray];
    if (this.holdPiece) pieces.push(this.holdPiece);
    return pieces.some((p) => {
      if (!p) return false;
      const rotated = { ...p, matrix: this.rotateMatrixCW(p.matrix) };
      return this.canPieceFitAnywhere(rotated);
    });
  }

  addScore(points) {
    if (points <= 0) return;
    this.score += points;
    if (this.score > (this.bestScores[this.mode] || 0)) {
      this.bestScores[this.mode] = this.score;
    }
    this.scoreEl.classList.remove('score-bump');
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add('score-bump');
    setTimeout(() => this.scoreEl.classList.remove('score-bump'), 350);
  }

  spawnBanner(text) {
    const el = document.createElement('div');
    el.className = 'floating-banner';
    el.textContent = text;
    this.floatingBanners.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  renderAll() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cellData = this.board[r][c];
        const cellEl = this.cellEls[r][c];
        cellEl.className = 'board-cell';
        if (cellData) {
          const colorCss = COLORS[cellData.color].css;
          cellEl.classList.add('block-tile', colorCss);
          if (cellData.gem) cellEl.classList.add('has-gem');
        }
      }
    }

    this.scoreEl.textContent = this.score.toLocaleString();
    this.bestEl.textContent = (this.bestScores[this.mode] || 0).toLocaleString();

    const modeNames = {
      pro: 'Classic Pro',
      gem: 'Gem Rush',
      pure: 'Pure Classic'
    };
    this.modeLabel.textContent = modeNames[this.mode];

    if (this.combo >= 2) {
      this.comboPill.hidden = false;
      this.comboText.textContent = `COMBO ×${this.combo}`;
    } else {
      this.comboPill.hidden = true;
    }

    this.gemPill.hidden = this.mode !== 'gem';
    if (this.mode === 'gem') {
      this.gemText.textContent = `${this.gemsCollected} / ${this.gemTarget} Gems`;
    }

    this.mercyIndicator.hidden = this.mode === 'pure';
    this.powerupBar.hidden = this.mode === 'pure';
    this.holdVault.hidden = this.mode === 'pure';
    this.dockStage.classList.toggle('pure-mode-dock', this.mode === 'pure');

    this.energyCountEl.textContent = `${this.energy} / ${MAX_ENERGY}`;
    this.energyFillEl.style.width = `${(this.energy / MAX_ENERGY) * 100}%`;

    this.btnRotate.disabled = this.energy < 1;
    this.btnBomb.disabled = this.energy < 2;
    this.btnReroll.disabled = this.energy < 2;
    const canUndo = Boolean(this.undoSnapshot) && !this.undoUsedThisTray;
    this.btnUndo.disabled = !canUndo;
    this.undoBadge.textContent = this.undoUsedThisTray ? 'Used' : 'Free';

    for (let i = 0; i < 3; i++) {
      this.renderPieceCard(this.slotEls[i], this.tray[i]);
    }
    if (this.holdPiece) {
      this.slotEls.hold.hidden = false;
      this.vaultPlaceholder.hidden = true;
      this.renderPieceCard(this.slotEls.hold, this.holdPiece);
    } else {
      this.slotEls.hold.hidden = true;
      this.slotEls.hold.innerHTML = '';
      this.vaultPlaceholder.hidden = false;
    }

    const holdIsOnlyMove =
      this.mode !== 'pure' &&
      !this.hasAnyTrayMove() &&
      Boolean(this.holdPiece) &&
      this.canPieceFitAnywhere(this.holdPiece);
    this.holdVault.classList.toggle('hold-only-move', holdIsOnlyMove);
  }

  renderPieceCard(cardEl, piece) {
    cardEl.innerHTML = '';
    if (!piece) {
      cardEl.hidden = true;
      cardEl.classList.remove('unplaceable');
      return;
    }
    cardEl.hidden = false;

    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;
    const maxDim = Math.max(rows, cols);
    const cellPx = maxDim >= 5 ? 11 : maxDim === 4 ? 12 : maxDim === 3 ? 14 : 16;

    cardEl.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
    cardEl.style.gridTemplateRows = `repeat(${rows}, ${cellPx}px)`;

    const colorCss = COLORS[piece.color].css;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'mini-cell';
        cell.style.width = `${cellPx}px`;
        cell.style.height = `${cellPx}px`;
        if (piece.matrix[r][c]) {
          cell.classList.add('block-tile', colorCss);
          if (piece.gems && piece.gems[r]?.[c]) {
            cell.classList.add('has-gem');
          }
        }
        cardEl.appendChild(cell);
      }
    }

    const fits = this.canPieceFitAnywhere(piece);
    cardEl.classList.toggle('unplaceable', !fits);
  }

  showGameOverModal(isVictory = false) {
    const badge = document.getElementById('gameover-badge');
    const title = document.getElementById('gameover-title');
    const subtitle = document.getElementById('gameover-subtitle');
    const rescueRotateBtn = document.getElementById('rescue-rotate-btn');
    const rescueBombBtn = document.getElementById('rescue-bomb-btn');

    if (isVictory) {
      badge.textContent = 'STAGE COMPLETE';
      title.textContent = '💎 All 12 Gems Collected!';
      subtitle.textContent = 'Incredible spatial mastery! Ready for another round?';
      if (rescueRotateBtn) rescueRotateBtn.hidden = true;
      rescueBombBtn.hidden = true;
      sfx.playAllClear();
    } else {
      badge.textContent = 'GAME OVER';
      title.textContent = 'You Lost — No More Moves!';
      const canRotateRescue = this.canRescueWithRotate();
      const canBombRescue = this.mode !== 'pure' && this.energy >= 2;
      if (rescueRotateBtn) rescueRotateBtn.hidden = !canRotateRescue;
      rescueBombBtn.hidden = !canBombRescue;
      subtitle.textContent =
        canRotateRescue || canBombRescue
          ? 'None of your remaining blocks fit on the board. Start a new game below, or spend Energy to rescue this run!'
          : 'None of your remaining blocks can fit on the 8×8 board.';
      sfx.playGameOver();
    }

    document.getElementById('final-score').textContent = this.score.toLocaleString();
    document.getElementById('final-best').textContent = (this.bestScores[this.mode] || 0).toLocaleString();
    document.getElementById('final-combo').textContent = `×${this.maxCombo}`;
    document.getElementById('final-lines').textContent = String(this.linesClearedTotal);

    if (!this.gameoverDialog.open) {
      this.gameoverDialog.showModal();
    }
  }

  startNewGame(mode = this.mode) {
    this.mode = mode;
    this.board = this.createEmptyBoard();
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 1;
    this.movesSinceClear = 0;
    this.linesClearedTotal = 0;
    this.gemsCollected = 0;
    this.energy = 2;
    this.holdPiece = null;
    this.undoSnapshot = null;
    this.undoUsedThisTray = false;
    this.hideFloatingProxy();
    this.cancelBombMode();
    this.cancelKeyboardPlacement();

    if (this.mode === 'gem') {
      const coords = [
        [2, 2],
        [2, 5],
        [5, 2],
        [5, 5]
      ];
      coords.forEach(([r, c], idx) => {
        this.board[r][c] = { color: idx % COLORS.length, gem: true };
      });
    }

    this.dealNewTray();
    this.renderAll();
    this.saveState();
  }

  saveState() {
    try {
      const payload = {
        mode: this.mode,
        board: this.board,
        score: this.score,
        bestScores: this.bestScores,
        combo: this.combo,
        maxCombo: this.maxCombo,
        movesSinceClear: this.movesSinceClear,
        linesClearedTotal: this.linesClearedTotal,
        gemsCollected: this.gemsCollected,
        energy: this.energy,
        tray: this.tray,
        holdPiece: this.holdPiece
      };
      localStorage.setItem('blockBlastProState_v1', JSON.stringify(payload));
    } catch (_) {}
  }

  loadSavedState() {
    try {
      const raw = localStorage.getItem('blockBlastProState_v1');
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.board) && data.board.length === BOARD_SIZE) {
          this.mode = data.mode || 'pro';
          this.board = data.board;
          this.score = data.score || 0;
          this.bestScores = data.bestScores || { pro: 0, gem: 0, pure: 0 };
          this.combo = data.combo || 0;
          this.maxCombo = data.maxCombo || 1;
          this.movesSinceClear = data.movesSinceClear || 0;
          this.linesClearedTotal = data.linesClearedTotal || 0;
          this.gemsCollected = data.gemsCollected || 0;
          this.energy = typeof data.energy === 'number' ? data.energy : 2;
          this.tray = Array.isArray(data.tray) ? data.tray : [null, null, null];
          this.holdPiece = data.holdPiece || null;

          if (this.tray.every((p) => p === null)) {
            this.dealNewTray();
          }
          this.renderAll();
          this.checkPostActionState();
          return;
        }
      }
    } catch (_) {}
    this.startNewGame('pro');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.blockBlastGame = new BlockBlastGame();
});
