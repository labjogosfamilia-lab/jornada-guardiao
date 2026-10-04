/**
 * ====================================================================
 * JORNADA: O GUARDIÃO DOS BOSQUES — EXPANSÃO SUPREMA DAS 14 FASES
 * 14 Áreas Interconectadas com 7 Grandes Chefes Divinos Alternados:
 *  1. Bosque dos Ecos (Tutorial & Totem da Seiva)
 *  2. Caverna dos Cristais (Enigma 1: Tríade Harmônica C-E-G)
 *  3. Santuário da Árvore Mãe (1º Boss: Malakar, o Colosso Sombrio)
 *     -> Recompensa: Poder Sísmico [R] + Disparo Triplo Celestial!
 *  4. Palácio dos Ventos (Enigma 2: Rosa dos Ventos Convergente)
 *  5. Trono do Trovão (2º Boss: Valdor, o Arconte do Trovão)
 *     -> Recompensa: Espada do Trovão + Troca de Armas [F] / [Tab]!
 *  6. Abismo da Forja de Magma (Enigma 3: Equilíbrio Térmico das Caldeiras a 10 ºC)
 *     -> Recompensa: Forja da Espada de Fogo Estelar Nível 2!
 *  7. Núcleo do Eclipse Cósmico (3º Boss: Kharon, o Soberano do Eclipse)
 *     -> Recompensa: Incineração Cósmica (DoT) + Raio Astral Perfurante [C] / [X]!
 *  8. Geleira de Niflheim (Enigma 4: Refração Glacial em 90º com 3 Prismas Harmonizadores)
 *     -> O Feixe muda de cor para Dourado e só ativa a Runa após atravessar os 3 prismas!
 *  9. Arena Glacial (4º Boss: Trinit, a Tríade Glacial)
 *     -> Se divide em 3 clones autônomos com HP compartilhado e ataques em triângulo!
 *  10. Templo de Cronos (Enigma 5: Sincronia Temporal dos 3 Totens com Raio Astral)
 *  11. Nexus de Cronos (5º Boss: Mirage, o Senhor dos Reflexos Ilusórios)
 *     -> Cria 2 clones fantasmas idênticos e invulneráveis; se embaralha a cada 8s!
 *  12. Labirinto das Sombras (Enigma 6: Matriz Booleana de Inversão de Orbes Espectrais)
 *  13. Santuário do Abismo (6º Boss: Nocturnus, o Soberano do Abismo Umbral)
 *     -> Arremessa foices bumerangues, cria poços de vazio e teletransporta nas trevas!
 *  14. Cidadela do Éter (7º Mega-Chefe Final: Aethon, o Arquiteto das Dimensões)
 *     -> Escudo Dimensional quebrado pelo Raio Astral [C]! Vitória Final!
 *
 * Sistema de Checkpoints & Dificuldade Elevada:
 *  - Vidas finitas: Apenas 3 vidas de guardião; cura sem vidas extras em enigmas.
 *  - Monólitos de Checkpoint em todas as fases: ative com [E] para registrar o marco.
 *  - Ao esgotar corações (vidas > 0) ou reiniciar, ressurge no checkpoint ativo salvo!
 *
 * Controles:
 *  - W, A, S, D ou Setas: Mover
 *  - Segurar Shift: CORRER (Sprint contínuo com consumo de vigor)
 *  - Tecla Q ou K: DASH (Esquiva rápida com invulnerabilidade)
 *  - Tecla R: PODER SÍSMICO (Onda de choque em área - pós-Boss 1)
 *  - Tecla F ou Tab: ALTERNAR ARMA (Cajado Arcano vs Espada - pós-Boss 2)
 *  - Tecla C ou X: RAIO ASTRAL (Feixe de longo alcance - pós-Boss 3)
 *  - Espaço / J / Clique: Atacar com arma ativa
 *  - Tecla E: Interagir, ativar checkpoints, ler pistas e girar prismas/cataventos
 * ====================================================================
 */

// --- 1. CONFIGURAÇÕES & CONSTANTES ---
const CONFIG = {
  TILE_SIZE: 32,
  MAP_COLS: 36,
  MAP_ROWS: 28,
  WALK_SPEED: 135,
  SPRINT_SPEED: 220,
  DASH_SPEED: 350,
  DASH_DURATION: 0.22,
  DASH_COOLDOWN: 0.65,
  MAX_STAMINA: 100,
  STAMINA_DRAIN_SPRINT: 28, // por segundo
  STAMINA_RECOVER: 35, // por segundo
  MAX_HEALTH: 4,
  TOTAL_SEEDS_NEEDED: 5,
};

// --- 2. SISTEMA DE ÁUDIO PROCEDURAL (Web Audio API) ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.currentTheme = 'FOREST';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.ctx) {
      this.stopBGM();
    } else if (!this.muted) {
      this.startBGM(this.currentTheme);
    }
    return !this.muted;
  }

  playSwing(isSword = false) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isSword ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isSword ? 520 : 380, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + (isSword ? 0.14 : 0.11));

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSword ? 2400 : 1200, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playShoot() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playWeaponSwap() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(940, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playShockwave() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playDash() {
    if (this.muted || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.14;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.14);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);
  }

  playPickup() {
    if (this.muted || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.15);
    });
  }

  playChestOpen() {
    if (this.muted || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.26);
    });
  }

  playTeleport() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.29);
  }

  playBossRoar() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.46);
  }

  playPlayerHurt() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.19);
  }

  playDialogueBlip() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450 + Math.random() * 80, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    const melody = [
      { f: 392.00, d: 0.18 },
      { f: 523.25, d: 0.18 },
      { f: 659.25, d: 0.18 },
      { f: 783.99, d: 0.40 },
      { f: 659.25, d: 0.20 },
      { f: 1046.50, d: 0.80 },
    ];

    let t = this.ctx.currentTime;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.9;
    });
  }

  playPuzzleTone(freq = 440) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.46);
  }

  playPuzzleFail() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playWindGust() {
    if (this.muted || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playSteamHiss() {
    if (this.muted || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playBurnCrackle() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + Math.random() * 80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playCheckpoint() {
    if (this.muted || !this.ctx) return;
    const chime = [523.25, 659.25, 783.99, 1046.50];
    let t = this.ctx.currentTime;
    chime.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
      t += 0.08;
    });
  }

  playBeamShoot() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.20, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.23);
  }

  playBeamHit() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playPrismRotate() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playChronosDing() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.56);
  }

  startBGM(theme = 'FOREST') {
    this.currentTheme = theme;
    if (this.muted || !this.ctx) return;
    this.stopBGM();
    this.bgmPlaying = true;

    let scale = [174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00];
    let tempo = 500;
    let waveType = 'sine';

    if (theme === 'CAVE') {
      scale = [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08];
      tempo = 650;
      waveType = 'triangle';
    } else if (theme === 'BOSS') {
      scale = [110.00, 116.54, 130.81, 146.83, 164.81, 174.61, 220.00];
      tempo = 240;
      waveType = 'sawtooth';
    } else if (theme === 'SKY') {
      scale = [261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33];
      tempo = 400;
      waveType = 'sine';
    } else if (theme === 'MAGMA') {
      scale = [98.00, 110.00, 116.54, 130.81, 146.83, 164.81];
      tempo = 480;
      waveType = 'sawtooth';
    } else if (theme === 'VOID') {
      scale = [82.41, 87.31, 98.00, 110.00, 123.47, 130.81, 164.81];
      tempo = 210;
      waveType = 'sawtooth';
    } else if (theme === 'FROZEN') {
      scale = [261.63, 311.13, 349.23, 415.30, 523.25, 622.25];
      tempo = 480;
      waveType = 'sine';
    } else if (theme === 'CHRONOS') {
      scale = [146.83, 164.81, 174.61, 220.00, 246.94, 293.66];
      tempo = 360;
      waveType = 'triangle';
    } else if (theme === 'SHADOW') {
      scale = [110.00, 123.47, 130.81, 155.56, 174.61, 207.65];
      tempo = 280;
      waveType = 'sawtooth';
    } else if (theme === 'AETHER') {
      scale = [220.00, 277.18, 329.63, 440.00, 554.37, 659.25, 880.00];
      tempo = 190;
      waveType = 'triangle';
    }

    const loop = () => {
      if (!this.bgmPlaying || this.muted) return;
      const freq = scale[Math.floor(Math.random() * scale.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const vol = (theme === 'BOSS' || theme === 'VOID') ? 0.05 : 0.035;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);

      this.bgmTimer = setTimeout(loop, tempo + Math.random() * 40);
    };

    loop();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
  }
}

// --- 3. INPUT MANAGER (COM SPRINT NO SHIFT, DASH NO Q, ESPECIAL NO R, ARMAS NO F) ---
class InputManager {
  constructor() {
    this.keys = {};
    this.moveX = 0;
    this.moveY = 0;
    this.isSprinting = false;
    this.attackPressed = false;
    this.dashPressed = false;
    this.specialPressed = false;
    this.beamPressed = false;
    this.swapWeaponPressed = false;
    this.interactPressed = false;

    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || key === 'j') this.attackPressed = true;
      if (key === 'q' || key === 'k') this.dashPressed = true;
      if (key === 'r') this.specialPressed = true;
      if (key === 'c' || key === 'x') this.beamPressed = true;
      if (key === 'f' || key === 'tab') this.swapWeaponPressed = true;
      if (key === 'e') this.interactPressed = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target.id === 'game-canvas') this.attackPressed = true;
    });
  }

  setupTouch() {
    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
    };

    bindTouch('dpad-up', () => { this.keys['arrowup'] = true; }, () => { this.keys['arrowup'] = false; });
    bindTouch('dpad-down', () => { this.keys['arrowdown'] = true; }, () => { this.keys['arrowdown'] = false; });
    bindTouch('dpad-left', () => { this.keys['arrowleft'] = true; }, () => { this.keys['arrowleft'] = false; });
    bindTouch('dpad-right', () => { this.keys['arrowright'] = true; }, () => { this.keys['arrowright'] = false; });

    bindTouch('touch-attack', () => { this.attackPressed = true; }, () => {});
    bindTouch('touch-dash', () => { this.dashPressed = true; }, () => {});
    bindTouch('touch-special', () => { this.specialPressed = true; }, () => {});
    bindTouch('touch-beam', () => { this.beamPressed = true; }, () => {});
    bindTouch('touch-sprint', () => { this.keys['shift'] = true; }, () => { this.keys['shift'] = false; });
    bindTouch('touch-weapon-swap', () => { this.swapWeaponPressed = true; }, () => {});
    bindTouch('touch-interact', () => { this.interactPressed = true; }, () => {});
  }

  update() {
    let x = 0;
    let y = 0;

    if (this.keys['w'] || this.keys['arrowup']) y -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) y += 1;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;

    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    this.moveX = x;
    this.moveY = y;
    this.isSprinting = Boolean(this.keys['shift']);
  }

  consumeAttack() {
    const val = this.attackPressed;
    this.attackPressed = false;
    return val;
  }

  consumeDash() {
    const val = this.dashPressed;
    this.dashPressed = false;
    return val;
  }

  consumeSpecial() {
    const val = this.specialPressed;
    this.specialPressed = false;
    return val;
  }

  consumeBeam() {
    const val = this.beamPressed;
    this.beamPressed = false;
    return val;
  }

  consumeSwapWeapon() {
    const val = this.swapWeaponPressed;
    this.swapWeaponPressed = false;
    return val;
  }

  consumeInteract() {
    const val = this.interactPressed;
    this.interactPressed = false;
    return val;
  }
}

// --- 4. SISTEMA DE PARTÍCULAS ---
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, options = {}) {
    for (let i = 0; i < count; i++) {
      const angle = options.angle !== undefined ? options.angle + (Math.random() - 0.5) * (options.spread || 1) : Math.random() * Math.PI * 2;
      const speed = (options.speed || 40) * (0.5 + Math.random());
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: options.size || (2 + Math.random() * 3),
        color: options.color || '#4ade80',
        alpha: 1,
        life: 0,
        maxLife: options.life || (0.4 + Math.random() * 0.4),
        shape: options.shape || 'circle',
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
      if (p.life >= p.maxLife) this.particles.splice(i, 1);
    }
  }

  draw(ctx, camera) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;

      if (p.shape === 'leaf') {
        ctx.translate(screenX, screenY);
        ctx.rotate(p.life * 4);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}

// --- 5. CÂMERA ---
class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.shakeIntensity = 0;
  }

  shake(amount) {
    this.shakeIntensity = amount;
  }

  update(targetX, targetY, mapWidth, mapHeight, dt) {
    const targetCamX = targetX - this.width / 2;
    const targetCamY = targetY - this.height / 2;

    this.x += (targetCamX - this.x) * 8 * dt;
    this.y += (targetCamY - this.y) * 8 * dt;

    this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));

    if (this.shakeIntensity > 0) {
      this.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 30 * dt);
    }
  }
}

// --- 6. ENTIDADES & PROJÉTEIS ---
class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alive = true;
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    };
  }

  intersects(other) {
    const a = this.getBounds();
    const b = other.getBounds();
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }
}

// Projétil de Feitiço do Cajado
class SpellProjectile extends Entity {
  constructor(x, y, dirX, dirY, color = '#67e8f9', hasBurn = false) {
    super(x, y, 14, 14);
    const speed = 390;
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.life = 0.95;
    this.damage = 1;
    this.hasBurn = hasBurn;
    this.color = hasBurn ? '#f97316' : color;
  }

  update(map, dt, particles) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.random() < 0.45 && particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 1, { color: this.hasBurn ? '#fb923c' : this.color, size: 3, life: 0.2 });
    }

    if (this.life <= 0 || map.checkCollision(this.getBounds())) {
      this.alive = false;
      particles.emit(this.x, this.y, 6, { color: this.color, speed: 55 });
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Projétil de Longo Alcance: Raio Astral [C] / [X]
class AstralBeamProjectile extends Entity {
  constructor(x, y, dirX, dirY, hasBurn = false) {
    super(x, y, 22, 22);
    this.speed = 680;
    this.vx = dirX * this.speed;
    this.vy = dirY * this.speed;
    this.damage = 2;
    this.hasBurn = hasBurn;
    this.color = hasBurn ? '#f97316' : '#38bdf8';
    this.glowColor = hasBurn ? '#ea580c' : '#67e8f9';
    this.hitEntities = new Set();
    this.reflectedPrisms = new Set();
    this.visitedPrisms = new Set();
    this.isHarmonized = false;
    this.trail = [];
  }

  update(map, dt, particles, icePrisms = [], iceRune = null, chronosTotems = [], shadowOrbs = [], boss = null, enemies = [], audio = null, camera = null, game = null) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trail.push({ x: this.x, y: this.y, life: 0.24, color: this.color });
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 1, {
        color: this.color,
        size: this.isHarmonized ? 4.5 : 3.2,
        life: 0.25,
        speed: 15
      });
    }

    // 0. BORDAS DO MAPA / TELA: Só é eliminado se atingir as bordas ou um alvo!
    if (this.x < 0 || this.x > map.width || this.y < 0 || this.y > map.height) {
      this.alive = false;
      return;
    }

    // Colisão com paredes sólidas (atravessa abismos e fendas tile 3, colide com parede tile 1)
    if (map && typeof map.checkWallOnlyCollision === 'function' ? map.checkWallOnlyCollision(this.getBounds()) : map.checkCollision(this.getBounds())) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 14, { color: this.color, speed: 90 });
      }
      return;
    }

    // 1. REFLEXÃO EM PRISMAS GLACIAIS DE QUARTZO (Fase 8)
    // O prisma atua como direcionador a 90 graus, redirecionando o feixe sem eliminá-lo!
    if (icePrisms && Array.isArray(icePrisms)) {
      for (let prism of icePrisms) {
        if (!this.reflectedPrisms.has(prism) && this.intersects(prism)) {
          this.reflectedPrisms.add(prism);
          this.visitedPrisms.add(prism.name || prism);
          prism.onReflect(this, audio, particles);

          // Ao passar por todos os 3 direcionadores, o tiro MUDA DE COR para Dourado/Aurora Radiante!
          if (this.visitedPrisms.size >= 3 && !this.isHarmonized) {
            this.isHarmonized = true;
            this.color = '#facc15';     // Transmuta para Dourado Solar Primordial!
            this.glowColor = '#fef08a';
            if (audio && typeof audio.playVictory === 'function') audio.playVictory();
            if (particles && typeof particles.emit === 'function') {
              particles.emit(this.x, this.y, 35, { color: '#facc15', speed: 130, life: 1.0 });
            }
            if (game && typeof game.showNotification === 'function') {
              game.showNotification('REFRAÇÃO TRINA COMPLETA!', 'O Feixe Astral atravessou os 3 direcionadores e transmutou em Luz Solar!');
            }
          }
          break;
        }
      }
    }

    // 2. ACIONAMENTO DA RUNA GLACIAL (Fase 8)
    // Se o jogador atirar diretamente sem passar pelos 3 direcionadores, a Runa bloqueia e NÃO abre o portal!
    if (iceRune && !iceRune.activated && this.intersects(iceRune)) {
      if (this.isHarmonized) {
        iceRune.activate(audio, particles, camera);
        this.alive = false; // Eliminado ao atingir o alvo harmonizado!
        return;
      } else {
        // Tiro direto ou incompleto: Runa repele o feixe!
        if (iceRune.deflect) iceRune.deflect(audio, particles);
        if (game && typeof game.showNotification === 'function') {
          game.showNotification('LUZ NÃO HARMONIZADA', 'A Runa Glacial só desperta se o feixe for refratado pelos 3 direcionadores!');
        }
        this.alive = false; // Eliminado ao colidir no escudo da Runa
        return;
      }
    }

    // 3. ACIONAMENTO DE TOTENS DE CRONOS (Fase 10): Encontra o alvo e é eliminado
    if (chronosTotems && Array.isArray(chronosTotems)) {
      for (let totem of chronosTotems) {
        if (!this.hitEntities.has(totem) && this.intersects(totem)) {
          totem.activate(audio, particles);
          this.hitEntities.add(totem);
          this.alive = false; // Eliminado ao atingir o alvo!
          return;
        }
      }
    }

    // 4. INVERSÃO LÓGICA DE ORBES ESPECTRAIS (Fase 12): Encontra o alvo e é eliminado
    if (shadowOrbs && Array.isArray(shadowOrbs)) {
      for (let orb of shadowOrbs) {
        if (!this.hitEntities.has(orb) && this.intersects(orb)) {
          orb.toggle(audio, particles, shadowOrbs);
          this.hitEntities.add(orb);
          this.alive = false; // Eliminado ao atingir o alvo!
          return;
        }
      }
    }

    // 5. CHEFES: Encontra o alvo e é eliminado
    if (boss && boss.alive && !this.hitEntities.has(boss) && boss.intersects && boss.intersects(this)) {
      if (boss.shieldActive && typeof boss.breakShield === 'function') {
        boss.breakShield(audio, camera, particles);
      } else {
        boss.takeDamage(this.damage, this, audio, camera, particles, game);
        if (this.hasBurn && typeof boss.applyBurn === 'function') boss.applyBurn(4.0);
      }
      this.hitEntities.add(boss);
      this.alive = false; // Eliminado ao atingir o alvo!
      return;
    }

    // 6. INIMIGOS COMUNS: Encontra o alvo e é eliminado
    if (enemies && Array.isArray(enemies)) {
      for (let enemy of enemies) {
        if (enemy.alive && !this.hitEntities.has(enemy) && this.intersects(enemy)) {
          enemy.takeDamage(this.damage, this, audio, camera, particles);
          if (this.hasBurn && typeof enemy.applyBurn === 'function') enemy.applyBurn(4.0);
          this.hitEntities.add(enemy);
          this.alive = false; // Eliminado ao atingir o alvo!
          return;
        }
      }
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Rastro de Luz Astral
    ctx.save();
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const alpha = pt.life / 0.24;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = (this.isHarmonized ? 8 : 6) * alpha;
      ctx.shadowColor = this.glowColor;
      ctx.shadowBlur = this.isHarmonized ? 16 : 10;
      ctx.globalAlpha = alpha * 0.75;
      ctx.beginPath();
      ctx.arc(pt.x - camera.x, pt.y - camera.y, (this.isHarmonized ? 5 : 4) * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = this.isHarmonized ? 24 : 18;

    // Aura Estelar Solar se Harmonizado
    if (this.isHarmonized) {
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Núcleo Diamantado da Lança Astral
    ctx.beginPath();
    ctx.arc(0, 0, this.isHarmonized ? 9 : 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Raios de Luz em Cruz
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(11, 0);
    ctx.moveTo(0, -11); ctx.lineTo(0, 11);
    ctx.stroke();

    ctx.restore();
  }
}

// Projétil Inimigo / Chefe
class EnemyProjectile extends Entity {
  constructor(x, y, vx, vy, type = 'SHADOW') {
    super(x, y, 16, 16);
    this.vx = vx;
    this.vy = vy;
    this.life = 3.5;
    this.type = type; // 'SHADOW', 'LIGHTNING', 'METEOR'
  }

  update(player, dt, audio, camera, particles) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.intersects(player)) {
      player.takeDamage(1, audio, camera);
      this.alive = false;
      const pColor = this.type === 'METEOR' ? '#f97316' : (this.type === 'LIGHTNING' || this.type === 'FROST' ? '#38bdf8' : (this.type === 'TEMPORAL' ? '#facc15' : '#c084fc'));
      particles.emit(this.x, this.y, 8, {
        color: pColor,
        speed: 60,
      });
    }

    if (this.life <= 0) this.alive = false;
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    let color = '#dc2626';
    let glow = '#ef4444';
    if (this.type === 'LIGHTNING') { color = '#38bdf8'; glow = '#67e8f9'; }
    if (this.type === 'METEOR') { color = '#ea580c'; glow = '#fb923c'; }
    if (this.type === 'FROST') { color = '#0284c7'; glow = '#38bdf8'; }
    if (this.type === 'TEMPORAL') { color = '#d97706'; glow = '#facc15'; }
    if (this.type === 'SHADOW') { color = '#7e22ce'; glow = '#c084fc'; }

    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Onda de Choque Inimiga
class Shockwave extends Entity {
  constructor(x, y, color = '#ef4444') {
    super(x, y, 20, 20);
    this.radius = 10;
    this.maxRadius = 140;
    this.speed = 135;
    this.color = color;
    this.hitPlayer = false;
  }

  update(player, dt, audio, camera, particles) {
    this.radius += this.speed * dt;
    this.width = this.radius * 2;
    this.height = this.radius * 2;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (!this.hitPlayer && Math.abs(dist - this.radius) < 16) {
      if (player.invulnerableTimer <= 0) {
        player.takeDamage(1, audio, camera);
        this.hitPlayer = true;
      }
    }
    if (this.radius >= this.maxRadius) this.alive = false;
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;
    ctx.globalAlpha = Math.max(0, 1 - (this.radius / this.maxRadius));

    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Onda Sísmica Sagrada do Jogador (Super Poder do 1º Boss [R])
class PlayerShockwave extends Entity {
  constructor(x, y, hasBurn = false) {
    super(x, y, 24, 24);
    this.radius = 14;
    this.maxRadius = 185;
    this.speed = 290;
    this.damage = 3;
    this.hasBurn = hasBurn;
    this.hitEnemies = new Set();
  }

  update(enemies, boss, dt, audio, camera, particles) {
    this.radius += this.speed * dt;
    this.width = this.radius * 2;
    this.height = this.radius * 2;

    if (Math.random() < 0.35 && particles && typeof particles.emit === 'function') {
      const a = Math.random() * Math.PI * 2;
      const px = this.x + Math.cos(a) * this.radius;
      const py = this.y + Math.sin(a) * this.radius;
      particles.emit(px, py, 1, { color: this.hasBurn ? '#f97316' : '#facc15', size: 3, life: 0.25 });
    }

    // Atingir inimigos comuns (Passa 'this' como source para cálculo seguro de knockback!)
    if (enemies && Array.isArray(enemies)) {
      enemies.forEach(enemy => {
        if (this.hitEnemies.has(enemy)) return;
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (Math.abs(dist - this.radius) < 28) {
          enemy.takeDamage(this.damage, this, audio, camera, particles);
          if (this.hasBurn && typeof enemy.applyBurn === 'function') enemy.applyBurn(4.0);
          this.hitEnemies.add(enemy);
        }
      });
    }

    // Atingir o chefe (suporta chefes múltiplos ou com clones como BossTrinit)
    if (boss && !this.hitEnemies.has(boss)) {
      let hit = false;
      if (boss.clones && Array.isArray(boss.clones)) {
        for (let cl of boss.clones) {
          if (Math.abs(Math.hypot(cl.x - this.x, cl.y - this.y) - this.radius) < 36) {
            hit = true;
            break;
          }
        }
      } else {
        const dist = Math.hypot(boss.x - this.x, boss.y - this.y);
        if (Math.abs(dist - this.radius) < 36) hit = true;
      }
      if (hit) {
        boss.takeDamage(this.damage, this, audio, camera, particles);
        if (this.hasBurn && typeof boss.applyBurn === 'function') boss.applyBurn(4.0);
        this.hitEnemies.add(boss);
      }
    }

    if (this.radius >= this.maxRadius) this.alive = false;
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.strokeStyle = this.hasBurn ? '#f97316' : '#facc15';
    ctx.lineWidth = 5;
    ctx.shadowColor = this.hasBurn ? '#ea580c' : '#fef08a';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = Math.max(0, 1 - (this.radius / this.maxRadius));

    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.arc(sx, sy, Math.max(0, this.radius - 8), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// Jogador (Kaelen)
class Player extends Entity {
  constructor(x, y) {
    super(x, y, 22, 28);
    this.health = CONFIG.MAX_HEALTH;
    this.maxHealth = CONFIG.MAX_HEALTH;
    this.lives = 3;
    this.maxLives = 5;
    this.stamina = CONFIG.MAX_STAMINA;
    this.facing = 'down';
    this.animTime = 0;
    this.isMoving = false;

    // Super Poder do 1º Boss (Malakar): Onda Sísmica Sagrada [R] + Disparo Triplo
    this.hasColossusPower = false;
    this.specialCooldownTimer = 0;
    this.specialCooldown = 4.0;

    // Sistema de Armas:
    // 'STAFF' (Cajado - Feitiços à distância)
    // 'SWORD' (Espada Celestial / Flamejante - Corpo a corpo)
    this.hasAuroraGem = false; // Permite feitiços à distância com cajado
    this.hasSword = false;     // Conquistado ao derrotar o 2º Boss (Valdor)!
    this.swordLevel = 1;       // Nível 1: Lâmina do Trovão | Nível 2: Lâmina do Fogo Estelar
    this.activeWeapon = 'STAFF';

    // Super Poder do 3º Boss (Kharon): Incineração Cósmica (Queimar inimigos por alguns segundos!)
    this.hasBurnPower = false;

    // Novo Super Poder de Longa Distância: Raio Astral Perfurante [C] / [X]
    this.hasAstralBeam = false;
    this.beamCooldown = 1.6;
    this.beamCooldownTimer = 0;

    // Ataque
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackDuration = 0.22;
    this.attackCooldown = 0;
    this.attackHitbox = null;

    // Dash (no botão Q / K)
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.ghostTrail = [];

    this.invulnerableTimer = 0;
    this.seedsCollected = 0;
  }

  swapWeapon(audio, particles) {
    if (!this.hasSword) return;
    this.activeWeapon = this.activeWeapon === 'STAFF' ? 'SWORD' : 'STAFF';
    audio.playWeaponSwap();
    particles.emit(this.x, this.y, 10, {
      color: this.activeWeapon === 'SWORD' ? (this.swordLevel === 2 ? '#f97316' : '#38bdf8') : '#67e8f9',
      speed: 60,
    });
  }

  update(input, map, dt, audio, particles, camera, projectiles, playerShockwaves, astralBeams = []) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.specialCooldownTimer > 0) this.specialCooldownTimer -= dt;
    if (this.beamCooldownTimer > 0) this.beamCooldownTimer -= dt;

    // Alternar arma com [F] ou [Tab]
    if (input.consumeSwapWeapon()) {
      this.swapWeapon(audio, particles);
    }

    // DISPARAR SUPER PODER DO 1º BOSS COM [R] (Pisão Sísmico Sagrado)
    if (this.hasColossusPower && input.consumeSpecial() && this.specialCooldownTimer <= 0) {
      this.specialCooldownTimer = this.specialCooldown;
      this.invulnerableTimer = 0.5;
      audio.playShockwave();
      camera.shake(12);
      if (playerShockwaves) {
        playerShockwaves.push(new PlayerShockwave(this.x, this.y, this.hasBurnPower));
      }
      particles.emit(this.x, this.y, 40, { color: this.hasBurnPower ? '#f97316' : '#facc15', speed: 140, life: 0.6 });
    }

    // DISPARAR NOVO PODER DE LONGA DISTÂNCIA: RAIO ASTRAL PERFURANTE [C] / [X]
    if (this.hasAstralBeam && input.consumeBeam() && this.beamCooldownTimer <= 0) {
      this.beamCooldownTimer = this.beamCooldown;
      if (audio && typeof audio.playBeamShoot === 'function') audio.playBeamShoot();
      if (camera && typeof camera.shake === 'function') camera.shake(5);

      let bDirX = 0;
      let bDirY = 0;
      if (this.facing === 'down') bDirY = 1;
      else if (this.facing === 'up') bDirY = -1;
      else if (this.facing === 'left') bDirX = -1;
      else if (this.facing === 'right') bDirX = 1;
      if (bDirX === 0 && bDirY === 0) bDirY = 1;

      if (astralBeams) {
        astralBeams.push(new AstralBeamProjectile(this.x, this.y, bDirX, bDirY, this.hasBurnPower));
      }
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 22, {
          color: this.hasBurnPower ? '#f97316' : '#38bdf8',
          speed: 110,
          spread: 0.5,
          angle: this.facing === 'right' ? 0 : this.facing === 'down' ? Math.PI / 2 : this.facing === 'left' ? Math.PI : -Math.PI / 2
        });
      }
    }

    // Rastro fantasma do dash
    for (let i = this.ghostTrail.length - 1; i >= 0; i--) {
      this.ghostTrail[i].alpha -= dt * 4;
      if (this.ghostTrail[i].alpha <= 0) this.ghostTrail.splice(i, 1);
    }

    // PROCESSAR DASH ATIVO (BOTÃO Q)
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.moveWithCollision(this.dashDirX * CONFIG.DASH_SPEED * dt, this.dashDirY * CONFIG.DASH_SPEED * dt, map);

      if (Math.random() < 0.4) {
        this.ghostTrail.push({
          x: this.x,
          y: this.y,
          facing: this.facing,
          alpha: 0.6,
          color: this.hasBurnPower ? '#ea580c' : (this.activeWeapon === 'SWORD' ? (this.swordLevel === 2 ? '#f97316' : '#38bdf8') : '#4ade80'),
        });
      }

      if (this.dashTimer <= 0) this.isDashing = false;
      return;
    }

    // PROCESSAR ATAQUE
    if (this.isAttacking) {
      this.attackTime += dt;
      if (this.attackTime >= this.attackDuration) {
        this.isAttacking = false;
        this.attackHitbox = null;
      }
      return;
    }

    // INICIAR DASH COM BOTÃO Q
    if (input.consumeDash() && this.dashCooldownTimer <= 0 && (input.moveX !== 0 || input.moveY !== 0)) {
      this.isDashing = true;
      this.dashTimer = CONFIG.DASH_DURATION;
      this.dashCooldownTimer = CONFIG.DASH_COOLDOWN;
      this.dashDirX = input.moveX;
      this.dashDirY = input.moveY;
      this.invulnerableTimer = CONFIG.DASH_DURATION;
      audio.playDash();
      particles.emit(this.x, this.y, 8, {
        speed: 70,
        color: this.hasBurnPower ? '#ea580c' : (this.activeWeapon === 'SWORD' ? (this.swordLevel === 2 ? '#fb923c' : '#38bdf8') : '#4ade80'),
      });
      return;
    }

    // INICIAR ATAQUE COM ARMA ATIVA
    if (input.consumeAttack() && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackTime = 0;
      this.attackCooldown = this.activeWeapon === 'SWORD' ? 0.25 : 0.32;
      audio.playSwing(this.activeWeapon === 'SWORD');
      camera.shake(this.activeWeapon === 'SWORD' ? 3 : 2);

      const offset = 26;
      let hx = this.x;
      let hy = this.y;
      let hw = 32;
      let hh = 32;
      let pDirX = 0;
      let pDirY = 0;

      if (this.facing === 'down') { hy += offset; hw = 40; hh = 28; pDirY = 1; }
      else if (this.facing === 'up') { hy -= offset; hw = 40; hh = 28; pDirY = -1; }
      else if (this.facing === 'left') { hx -= offset; hw = 28; hh = 40; pDirX = -1; }
      else if (this.facing === 'right') { hx += offset; hw = 28; hh = 40; pDirX = 1; }

      this.attackHitbox = new Entity(hx, hy, hw, hh);

      // Se armado com Cajado e possui a gema: dispara feitiço à distância!
      if (this.activeWeapon === 'STAFF' && this.hasAuroraGem) {
        if (this.hasColossusPower) {
          // Disparo Triplo Celestial adquirido no 1º Boss!
          const mainCol = this.hasBurnPower ? '#f97316' : '#facc15';
          const subCol = this.hasBurnPower ? '#fb923c' : '#fde047';
          projectiles.push(new SpellProjectile(hx, hy, pDirX, pDirY, mainCol, this.hasBurnPower));
          const cos15 = Math.cos(0.24);
          const sin15 = Math.sin(0.24);
          const dir1X = pDirX * cos15 - pDirY * sin15;
          const dir1Y = pDirX * sin15 + pDirY * cos15;
          const dir2X = pDirX * cos15 + pDirY * sin15;
          const dir2Y = -pDirX * sin15 + pDirY * cos15;
          projectiles.push(new SpellProjectile(hx, hy, dir1X, dir1Y, subCol, this.hasBurnPower));
          projectiles.push(new SpellProjectile(hx, hy, dir2X, dir2Y, subCol, this.hasBurnPower));
          audio.playShoot();
        } else {
          projectiles.push(new SpellProjectile(hx, hy, pDirX, pDirY, this.hasBurnPower ? '#f97316' : '#67e8f9', this.hasBurnPower));
          audio.playShoot();
        }
      }

      particles.emit(hx, hy, 6, {
        color: this.activeWeapon === 'SWORD' ? (this.swordLevel === 2 ? '#f97316' : '#38bdf8') : (this.hasColossusPower ? '#facc15' : '#67e8f9'),
        speed: 70,
        spread: 0.8,
        angle: this.facing === 'right' ? 0 : this.facing === 'down' ? Math.PI / 2 : this.facing === 'left' ? Math.PI : -Math.PI / 2,
      });
      return;
    }

    // PROCESSAR MOVIMENTO & CORRIDA COM SHIFT
    this.isMoving = input.moveX !== 0 || input.moveY !== 0;
    let currentSpeed = CONFIG.WALK_SPEED;

    if (this.isMoving && input.isSprinting && this.stamina > 5) {
      currentSpeed = CONFIG.SPRINT_SPEED;
      this.stamina = Math.max(0, this.stamina - CONFIG.STAMINA_DRAIN_SPRINT * dt);
      if (Math.random() < 0.25) {
        particles.emit(this.x, this.y + 12, 1, { color: '#93c5fd', size: 3, life: 0.2, speed: 20 });
      }
    } else {
      this.stamina = Math.min(CONFIG.MAX_STAMINA, this.stamina + CONFIG.STAMINA_RECOVER * dt);
    }

    if (this.isMoving) {
      this.animTime += dt * (currentSpeed > CONFIG.WALK_SPEED ? 12 : 8);
      if (Math.abs(input.moveX) > Math.abs(input.moveY)) {
        this.facing = input.moveX > 0 ? 'right' : 'left';
      } else {
        this.facing = input.moveY > 0 ? 'down' : 'up';
      }

      const dx = input.moveX * currentSpeed * dt;
      const dy = input.moveY * currentSpeed * dt;
      this.moveWithCollision(dx, dy, map);
    } else {
      this.animTime = 0;
    }
  }

  moveWithCollision(dx, dy, map) {
    // Ejeção preventiva caso o jogador comece sobreposto a uma parede
    if (map.checkCollision(this.getBounds())) {
      const offsets = [[1,0], [-1,0], [0,1], [0,-1], [2,0], [-2,0], [0,2], [0,-2], [4,0], [-4,0], [0,4], [0,-4]];
      for (const [ox, oy] of offsets) {
        this.x += ox * 4;
        this.y += oy * 4;
        if (!map.checkCollision(this.getBounds())) break;
      }
    }

    this.x += dx;
    if (map.checkCollision(this.getBounds())) this.x -= dx;

    this.y += dy;
    if (map.checkCollision(this.getBounds())) this.y -= dy;
  }

  takeDamage(amount, audio, camera) {
    if (this.invulnerableTimer > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 1.0;
    audio.playPlayerHurt();
    camera.shake(8);
  }

  draw(ctx, camera) {
    this.ghostTrail.forEach(ghost => {
      ctx.save();
      ctx.globalAlpha = ghost.alpha;
      this.drawSprite(ctx, ghost.x - camera.x, ghost.y - camera.y, ghost.facing, 0, ghost.color);
      ctx.restore();
    });

    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 12) % 2 === 0) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Sombra do personagem
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Aura Sagrada do Colosso (desbloqueada no 1º Boss)
    if (this.hasColossusPower) {
      ctx.save();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(screenX, screenY + 4, 16 + Math.sin(Date.now() * 0.005) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Aura de Fogo Cósmico (desbloqueada no 3º Boss Kharon)
    if (this.hasBurnPower) {
      ctx.save();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(screenX, screenY + 4, 19 + Math.sin(Date.now() * 0.008) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Aura Astral Estelar (desbloqueada com o Raio Astral [C])
    if (this.hasAstralBeam) {
      ctx.save();
      const t = Date.now() * 0.004;
      const orbX = screenX + Math.cos(t) * 22;
      const orbY = screenY + 4 + Math.sin(t) * 10;
      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const walkBob = Math.sin(this.animTime) * 2;
    this.drawSprite(ctx, screenX, screenY + walkBob, this.facing, walkBob);

    // Efeito Visual do Ataque
    if (this.isAttacking) {
      ctx.save();
      const isSword = this.activeWeapon === 'SWORD';
      const swordFlame = isSword && this.swordLevel === 2;

      ctx.strokeStyle = isSword ? (swordFlame ? '#f97316' : '#38bdf8') : '#67e8f9';
      ctx.lineWidth = isSword ? 4 : 3;
      ctx.shadowColor = isSword ? (swordFlame ? '#ea580c' : '#0284c7') : '#38bdf8';
      ctx.shadowBlur = 12;

      const progress = this.attackTime / this.attackDuration;
      const angle = (progress - 0.5) * Math.PI;

      ctx.translate(screenX, screenY);
      let baseRot = 0;
      if (this.facing === 'right') baseRot = 0;
      if (this.facing === 'down') baseRot = Math.PI / 2;
      if (this.facing === 'left') baseRot = Math.PI;
      if (this.facing === 'up') baseRot = -Math.PI / 2;

      ctx.rotate(baseRot + angle);
      ctx.beginPath();
      ctx.arc(isSword ? 22 : 18, 0, isSword ? 24 : 20, -0.7, 0.7);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawSprite(ctx, x, y, facing, bob, colorOverride = null) {
    ctx.save();
    ctx.translate(x, y);

    const isSword = this.activeWeapon === 'SWORD';
    const isFlame = isSword && this.swordLevel === 2;

    // Manto
    ctx.fillStyle = colorOverride || (isSword ? (isFlame ? '#9a3412' : '#1e3a8a') : '#15803d');
    if (facing === 'up') ctx.fillRect(-10, -10, 20, 22);
    else ctx.fillRect(-9, -8, 18, 20);

    // Túnica
    ctx.fillStyle = colorOverride || (isSword ? (isFlame ? '#ea580c' : '#2563eb') : '#22c55e');
    ctx.fillRect(-7, -6, 14, 16);

    ctx.fillStyle = colorOverride || '#facc15';
    ctx.fillRect(-6, 2, 12, 3);

    // Capuz
    ctx.fillStyle = colorOverride || (isSword ? (isFlame ? '#c2410c' : '#1d4ed8') : '#166534');
    ctx.beginPath();
    ctx.arc(0, -12, 9, 0, Math.PI * 2);
    ctx.fill();

    if (facing !== 'up') {
      ctx.fillStyle = colorOverride || '#1e293b';
      ctx.fillRect(-5, -14, 10, 6);

      ctx.fillStyle = colorOverride || (isSword ? (isFlame ? '#fed7aa' : '#93c5fd') : '#67e8f9');
      if (facing === 'down') {
        ctx.fillRect(-3, -13, 2, 2);
        ctx.fillRect(2, -13, 2, 2);
      } else if (facing === 'right') {
        ctx.fillRect(1, -13, 3, 2);
      } else if (facing === 'left') {
        ctx.fillRect(-4, -13, 3, 2);
      }
    }

    // ARMA: Cajado ou Espada
    let wx = 11;
    let wy = -16;
    if (facing === 'left') wx = -11;
    if (facing === 'up') wy = -12;

    if (isSword) {
      // Espada Celestial / Flamejante
      ctx.fillStyle = colorOverride || '#cbd5e1';
      ctx.fillRect(wx - 1, wy, 3, 20); // Lâmina de aço

      // Guarda e Empunhadura
      ctx.fillStyle = colorOverride || (isFlame ? '#f97316' : '#facc15');
      ctx.fillRect(wx - 4, wy + 16, 9, 3);

      // Brilho na ponta
      ctx.fillStyle = colorOverride || (isFlame ? '#f97316' : '#38bdf8');
      ctx.shadowColor = isFlame ? '#ea580c' : '#67e8f9';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(wx, wy - 1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cajado da Aurora
      ctx.fillStyle = colorOverride || '#78350f';
      ctx.fillRect(wx - 1, wy, 3, 24);

      ctx.fillStyle = colorOverride || (this.hasAuroraGem ? '#67e8f9' : '#4ade80');
      ctx.shadowColor = this.hasAuroraGem ? '#38bdf8' : '#4ade80';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(wx, wy - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Inimigo Comum Adaptativo
class EnemyCreature extends Entity {
  constructor(x, y, biome = 'FOREST') {
    super(x, y, 24, 24);
    this.startX = x;
    this.startY = y;
    this.biome = biome; // 'FOREST', 'CAVE', 'SKY', 'MAGMA', 'VOID'
    this.health = biome === 'VOID' ? 5 : (biome === 'MAGMA' ? 4 : (biome === 'SKY' ? 3 : 2));
    this.speed = biome === 'VOID' ? 100 : (biome === 'SKY' ? 90 : 70);
    this.detectionRadius = 150;
    this.animTime = Math.random() * 5;
    this.hitTimer = 0;
    this.attackCooldown = 0;

    // Queimadura (DoT - Desbloqueado pós-Boss 3)
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = duration;
    this.burnTickTimer = 0.35;
  }

  update(player, map, dt, audio, particles, camera, projectiles) {
    this.animTime += dt * 4;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Processamento de dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.8;
        this.health -= 1;
        this.hitTimer = 0.2;
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 5, { color: '#ea580c', speed: 45, life: 0.35 });
        }
        if (this.health <= 0) {
          this.alive = false;
          if (particles && typeof particles.emit === 'function') {
            particles.emit(this.x, this.y, 16, { color: '#f97316', speed: 100, life: 0.6 });
          }
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    if (distToPlayer < this.detectionRadius) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      const vx = Math.cos(angle) * this.speed * dt;
      const vy = Math.sin(angle) * this.speed * dt;

      this.x += vx;
      if (map.checkCollision(this.getBounds())) this.x -= vx;
      this.y += vy;
      if (map.checkCollision(this.getBounds())) this.y -= vy;

      if (distToPlayer < 24 && this.attackCooldown <= 0) {
        player.takeDamage(1, audio, camera);
        this.attackCooldown = 1.2;
      }
    }

    // Dano por golpe do jogador
    if (player.isAttacking && player.attackHitbox && this.hitTimer <= 0) {
      if (this.intersects(player.attackHitbox)) {
        const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
        this.takeDamage(dmg, player, audio, camera, particles);
        if (player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    // Dano por feitiço disparado
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (this.intersects(projectiles[i])) {
        const p = projectiles[i];
        const dmg = p.damage;
        p.alive = false;
        this.takeDamage(dmg, player, audio, camera, particles);
        if (p.hasBurn || player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    // Chance de coração reduzida para 20% para a vida não ser infinita
    if (!this.alive && Math.random() < 0.20) {
      return new HeartItem(this.x, this.y);
    }
    return null;
  }

  takeDamage(amount, source, audio, camera, particles) {
    // Tratamento resiliente caso a chamada tenha 4 parâmetros (amount, audio, camera, particles)
    if (source && typeof source.playHit === 'function') {
      particles = camera;
      camera = audio;
      audio = source;
      source = null;
    }

    this.health -= amount;
    this.hitTimer = 0.26;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(4);

    if (source && typeof source.x === 'number' && typeof source.y === 'number') {
      const angle = Math.atan2(this.y - source.y, this.x - source.x);
      this.x += Math.cos(angle) * 20;
      this.y += Math.sin(angle) * 20;
    }

    let pColor = '#c084fc';
    if (this.biome === 'CAVE') pColor = '#38bdf8';
    if (this.biome === 'SKY') pColor = '#facc15';
    if (this.biome === 'MAGMA') pColor = '#f97316';
    if (this.biome === 'VOID') pColor = '#e11d48';
    if (this.biome === 'FROZEN') pColor = '#38bdf8';
    if (this.biome === 'CHRONOS') pColor = '#facc15';
    if (this.biome === 'SHADOW') pColor = '#c084fc';
    if (this.biome === 'AETHER') pColor = '#818cf8';

    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 8, { color: pColor, speed: 85 });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 16, { color: pColor, speed: 110, life: 0.6 });
      }
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const squish = Math.sin(this.animTime) * 2;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    let bodyColor = '#6b21a8';
    let eyeColor = '#ef4444';
    if (this.biome === 'CAVE') { bodyColor = '#1e1b4b'; eyeColor = '#38bdf8'; }
    if (this.biome === 'SKY') { bodyColor = '#713f12'; eyeColor = '#facc15'; }
    if (this.biome === 'MAGMA') { bodyColor = '#7c2d12'; eyeColor = '#fb923c'; }
    if (this.biome === 'VOID') { bodyColor = '#09090b'; eyeColor = '#f43f5e'; }
    if (this.biome === 'FROZEN') { bodyColor = '#0c4a6e'; eyeColor = '#67e8f9'; }
    if (this.biome === 'CHRONOS') { bodyColor = '#78350f'; eyeColor = '#fde047'; }
    if (this.biome === 'SHADOW') { bodyColor = '#18181b'; eyeColor = '#c084fc'; }
    if (this.biome === 'AETHER') { bodyColor = '#312e81'; eyeColor = '#38bdf8'; }

    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, squish, 11 + squish, 12 - squish, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.fillRect(-2, squish - 2, 4, 3);

    // Chamas ardentes quando sob efeito de queimadura
    if (this.isBurning) {
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;
      const fH = 10 + Math.sin(this.animTime * 12) * 4;
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -10 - fH);
      ctx.lineTo(6, -10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// ====================================================================
// CHEFE 1: MALAKAR (ÁREA 3 - SANTUÁRIO DA SEIVA)
// ====================================================================
class BossMalakar extends Entity {
  constructor(x, y) {
    super(x, y, 46, 52);
    this.name = 'MALAKAR, O COLOSSO SOMBRIO';
    this.maxHealth = 36;
    this.health = 36;
    this.state = 'IDLE';
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.chargeDirX = 0;
    this.chargeDirY = 0;
    this.enraged = false;
    this.shockwaves = [];
    this.orbs = [];
    this.shadowSpikes = [];

    // Queimadura (DoT - Desbloqueado pós-Boss 3)
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.summonTimer = 7.0;
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnTickTimer = 0.35;
  }

  update(player, map, dt, audio, particles, camera, projectiles, enemies = null) {
    this.animTime += dt * 4;
    this.timer += dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    // Dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.8;
        this.health -= 1;
        this.hitTimer = 0.2;
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 8, { color: '#ea580c', speed: 55, life: 0.45 });
        }
        if (this.health <= 0) {
          this.alive = false;
          if (particles && typeof particles.emit === 'function') {
            particles.emit(this.x, this.y, 50, { color: '#4ade80', speed: 150, life: 1.5 });
          }
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Invocação de Ajudantes (Minions) das Sombras
    if (enemies && Array.isArray(enemies)) {
      this.summonTimer -= dt;
      const maxMinions = this.enraged ? 3 : 2;
      if (this.summonTimer <= 0 && enemies.length < maxMinions) {
        this.summonTimer = this.enraged ? 7.5 : 10.0;
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnDist = 65 + Math.random() * 45;
        const sx = this.x + Math.cos(spawnAngle) * spawnDist;
        const sy = this.y + Math.sin(spawnAngle) * spawnDist;
        enemies.push(new EnemyCreature(sx, sy, 'FOREST'));
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(sx, sy, 22, { color: '#581c87', speed: 85, life: 0.9 });
        }
      }
    }

    if (!this.enraged && this.health <= this.maxHealth / 2) {
      this.enraged = true;
      audio.playBossRoar();
      camera.shake(16);
      particles.emit(this.x, this.y, 45, { color: '#ef4444', speed: 150, life: 1.2 });
    }

    this.shockwaves.forEach(sw => sw.update(player, dt, audio, camera, particles));
    this.shockwaves = this.shockwaves.filter(sw => sw.alive);

    this.orbs.forEach(orb => orb.update(player, dt, audio, camera, particles));
    this.orbs = this.orbs.filter(orb => orb.alive);

    // Atualizar espinhos de sombra sob o jogador
    for (let i = this.shadowSpikes.length - 1; i >= 0; i--) {
      const s = this.shadowSpikes[i];
      s.timer -= dt;
      if (s.timer <= 0 && !s.burst) {
        s.burst = true;
        s.life = 0.45;
        audio.playHit();
        camera.shake(4);
        particles.emit(s.x, s.y, 14, { color: '#581c87', speed: 70 });
        if (Math.hypot(player.x - s.x, player.y - s.y) < 28) {
          player.takeDamage(1, audio, camera);
        }
      }
      if (s.burst) {
        s.life -= dt;
        if (s.life <= 0) this.shadowSpikes.splice(i, 1);
      }
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    switch (this.state) {
      case 'IDLE':
        if (this.timer > (this.enraged ? 0.55 : 0.95)) {
          this.timer = 0;
          const roll = Math.random();
          if (roll < 0.35) {
            this.state = 'TELEGRAPH_STOMP';
          } else if (roll < 0.65) {
            this.state = 'TELEGRAPH_CHARGE';
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.chargeDirX = Math.cos(angle);
            this.chargeDirY = Math.sin(angle);
          } else if (roll < 0.85) {
            this.state = 'TELEGRAPH_SPIKES';
            this.spawnShadowSpikes(player);
          } else {
            this.fireOrbs(player, audio);
            this.state = 'CHASE';
          }
        }
        break;

      case 'CHASE':
        const chaseSpeed = this.enraged ? 95 : 65;
        const cAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(cAngle) * chaseSpeed * dt;
        this.y += Math.sin(cAngle) * chaseSpeed * dt;

        if (distToPlayer < 38) player.takeDamage(1, audio, camera);
        if (this.timer > 1.8) { this.timer = 0; this.state = 'IDLE'; }
        break;

      case 'TELEGRAPH_STOMP':
        particles.emit(this.x, this.y + 20, 3, { color: '#ef4444', speed: 25 });
        if (this.timer > (this.enraged ? 0.45 : 0.75)) {
          this.timer = 0;
          this.state = 'STOMP';
          audio.playBossRoar();
          camera.shake(14);
          // Pisão Sísmico Duplo!
          this.shockwaves.push(new Shockwave(this.x, this.y + 10, '#ef4444'));
          setTimeout(() => {
            if (this.alive) {
              this.shockwaves.push(new Shockwave(this.x, this.y + 10, '#dc2626'));
              camera.shake(8);
            }
          }, 320);
          particles.emit(this.x, this.y + 10, 30, { color: '#f87171', speed: 120 });
        }
        break;

      case 'STOMP':
        if (this.timer > 0.45) { this.timer = 0; this.state = 'IDLE'; }
        break;

      case 'TELEGRAPH_SPIKES':
        if (this.timer > 0.6) { this.timer = 0; this.state = 'IDLE'; }
        break;

      case 'TELEGRAPH_CHARGE':
        particles.emit(this.x, this.y, 4, { color: '#dc2626', speed: 45 });
        if (this.timer > (this.enraged ? 0.35 : 0.6)) {
          this.timer = 0;
          this.state = 'CHARGE';
          audio.playBossRoar();
        }
        break;

      case 'CHARGE':
        const chargeSpeed = this.enraged ? 330 : 260;
        this.x += this.chargeDirX * chargeSpeed * dt;
        this.y += this.chargeDirY * chargeSpeed * dt;
        particles.emit(this.x, this.y + 16, 3, { color: '#991b1b', speed: 40 });

        if (distToPlayer < 40) player.takeDamage(1, audio, camera);
        if (this.timer > 0.75 || map.checkCollision(this.getBounds())) {
          this.timer = 0;
          this.state = 'IDLE';
          camera.shake(8);
        }
        break;
    }

    if (player.isAttacking && player.attackHitbox && this.hitTimer <= 0) {
      if (this.intersects(player.attackHitbox)) {
        const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
        this.takeDamage(dmg, audio, camera, particles);
        if (player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (this.intersects(projectiles[i])) {
        const dmg = projectiles[i].damage;
        if (projectiles[i].hasBurn || player.hasBurnPower) this.applyBurn(4.0);
        projectiles[i].alive = false;
        this.takeDamage(dmg, audio, camera, particles);
      }
    }

    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  spawnShadowSpikes(player) {
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 54;
      const offsetY = (Math.random() - 0.5) * 54;
      this.shadowSpikes.push({
        x: player.x + offsetX,
        y: player.y + offsetY,
        timer: 0.55 + i * 0.15,
        burst: false,
        life: 0
      });
    }
  }

  fireOrbs(player, audio) {
    audio.playBossRoar();
    const count = this.enraged ? 7 : 5;
    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
    const spread = 0.65;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - (count - 1) / 2) * (spread / count);
      this.orbs.push(new EnemyProjectile(this.x, this.y, Math.cos(angle) * 155, Math.sin(angle) * 155, 'SHADOW'));
    }
  }

  takeDamage(amount, arg2, arg3, arg4, arg5) {
    let audio = arg2;
    let camera = arg3;
    let particles = arg4;
    if (arg2 && typeof arg2.x === 'number') {
      audio = arg3;
      camera = arg4;
      particles = arg5;
    }

    this.health -= amount;
    this.hitTimer = 0.25;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(5);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 10, { color: '#ef4444', speed: 90 });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 50, { color: '#4ade80', speed: 150, life: 1.5 });
      }
    }
  }

  draw(ctx, camera) {
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.orbs.forEach(orb => orb.draw(ctx, camera));

    // Desenhar espinhos das sombras sob o jogador
    this.shadowSpikes.forEach(s => {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      ctx.save();
      if (!s.burst) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#3b0764';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy + 6);
        ctx.lineTo(sx, sy - 26);
        ctx.lineTo(sx + 10, sy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.enraged) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 36 + Math.sin(this.animTime * 3) * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : (this.enraged ? '#7f1d1d' : '#18181b');
    ctx.fillRect(-20, -18, 40, 40);

    ctx.fillStyle = this.enraged ? '#b91c1c' : '#4c1d95';
    ctx.fillRect(-22, -12, 6, 30);
    ctx.fillRect(16, -12, 6, 30);

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(-24, -38);
    ctx.lineTo(-12, -28);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -20);
    ctx.lineTo(24, -38);
    ctx.lineTo(12, -28);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 10;
    ctx.fillRect(-10, -12, 6, 4);
    ctx.fillRect(4, -12, 6, 4);

    if (this.isBurning) {
      for (let i = 0; i < 6; i++) {
        const fa = (i / 6) * Math.PI * 2 + this.animTime * 3;
        const fx = Math.cos(fa) * 26;
        const fy = Math.sin(fa) * 24 + Math.sin(this.animTime * 8 + i) * 6;
        ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#eab308';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(fx, fy, 4.5 + Math.sin(this.animTime * 6 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ====================================================================
// CHEFE 2: VALDOR (ÁREA 5 - TRONO DO TROVÃO)
// ====================================================================
class BossValdor extends Entity {
  constructor(x, y) {
    super(x, y, 48, 56);
    this.name = 'VALDOR, O ARCONTE DO TROVÃO';
    this.maxHealth = 48;
    this.health = 48;
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.state = 'FLOAT';
    this.orbs = [];
    this.shockwaves = [];
    this.lightningStrikes = [];

    // Queimadura (DoT - Desbloqueado pós-Boss 3)
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.summonTimer = 6.5;
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnTickTimer = 0.35;
  }

  update(player, map, dt, audio, particles, camera, projectiles, enemies = null) {
    this.animTime += dt * 5;
    this.timer += dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    // Dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.8;
        this.health -= 1;
        this.hitTimer = 0.2;
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 8, { color: '#ea580c', speed: 55, life: 0.45 });
        }
        if (this.health <= 0) {
          this.alive = false;
          if (particles && typeof particles.emit === 'function') {
            particles.emit(this.x, this.y, 60, { color: '#facc15', speed: 160, life: 1.8 });
          }
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Invocação de Ajudantes (Elementais da Tempestade)
    if (enemies && Array.isArray(enemies)) {
      this.summonTimer -= dt;
      if (this.summonTimer <= 0 && enemies.length < 2) {
        this.summonTimer = 8.5;
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnDist = 70 + Math.random() * 40;
        const sx = this.x + Math.cos(spawnAngle) * spawnDist;
        const sy = this.y + Math.sin(spawnAngle) * spawnDist;
        enemies.push(new EnemyCreature(sx, sy, 'SKY'));
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(sx, sy, 22, { color: '#38bdf8', speed: 90, life: 0.85 });
        }
      }
    }

    this.orbs.forEach(orb => orb.update(player, dt, audio, camera, particles));
    this.orbs = this.orbs.filter(orb => orb.alive);

    this.shockwaves.forEach(sw => sw.update(player, dt, audio, camera, particles));
    this.shockwaves = this.shockwaves.filter(sw => sw.alive);

    // Atualizar tempestade de raios
    for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
      const ls = this.lightningStrikes[i];
      ls.timer -= dt;
      if (ls.timer <= 0 && !ls.struck) {
        ls.struck = true;
        ls.life = 0.35;
        audio.playBossRoar();
        camera.shake(8);
        particles.emit(ls.x, ls.y, 25, { color: '#38bdf8', speed: 120 });
        if (Math.hypot(player.x - ls.x, player.y - ls.y) < 32) {
          player.takeDamage(1, audio, camera);
        }
      }
      if (ls.struck) {
        ls.life -= dt;
        if (ls.life <= 0) this.lightningStrikes.splice(i, 1);
      }
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    switch (this.state) {
      case 'FLOAT':
        this.x += Math.cos(this.animTime) * 55 * dt;
        this.y += Math.sin(this.animTime * 0.7) * 40 * dt;

        if (this.timer > 1.0) {
          this.timer = 0;
          const roll = Math.random();
          if (roll < 0.35) {
            this.state = 'STORM';
          } else if (roll < 0.7) {
            this.state = 'THUNDER_STRIKES';
            this.spawnLightningStrikes(player);
          } else {
            this.state = 'DASH';
          }
        }
        break;

      case 'STORM':
        audio.playBossRoar();
        camera.shake(7);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + this.animTime;
          this.orbs.push(new EnemyProjectile(this.x, this.y, Math.cos(ang) * 175, Math.sin(ang) * 175, 'LIGHTNING'));
        }
        this.shockwaves.push(new Shockwave(this.x, this.y, '#38bdf8'));
        this.state = 'FLOAT';
        break;

      case 'THUNDER_STRIKES':
        if (this.timer > 0.65) {
          this.timer = 0;
          this.state = 'FLOAT';
        }
        break;

      case 'DASH':
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * 310 * dt;
        this.y += Math.sin(angle) * 310 * dt;
        particles.emit(this.x, this.y, 5, { color: '#38bdf8', speed: 80 });

        if (distToPlayer < 38) player.takeDamage(1, audio, camera);
        if (this.timer > 0.75) {
          this.timer = 0;
          this.state = 'FLOAT';
        }
        break;
    }

    if (player.isAttacking && player.attackHitbox && this.hitTimer <= 0) {
      if (this.intersects(player.attackHitbox)) {
        const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
        this.takeDamage(dmg, audio, camera, particles);
        if (player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (this.intersects(projectiles[i])) {
        const dmg = projectiles[i].damage;
        if (projectiles[i].hasBurn || player.hasBurnPower) this.applyBurn(4.0);
        projectiles[i].alive = false;
        this.takeDamage(dmg, audio, camera, particles);
      }
    }

    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  spawnLightningStrikes(player) {
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const r = 35 + Math.random() * 45;
      this.lightningStrikes.push({
        x: player.x + Math.cos(ang) * r,
        y: player.y + Math.sin(ang) * r,
        timer: 0.5 + i * 0.1,
        struck: false,
        life: 0
      });
    }
  }

  takeDamage(amount, arg2, arg3, arg4, arg5) {
    let audio = arg2;
    let camera = arg3;
    let particles = arg4;
    if (arg2 && typeof arg2.x === 'number') {
      audio = arg3;
      camera = arg4;
      particles = arg5;
    }

    this.health -= amount;
    this.hitTimer = 0.22;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(6);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 12, { color: '#38bdf8', speed: 95 });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 60, { color: '#facc15', speed: 160, life: 1.8 });
      }
    }
  }

  draw(ctx, camera) {
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.orbs.forEach(orb => orb.draw(ctx, camera));

    // Desenhar tempestade de raios
    this.lightningStrikes.forEach(ls => {
      const sx = ls.x - camera.x;
      const sy = ls.y - camera.y;
      ctx.save();
      if (!ls.struck) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 180);
        ctx.lineTo(sx - 8, sy - 90);
        ctx.lineTo(sx + 8, sy - 40);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      ctx.restore();
    });

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingFlap = Math.sin(this.animTime * 3) * 6;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(-38, -30 + wingFlap);
    ctx.lineTo(-20, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -10);
    ctx.lineTo(38, -30 + wingFlap);
    ctx.lineTo(20, 8);
    ctx.fill();

    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : '#eab308';
    ctx.fillRect(-16, -18, 32, 38);

    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(-8, -12, 5, 4);
    ctx.fillRect(3, -12, 5, 4);

    if (this.isBurning) {
      for (let i = 0; i < 6; i++) {
        const fa = (i / 6) * Math.PI * 2 + this.animTime * 3.5;
        const fx = Math.cos(fa) * 28;
        const fy = Math.sin(fa) * 24 + Math.sin(this.animTime * 8 + i) * 6;
        ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#eab308';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(fx, fy, 4.5 + Math.sin(this.animTime * 6 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ====================================================================
// CHEFE 3 FINAL: KHARON, O SOBERANO DO ECLIPSE (ÁREA 7 - NÚCLEO DO VAZIO)
// ====================================================================
class BossKharon extends Entity {
  constructor(x, y) {
    super(x, y, 54, 60);
    this.name = 'KHARON, O SOBERANO DO ECLIPSE';
    this.maxHealth = 65;
    this.health = 65;
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.state = 'HOVER';
    this.meteors = [];
    this.shockwaves = [];

    // Queimadura (DoT - Desbloqueado pós-Boss 3)
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.summonTimer = 5.5;
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnTickTimer = 0.35;
  }

  update(player, map, dt, audio, particles, camera, projectiles, enemies = null) {
    this.animTime += dt * 4;
    this.timer += dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    // Dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.8;
        this.health -= 1;
        this.hitTimer = 0.2;
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 10, { color: '#ea580c', speed: 60, life: 0.5 });
        }
        if (this.health <= 0) {
          this.alive = false;
          if (particles && typeof particles.emit === 'function') {
            particles.emit(this.x, this.y, 80, { color: '#facc15', speed: 180, life: 2.0 });
          }
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Invocação de Ajudantes (Acólitos do Vazio)
    if (enemies && Array.isArray(enemies)) {
      this.summonTimer -= dt;
      if (this.summonTimer <= 0 && enemies.length < 3) {
        this.summonTimer = 7.5;
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnDist = 80 + Math.random() * 40;
        const sx = this.x + Math.cos(spawnAngle) * spawnDist;
        const sy = this.y + Math.sin(spawnAngle) * spawnDist;
        enemies.push(new EnemyCreature(sx, sy, 'VOID'));
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(sx, sy, 25, { color: '#e11d48', speed: 95, life: 0.9 });
        }
      }
    }

    this.meteors.forEach(m => m.update(player, dt, audio, camera, particles));
    this.meteors = this.meteors.filter(m => m.alive);

    this.shockwaves.forEach(sw => sw.update(player, dt, audio, camera, particles));
    this.shockwaves = this.shockwaves.filter(sw => sw.alive);

    // Efeito de Atração da Gravidade do Vazio no centro da arena
    const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
    const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
    const distToCenter = Math.hypot(centerX - player.x, centerY - player.y);
    if (distToCenter > 15 && distToCenter < 240) {
      const pullAngle = Math.atan2(centerY - player.y, centerX - player.x);
      const pullSpeed = 42;
      player.x += Math.cos(pullAngle) * pullSpeed * dt;
      player.y += Math.sin(pullAngle) * pullSpeed * dt;
      if (Math.random() < 0.2) {
        particles.emit(player.x, player.y, 1, { color: '#881337', size: 3, life: 0.25 });
      }
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    switch (this.state) {
      case 'HOVER':
        this.x += Math.cos(this.animTime * 0.8) * 55 * dt;
        this.y += Math.sin(this.animTime * 0.5) * 40 * dt;

        if (this.timer > 0.95) {
          this.timer = 0;
          const roll = Math.random();
          if (roll < 0.35) {
            this.state = 'METEOR_SHOWER';
          } else if (roll < 0.7) {
            this.state = 'VOID_BEAM';
          } else {
            this.state = 'ECLIPSE_NOVA';
          }
        }
        break;

      case 'METEOR_SHOWER':
        audio.playBossRoar();
        camera.shake(9);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
          this.meteors.push(new EnemyProjectile(this.x, this.y, Math.cos(ang) * 160, Math.sin(ang) * 160, 'METEOR'));
        }
        this.state = 'HOVER';
        break;

      case 'VOID_BEAM':
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = -2; i <= 2; i++) {
          const a = angle + i * 0.16;
          this.meteors.push(new EnemyProjectile(this.x, this.y, Math.cos(a) * 235, Math.sin(a) * 235, 'SHADOW'));
        }
        this.state = 'HOVER';
        break;

      case 'ECLIPSE_NOVA':
        audio.playBossRoar();
        camera.shake(12);
        this.shockwaves.push(new Shockwave(this.x, this.y, '#e11d48'));
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          this.meteors.push(new EnemyProjectile(this.x, this.y, Math.cos(ang) * 150, Math.sin(ang) * 150, 'METEOR'));
        }
        this.state = 'HOVER';
        break;
    }

    if (player.isAttacking && player.attackHitbox && this.hitTimer <= 0) {
      if (this.intersects(player.attackHitbox)) {
        const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
        this.takeDamage(dmg, audio, camera, particles);
        if (player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (this.intersects(projectiles[i])) {
        const dmg = projectiles[i].damage;
        if (projectiles[i].hasBurn || player.hasBurnPower) this.applyBurn(4.0);
        projectiles[i].alive = false;
        this.takeDamage(dmg, audio, camera, particles);
      }
    }

    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  takeDamage(amount, arg2, arg3, arg4, arg5) {
    let audio = arg2;
    let camera = arg3;
    let particles = arg4;
    if (arg2 && typeof arg2.x === 'number') {
      audio = arg3;
      camera = arg4;
      particles = arg5;
    }

    this.health -= amount;
    this.hitTimer = 0.22;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(7);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 14, { color: '#f43f5e', speed: 100 });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 80, { color: '#facc15', speed: 180, life: 2.0 });
      }
    }
  }

  draw(ctx, camera) {
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.meteors.forEach(m => m.draw(ctx, camera));

    // Desenhar Vórtice Cósmico no centro da arena
    const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2 - camera.x;
    const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2 - camera.y;
    ctx.save();
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.35)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32 + Math.sin(this.animTime * 4) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingFlap = Math.sin(this.animTime * 3) * 8;
    ctx.fillStyle = '#881337';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-45, -35 + wingFlap);
    ctx.lineTo(-24, 14);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, -12);
    ctx.lineTo(45, -35 + wingFlap);
    ctx.lineTo(24, 14);
    ctx.fill();

    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : '#0f172a';
    ctx.fillRect(-20, -22, 40, 44);

    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#fda4af';
    ctx.shadowBlur = 12;
    ctx.fillRect(-10, -14, 6, 4);
    ctx.fillRect(4, -14, 6, 4);

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();

    if (this.isBurning) {
      for (let i = 0; i < 7; i++) {
        const fa = (i / 7) * Math.PI * 2 + this.animTime * 3.5;
        const fx = Math.cos(fa) * 32;
        const fy = Math.sin(fa) * 26 + Math.sin(this.animTime * 8 + i) * 7;
        ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#eab308';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(fx, fy, 5 + Math.sin(this.animTime * 6 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ====================================================================
// SISTEMA DE ENIGMAS EXCLUSIVOS PRÉ-BOSS (3 BIOMAS DISTINTOS)
// ====================================================================

// 1. ENIGMA DA CAVERNA: Cristais Harmônicos Musicais (Sequência Poética)
class HarmonicCrystal extends Entity {
  constructor(x, y, colorId, name, color, freq, stepOrder) {
    super(x, y, 32, 44);
    this.colorId = colorId;       // 'SAPPHIRE', 'TOPAZ', 'AMETHYST'
    this.name = name;             // 'Cristal Safira', etc.
    this.color = color;           // '#38bdf8', '#facc15', '#c084fc'
    this.freq = freq;             // 261.63 (Dó), 329.63 (Mi), 392.00 (Sol)
    this.stepOrder = stepOrder;   // 1, 2, 3
    this.activated = false;
    this.animTime = Math.random() * Math.PI * 2;
    this.flashTimer = 0;
  }

  update(player, dt) {
    this.animTime += dt * 3;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    return Math.hypot(player.x - this.x, player.y - this.y) < 46;
  }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    const bob = Math.sin(this.animTime) * 3;

    // Pedestal de Pedra Rúnica
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-14, 10, 28, 10);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(-11, 8, 22, 3);

    // Cristal Flutuante Facetado
    ctx.fillStyle = this.activated ? this.color : (this.flashTimer > 0 ? '#ef4444' : '#475569');
    ctx.shadowColor = this.activated ? this.color : (this.flashTimer > 0 ? '#ef4444' : 'transparent');
    ctx.shadowBlur = this.activated ? 22 : (this.flashTimer > 0 ? 18 : 0);

    ctx.beginPath();
    ctx.moveTo(0, -20 + bob);
    ctx.lineTo(12, -2 + bob);
    ctx.lineTo(0, 14 + bob);
    ctx.lineTo(-12, -2 + bob);
    ctx.closePath();
    ctx.fill();

    // Reflexo e feixe de luz vertical quando ativado
    if (this.activated) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -2 + bob, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -20 + bob);
      ctx.lineTo(0, -60 + bob);
      ctx.stroke();
    }

    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(this.activated ? `✨ ${this.name} (Ressoando)` : `[E] Tocar ${this.name}`, sx, sy - 28);
      ctx.restore();
    }
  }
}

// 2. ENIGMA DO PALÁCIO DOS VENTOS: Rosa dos Ventos dos Arcontes (Lógica Vetorial)
class WindCompassTotem extends Entity {
  constructor(x, y, cardinal, targetDirection, name) {
    super(x, y, 36, 44);
    this.cardinal = cardinal;       // 'NORTH', 'SOUTH', 'EAST', 'WEST'
    this.name = name;               // 'Catavento Setentrional', etc.
    this.targetDirection = targetDirection; // 0=Norte, 1=Leste, 2=Sul, 3=Oeste
    // Inicia desalinhado propositalmente para o jogador ter que resolver
    const wrongDirs = [0, 1, 2, 3].filter(d => d !== targetDirection);
    this.direction = wrongDirs[Math.floor(Math.random() * wrongDirs.length)];
    this.animTime = 0;
  }

  isAligned() {
    return this.direction === this.targetDirection;
  }

  rotate(audio) {
    this.direction = (this.direction + 1) % 4;
    if (audio) audio.playWindGust();
  }

  update(player, dt) {
    this.animTime += dt * 4;
    return Math.hypot(player.x - this.x, player.y - this.y) < 46;
  }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    const aligned = this.isAligned();

    // Pedestal de Mármore Celeste
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, 8, 28, 12);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-12, 6, 24, 3);

    // Haste de Bronze
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-3, -12, 6, 20);

    // Seta da Rosa dos Ventos Giratória
    ctx.save();
    ctx.translate(0, -14);
    ctx.rotate((this.direction * Math.PI) / 2);

    const arrowColor = aligned ? '#facc15' : '#38bdf8';
    ctx.fillStyle = arrowColor;
    ctx.shadowColor = aligned ? '#fef08a' : '#67e8f9';
    ctx.shadowBlur = aligned ? 16 : 8;

    // Seta apontando (Norte = -Y)
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(8, -6);
    ctx.lineTo(3, -6);
    ctx.lineTo(3, 14);
    ctx.lineTo(-3, 14);
    ctx.lineTo(-3, -6);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Vórtice de ar dourado ao alinhar
    if (aligned) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -14, 18 + Math.sin(this.animTime) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (isNear) {
      const dirLabels = ['Norte (↑)', 'Leste (→)', 'Sul (↓)', 'Oeste (←)'];
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = aligned ? '#fef08a' : '#67e8f9';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(`[E] Girar: ${dirLabels[this.direction]}`, sx, sy - 34);
      if (aligned) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✨ Vento Rumo ao Centro!', sx, sy - 22);
      }
      ctx.restore();
    }
  }
}

// 3. ENIGMA DO ABISMO DE MAGMA: Caldeiras Térmicas de Pressão (Aritmética e Alquimia)
class ThermalPressureValve extends Entity {
  constructor(x, y, name, heatValue) {
    super(x, y, 36, 42);
    this.name = name;
    this.heatValue = heatValue; // ex: +4, +6, +7, -3
    this.isOpen = false;
    this.animTime = Math.random() * Math.PI * 2;
  }

  toggle(audio) {
    this.isOpen = !this.isOpen;
    if (audio) audio.playSteamHiss();
  }

  update(player, dt) {
    this.animTime += dt * 4;
    return Math.hypot(player.x - this.x, player.y - this.y) < 46;
  }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    const isCooler = this.heatValue < 0;

    // Caldeira de Ferro Vulcânico
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-15, -6, 30, 24);

    // Tubulação de Magma
    ctx.fillStyle = this.isOpen ? (isCooler ? '#38bdf8' : '#ea580c') : '#44403c';
    ctx.fillRect(-18, 0, 36, 6);

    // Válvula Giratória
    ctx.save();
    ctx.translate(0, -12);
    if (this.isOpen) ctx.rotate(this.animTime * 2);
    ctx.strokeStyle = this.isOpen ? (isCooler ? '#67e8f9' : '#f97316') : '#78716c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
    ctx.moveTo(0, -7); ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.restore();

    // Vapores térmicos
    if (this.isOpen) {
      ctx.fillStyle = isCooler ? 'rgba(56, 189, 248, 0.55)' : 'rgba(249, 115, 22, 0.55)';
      ctx.beginPath();
      ctx.arc(0, -22 + Math.sin(this.animTime * 3) * 3, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Badge do Valor Térmico
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = isCooler ? '#38bdf8' : '#f97316';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.heatValue > 0 ? '+' : ''}${this.heatValue}ºC`, 0, 12);

    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(`[E] ${this.isOpen ? 'Fechar' : 'Abrir'} (${this.heatValue > 0 ? '+' : ''}${this.heatValue}ºC)`, sx, sy - 28);
      ctx.restore();
    }
  }
}

// 4. MONÓLITO ANCESTRAL DE PISTAS (Tabuleta Rúnica Decifrável com [E])
class PuzzleTabletMonument extends Entity {
  constructor(x, y, title, riddle) {
    super(x, y, 32, 38);
    this.title = title;
    this.riddle = riddle;
    this.glow = 0;
  }

  update(player, dt) {
    this.glow += dt * 2.5;
    return Math.hypot(player.x - this.x, player.y - this.y) < 46;
  }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -16, 24, 32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, -14, 20, 28);

    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8 + Math.sin(this.glow) * 4;
    ctx.fillRect(-6, -10, 12, 2);
    ctx.fillRect(-4, -5, 8, 2);
    ctx.fillRect(-6, 0, 12, 2);
    ctx.fillRect(-3, 5, 6, 2);

    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(`[E] Ler ${this.title}`, sx, sy - 26);
      ctx.restore();
    }
  }
}

// Altar da Forja (Área 6 - Evolui a Espada!)
class ForgeAltar extends Entity {
  constructor(x, y) {
    super(x, y, 48, 48);
    this.used = false;
    this.glow = 0;
  }

  update(player, dt) {
    this.glow += dt * 3;
    return Math.hypot(player.x - this.x, player.y - this.y) < 54;
  }

  draw(ctx, camera, isNear, currentHeat = null) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(-22, -10, 44, 28);

    const isReady = currentHeat === 10;
    ctx.fillStyle = isReady ? '#facc15' : '#ea580c';
    ctx.shadowColor = isReady ? '#fef08a' : '#f97316';
    ctx.shadowBlur = isReady ? 22 : 14;
    ctx.fillRect(-12, -22, 24, 14);

    ctx.restore();

    if (currentHeat !== null && !this.used) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = currentHeat === 10 ? '#4ade80' : '#f87171';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(`🔥 Cadinho: ${currentHeat}ºC / 10ºC`, sx, sy - 42);
      ctx.restore();
    }

    if (isNear && !this.used) {
      ctx.save();
      ctx.fillStyle = currentHeat === 10 ? '#fef08a' : '#cbd5e1';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(currentHeat === 10 ? '[E] Forjar Lâmina Titânica' : '[E] Cadinho Instável', sx, sy - 28);
      ctx.restore();
    }
  }
}

// ====================================================================
// NOVAS ENTIDADES, CHECKPOINTS E ENIGMAS LÓGICOS DAS FASES 8 A 11
// ====================================================================

// 1. MONÓLITO DE CHECKPOINT (Marco Físico de Retorno e Renascimento)
class CheckpointMonument extends Entity {
  constructor(x, y, name = 'Marco Sagrado') {
    super(x, y, 32, 40);
    this.name = name;
    this.activated = false;
    this.glow = 0;
  }

  update(player, dt) {
    this.glow += dt * 3;
    return Math.hypot(player.x - this.x, player.y - this.y) < 46;
  }

  activate(game) {
    this.activated = true;
    game.registerCheckpoint(this.name, this.x, this.y + 24, game.currentArea);
    game.audio.playCheckpoint();
    game.camera.shake(6);
    game.particles.emit(this.x, this.y - 12, 35, { color: '#facc15', speed: 110, life: 1.2 });
    game.showNotification('CHECKPOINT ATIVADO!', `🚩 ${this.name} registrado como marco de retorno!`);
  }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Pedestal de Pedra Rúnica
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, 6, 24, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -12, 16, 18);

    // Coluna vertical de luz se ativado
    if (this.activated) {
      const beamGrad = ctx.createLinearGradient(0, -60, 0, 0);
      beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0.35)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(-10, -60, 20, 60);
    }

    // Cristal Flutuante
    const floatY = Math.sin(this.glow) * 4;
    const crystalColor = this.activated ? '#facc15' : '#64748b';
    const glowColor = this.activated ? '#fef08a' : '#94a3b8';

    ctx.fillStyle = crystalColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.activated ? 18 : 6;

    ctx.beginPath();
    ctx.moveTo(0, -28 + floatY);
    ctx.lineTo(8, -18 + floatY);
    ctx.lineTo(0, -8 + floatY);
    ctx.lineTo(-8, -18 + floatY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -18 + floatY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = this.activated ? '#4ade80' : '#fef08a';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(this.activated ? `🚩 ${this.name} (Ativo)` : `[E] Ativar Checkpoint`, sx, sy - 36);
      ctx.restore();
    }
  }
}

// 2. ENIGMA 4 (FASE 8): PRISMA GLACIAL REFLETOR DE LUZ
class IcePrismMirror extends Entity {
  constructor(x, y, rotation = 0, name = 'Prisma Glacial') {
    super(x, y, 36, 36);
    this.name = name;
    // rotation:
    // 0: '/' (UP -> RIGHT, LEFT -> DOWN, DOWN -> LEFT, RIGHT -> UP)
    // 1: '\' (UP -> LEFT, RIGHT -> DOWN, DOWN -> RIGHT, LEFT -> UP)
    this.rotation = rotation;
    this.anim = 0;
  }

  update(player, dt) {
    this.anim += dt * 3;
    return Math.hypot(player.x - this.x, player.y - this.y) < 46;
  }

  rotate(audio, particles) {
    this.rotation = (this.rotation + 1) % 2; // Alterna entre as diagonais refletoras
    if (audio && typeof audio.playPrismRotate === 'function') audio.playPrismRotate();
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 16, { color: '#38bdf8', speed: 85 });
    }
  }

  onReflect(beam, audio, particles) {
    const spd = beam.speed;
    const curVx = beam.vx;
    const curVy = beam.vy;

    beam.x = this.x;
    beam.y = this.y;

    if (this.rotation === 0) {
      // Espelho '/' (Diagonal NE-SW)
      if (curVy < -50) { beam.vx = spd; beam.vy = 0; }
      else if (curVx < -50) { beam.vx = 0; beam.vy = spd; }
      else if (curVy > 50) { beam.vx = -spd; beam.vy = 0; }
      else if (curVx > 50) { beam.vx = 0; beam.vy = -spd; }
    } else {
      // Espelho '\' (Diagonal NW-SE)
      if (curVy < -50) { beam.vx = -spd; beam.vy = 0; }
      else if (curVx > 50) { beam.vx = 0; beam.vy = spd; }
      else if (curVy > 50) { beam.vx = spd; beam.vy = 0; }
      else if (curVx < -50) { beam.vx = 0; beam.vy = -spd; }
    }

    if (audio && typeof audio.playPrismRotate === 'function') audio.playPrismRotate();
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 20, { color: '#67e8f9', speed: 110 });
    }
  }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Suporte octogonal de gelo
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Espelho de Quartzo Glacial Facetado
    ctx.save();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    if (this.rotation === 0) {
      ctx.moveTo(-11, 11);
      ctx.lineTo(11, -11);
    } else {
      ctx.moveTo(-11, -11);
      ctx.lineTo(11, 11);
    }
    ctx.stroke();
    ctx.restore();

    // Cristal central
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      const angleStr = this.rotation === 0 ? 'Orientação: ↗ /' : 'Orientação: ↘ \\';
      ctx.fillText(`[E] Rotacionar (${angleStr})`, sx, sy - 24);
      ctx.restore();
    }
  }
}

// 3. RUNA CRISTALINA ALVO (FASE 8: GELEIRA)
class IcePortalCrystalRune extends Entity {
  constructor(x, y) {
    super(x, y, 36, 44);
    this.activated = false;
    this.glow = 0;
    this.deflectTimer = 0;
  }

  update(dt) {
    this.glow += dt * 3.5;
    if (this.deflectTimer > 0) this.deflectTimer -= dt;
  }

  deflect(audio, particles) {
    this.deflectTimer = 0.5;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 22, { color: '#94a3b8', speed: 85, life: 0.4 });
    }
  }

  activate(audio, particles, camera) {
    if (this.activated) return;
    this.activated = true;
    if (audio && typeof audio.playVictory === 'function') audio.playVictory();
    if (camera && typeof camera.shake === 'function') camera.shake(12);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 50, { color: '#facc15', speed: 140, life: 1.6 });
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(-14, 8, 28, 14);

    const cColor = this.activated ? '#facc15' : (this.deflectTimer > 0 ? '#ef4444' : '#64748b');
    ctx.fillStyle = cColor;
    ctx.shadowColor = this.activated ? '#fef08a' : (this.deflectTimer > 0 ? '#f87171' : '#334155');
    ctx.shadowBlur = this.activated ? 24 : 8;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(12, -4);
    ctx.lineTo(0, 10);
    ctx.lineTo(-12, -4);
    ctx.closePath();
    ctx.fill();

    if (this.deflectTimer > 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.activated) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.beginPath();
      ctx.arc(0, -6, 26 + Math.sin(this.glow) * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// 4. ENIGMA 5 (FASE 9): TOTEM TEMPORAL DE CRONOS
class ChronosTotem extends Entity {
  constructor(x, y, id, name) {
    super(x, y, 36, 48);
    this.id = id;
    this.name = name;
    this.activeTimer = 0;
    this.glow = 0;
  }

  update(dt) {
    this.glow += dt * 3;
    if (this.activeTimer > 0) {
      this.activeTimer = Math.max(0, this.activeTimer - dt);
    }
  }

  activate(audio, particles) {
    this.activeTimer = 6.0;
    if (audio && typeof audio.playChronosDing === 'function') audio.playChronosDing();
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 25, { color: '#facc15', speed: 100 });
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    const isLit = this.activeTimer > 0;

    // Base do Totem
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-14, 10, 28, 14);

    // Corpo da Ampulheta Ancestral
    ctx.fillStyle = isLit ? '#facc15' : '#451a03';
    ctx.shadowColor = isLit ? '#fef08a' : '#1c1917';
    ctx.shadowBlur = isLit ? 20 : 4;

    ctx.beginPath();
    ctx.moveTo(-12, -24);
    ctx.lineTo(12, -24);
    ctx.lineTo(-12, 10);
    ctx.lineTo(12, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Contador de Tempo Acima do Totem
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    if (isLit) {
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(`⏱️ ${this.activeTimer.toFixed(1)}s`, sx, sy - 34);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(this.name, sx, sy - 34);
    }
    ctx.restore();
  }
}

// 5. ENIGMA 6 (FASE 10): ORBE DE LÓGICA BOOLEANA (INVERSÃO EM REDE)
class ShadowLogicOrb extends Entity {
  constructor(x, y, id, name, initialOn = false) {
    super(x, y, 32, 32);
    this.id = id;
    this.name = name;
    this.isOn = initialOn;
    this.anim = Math.random() * 5;
    this.neighbors = [];
  }

  setNeighbors(neighbors) {
    this.neighbors = neighbors;
  }

  update(player, dt) {
    this.anim += dt * 3.2;
    return Math.hypot(player.x - this.x, player.y - this.y) < 44;
  }

  toggle(audio, particles, allOrbs = null) {
    this.isOn = !this.isOn;
    if (allOrbs && this.neighbors.length > 0) {
      this.neighbors.forEach(idx => {
        if (allOrbs[idx]) allOrbs[idx].isOn = !allOrbs[idx].isOn;
      });
    }
    if (audio && typeof audio.playPuzzleTone === 'function') {
      audio.playPuzzleTone(this.isOn ? 523.25 : 293.66);
    }
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 18, { color: this.isOn ? '#22d3ee' : '#a855f7', speed: 80 });
    }
  }

  draw(ctx, camera, isNear, allOrbs = null) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Desenhar condutores rúnicos entre orbes conectados
    if (allOrbs && this.neighbors) {
      ctx.save();
      this.neighbors.forEach(nIdx => {
        if (nIdx > this.id && allOrbs[nIdx]) {
          const target = allOrbs[nIdx];
          const tx = target.x - camera.x;
          const ty = target.y - camera.y;
          ctx.strokeStyle = (this.isOn && target.isOn) ? '#22d3ee' : 'rgba(88, 28, 135, 0.4)';
          ctx.lineWidth = (this.isOn && target.isOn) ? 3 : 1.5;
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = (this.isOn && target.isOn) ? 10 : 0;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx, sy);

    const floatY = Math.sin(this.anim) * 3;
    const col = this.isOn ? '#22d3ee' : '#3b0764';
    const glow = this.isOn ? '#67e8f9' : '#1e1b4b';

    ctx.fillStyle = col;
    ctx.shadowColor = glow;
    ctx.shadowBlur = this.isOn ? 22 : 6;

    ctx.beginPath();
    ctx.arc(0, floatY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, floatY, this.isOn ? 4 : 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = this.isOn ? '#67e8f9' : '#e9d5ff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(`[E] Inverter ${this.name} (${this.isOn ? 'ACESO' : 'APAGADO'})`, sx, sy - 26);
      ctx.restore();
    }
  }
}

// 6. CHEFE 4 (FASE 9): TRINIT, A TRÍADE GLACIAL
class BossTrinit extends Entity {
  constructor(x, y) {
    super(x, y, 46, 46);
    this.name = 'TRINIT, A TRÍADE GLACIAL';
    this.maxHealth = 65;
    this.health = 65;
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.orbitAngle = 0;
    this.orbitRadius = 95;
    this.centerX = x;
    this.centerY = y;

    // 3 clones autônomos com HP compartilhado formando uma tríade
    this.clones = [
      { id: 0, x: x, y: y, angleOffset: 0, hitTimer: 0, width: 44, height: 44 },
      { id: 1, x: x, y: y, angleOffset: (2 * Math.PI) / 3, hitTimer: 0, width: 44, height: 44 },
      { id: 2, x: x, y: y, angleOffset: (4 * Math.PI) / 3, hitTimer: 0, width: 44, height: 44 }
    ];

    this.projectiles = [];
    this.shockwaves = [];
    this.attackTimer = 2.4;
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnTickTimer = 0.35;
  }

  intersects(other) {
    if (!other) return false;
    const oBounds = typeof other.getBounds === 'function' ? other.getBounds() : {
      left: other.x - (other.width || 20) / 2,
      right: other.x + (other.width || 20) / 2,
      top: other.y - (other.height || 20) / 2,
      bottom: other.y + (other.height || 20) / 2
    };

    for (let cl of this.clones) {
      const cLeft = cl.x - cl.width / 2;
      const cRight = cl.x + cl.width / 2;
      const cTop = cl.y - cl.height / 2;
      const cBottom = cl.y + cl.height / 2;
      if (cLeft < oBounds.right && cRight > oBounds.left && cTop < oBounds.bottom && cBottom > oBounds.top) {
        return true;
      }
    }
    return false;
  }

  takeDamage(amount, arg2, arg3, arg4, arg5) {
    let audio = arg2;
    let camera = arg3;
    let particles = arg4;
    if (arg2 && typeof arg2.x === 'number') {
      audio = arg3;
      camera = arg4;
      particles = arg5;
    }

    this.health -= amount;
    this.hitTimer = 0.22;
    this.clones.forEach(c => c.hitTimer = 0.22);

    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(6);
    if (particles && typeof particles.emit === 'function') {
      for (let cl of this.clones) {
        particles.emit(cl.x, cl.y, 8, { color: '#38bdf8', speed: 95 });
      }
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        for (let cl of this.clones) {
          particles.emit(cl.x, cl.y, 35, { color: '#38bdf8', speed: 140, life: 1.5 });
          particles.emit(cl.x, cl.y, 25, { color: '#e0f2fe', speed: 110, life: 1.2 });
        }
      }
    }
  }

  update(player, map, dt, audio, particles, camera, projectiles, enemies = null) {
    this.animTime += dt * 4;
    this.timer += dt;
    this.attackTimer -= dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    this.clones.forEach(c => { if (c.hitTimer > 0) c.hitTimer -= dt; });

    // Dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.35;
        this.health -= 1;
        this.hitTimer = 0.15;
        this.clones.forEach(c => c.hitTimer = 0.15);
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          for (let cl of this.clones) particles.emit(cl.x, cl.y, 4, { color: '#ea580c', speed: 45 });
        }
        if (this.health <= 0) {
          this.alive = false;
          return;
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Atualizar órbita dos 3 clones ao redor do jogador
    this.orbitAngle += dt * 1.05;
    for (let i = 0; i < this.clones.length; i++) {
      const cl = this.clones[i];
      const ang = this.orbitAngle + cl.angleOffset;
      const targetX = player.x + Math.cos(ang) * this.orbitRadius;
      const targetY = player.y + Math.sin(ang) * this.orbitRadius;
      cl.x += (targetX - cl.x) * dt * 3.5;
      cl.y += (targetY - cl.y) * dt * 3.5;
    }
    // Sincroniza posição do clone 0 como âncora
    this.x = this.clones[0].x;
    this.y = this.clones[0].y;

    // Atualizar projéteis e ondas de choque
    this.projectiles.forEach(p => p.update(player, dt, audio, camera, particles));
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.shockwaves.forEach(sw => sw.update(player, dt, audio, camera, particles));
    this.shockwaves = this.shockwaves.filter(sw => sw.alive);

    // Ataque da Tríade
    if (this.attackTimer <= 0) {
      this.attackTimer = 2.4;
      const roll = Math.random();

      if (roll < 0.5) {
        // Ataque 1: Triangulação Criogênica - os 3 clones disparam simultaneamente em direção ao jogador!
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (camera && typeof camera.shake === 'function') camera.shake(5);
        for (let cl of this.clones) {
          const ang = Math.atan2(player.y - cl.y, player.x - cl.x);
          this.projectiles.push(new EnemyProjectile(cl.x, cl.y, Math.cos(ang) * 190, Math.sin(ang) * 190, 'FROST'));
        }
      } else if (roll < 0.8) {
        // Ataque 2: Rajada tripla em leque de cada clone
        if (audio && typeof audio.playShoot === 'function') audio.playShoot();
        for (let cl of this.clones) {
          const baseAng = Math.atan2(player.y - cl.y, player.x - cl.x);
          for (let s = -1; s <= 1; s++) {
            const a = baseAng + s * 0.28;
            this.projectiles.push(new EnemyProjectile(cl.x, cl.y, Math.cos(a) * 160, Math.sin(a) * 160, 'FROST'));
          }
        }
      } else {
        // Ataque 3: Pulso de Choque Glacial
        if (audio && typeof audio.playShockwave === 'function') audio.playShockwave();
        this.shockwaves.push(new Shockwave(player.x, player.y, '#38bdf8'));
      }
    }

    // Dano por ataque corpo a corpo (Espada / Cajado)
    if (player.isAttacking && player.attackTimer > 0.1) {
      const pBounds = player.getAttackBounds();
      for (let cl of this.clones) {
        const cLeft = cl.x - cl.width / 2;
        const cRight = cl.x + cl.width / 2;
        const cTop = cl.y - cl.height / 2;
        const cBottom = cl.y + cl.height / 2;
        if (cLeft < pBounds.right && cRight > pBounds.left && cTop < pBounds.bottom && cBottom > pBounds.top) {
          const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
          this.takeDamage(dmg, audio, camera, particles);
          if (player.hasBurnPower) this.applyBurn(4.0);
          break;
        }
      }
    }

    // Dano por feitiço de cajado
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      for (let cl of this.clones) {
        const cLeft = cl.x - cl.width / 2;
        const cRight = cl.x + cl.width / 2;
        const cTop = cl.y - cl.height / 2;
        const cBottom = cl.y + cl.height / 2;
        const pBounds = proj.getBounds ? proj.getBounds() : { left: proj.x - 8, right: proj.x + 8, top: proj.y - 8, bottom: proj.y + 8 };
        if (cLeft < pBounds.right && cRight > pBounds.left && cTop < pBounds.bottom && cBottom > pBounds.top) {
          const dmg = proj.damage || 1;
          if (proj.hasBurn || player.hasBurnPower) this.applyBurn(4.0);
          proj.alive = false;
          this.takeDamage(dmg, audio, camera, particles);
          break;
        }
      }
    }

    // Atualizar HUD de Boss
    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  draw(ctx, camera) {
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.projectiles.forEach(p => p.draw(ctx, camera));

    // Linha de energia glacial conectando a Tríade
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < this.clones.length; i++) {
      const cl = this.clones[i];
      const sx = cl.x - camera.x;
      const sy = cl.y - camera.y;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Renderizar cada um dos 3 clones
    for (let cl of this.clones) {
      const sx = cl.x - camera.x;
      const sy = cl.y - camera.y;
      const floatY = Math.sin(this.animTime + cl.angleOffset) * 5;

      ctx.save();
      ctx.translate(sx, sy + floatY);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 24 - floatY, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo de Cristal Glacial
      ctx.fillStyle = cl.hitTimer > 0 ? '#ffffff' : '#0284c7';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(16, -4);
      ctx.lineTo(11, 16);
      ctx.lineTo(-11, 16);
      ctx.lineTo(-16, -4);
      ctx.closePath();
      ctx.fill();

      // Cristais Menores nos Ombros
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-18, -12, 6, 12);
      ctx.fillRect(12, -12, 6, 12);

      // Olho Rúnico
      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#e0f2fe';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -3, 5, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo Rúnico
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

// 7. CHEFE 5 (FASE 11): MIRAGE, O SENHOR DOS REFLEXOS ILUSÓRIOS
class BossMirage extends Entity {
  constructor(x, y) {
    super(x, y, 48, 48);
    this.name = 'MIRAGE, O SENHOR DOS REFLEXOS';
    this.maxHealth = 70;
    this.health = 70;
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;

    this.shuffleCooldown = 8.0;
    this.attackTimer = 2.2;
    this.phantomAlertTimer = 0;
    this.phantomAlertText = '';
    this.phantomAlertX = 0;
    this.phantomAlertY = 0;

    // 2 Clones Fantasmas Idênticos e Invulneráveis
    this.phantoms = [
      { id: 1, x: x - 95, y: y - 25, width: 48, height: 48, hitTimer: 0, ripple: 0, isReal: false },
      { id: 2, x: x + 95, y: y - 25, width: 48, height: 48, hitTimer: 0, ripple: 0, isReal: false }
    ];

    this.projectiles = [];
    this.shockwaves = [];
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnTickTimer = 0.35;
  }

  intersects(other) {
    if (!other) return false;
    // Checa interseção com o Boss real
    if (super.intersects(other)) return true;
    // Checa interseção com os fantasmas
    const oBounds = typeof other.getBounds === 'function' ? other.getBounds() : {
      left: other.x - (other.width || 20) / 2,
      right: other.x + (other.width || 20) / 2,
      top: other.y - (other.height || 20) / 2,
      bottom: other.y + (other.height || 20) / 2
    };
    for (let ph of this.phantoms) {
      const pLeft = ph.x - ph.width / 2;
      const pRight = ph.x + ph.width / 2;
      const pTop = ph.y - ph.height / 2;
      const pBottom = ph.y + ph.height / 2;
      if (pLeft < oBounds.right && pRight > oBounds.left && pTop < oBounds.bottom && pBottom > oBounds.top) {
        return true;
      }
    }
    return false;
  }

  onPhantomHit(phantom, audio, camera, particles) {
    phantom.hitTimer = 0.3;
    phantom.ripple = 0.5;
    this.phantomAlertTimer = 1.2;
    this.phantomAlertText = 'ILUSÃO FANTASMA!';
    this.phantomAlertX = phantom.x;
    this.phantomAlertY = phantom.y - 28;

    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (particles && typeof particles.emit === 'function') {
      particles.emit(phantom.x, phantom.y, 16, { color: '#cbd5e1', speed: 80, life: 0.6 });
    }
  }

  takeDamage(amount, arg2, arg3, arg4, arg5) {
    let source = null;
    let audio = arg2;
    let camera = arg3;
    let particles = arg4;
    if (arg2 && typeof arg2.x === 'number') {
      source = arg2;
      audio = arg3;
      camera = arg4;
      particles = arg5;
    }

    // Se o dano veio de uma fonte posicional (projétil, feixe astral ou onda), verificar se atingiu um fantasma em vez do real!
    if (source) {
      for (let ph of this.phantoms) {
        if (Math.hypot(source.x - ph.x, source.y - ph.y) < 32) {
          this.onPhantomHit(ph, audio, camera, particles);
          return; // Fantasmas são imunes e não sofrem dano!
        }
      }
    }

    // Atingiu o Mirage verdadeiro!
    this.health -= amount;
    this.hitTimer = 0.22;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(7);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 18, { color: '#facc15', speed: 110 });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 50, { color: '#facc15', speed: 160, life: 1.8 });
        for (let ph of this.phantoms) {
          particles.emit(ph.x, ph.y, 30, { color: '#94a3b8', speed: 120, life: 1.0 });
        }
      }
    }
  }

  shufflePositions(audio, camera, particles) {
    if (audio && typeof audio.playShockwave === 'function') audio.playShockwave();
    if (camera && typeof camera.shake === 'function') camera.shake(10);

    // Lista de todas as 3 posições atuais
    const positions = [
      { x: this.x, y: this.y },
      { x: this.phantoms[0].x, y: this.phantoms[0].y },
      { x: this.phantoms[1].x, y: this.phantoms[1].y }
    ];

    // Embaralhar posições com algoritmo Fisher-Yates
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Emite fumaça e areia temporal nas posições anteriores
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 25, { color: '#facc15', speed: 130, life: 0.8 });
      particles.emit(this.phantoms[0].x, this.phantoms[0].y, 20, { color: '#94a3b8', speed: 110, life: 0.8 });
      particles.emit(this.phantoms[1].x, this.phantoms[1].y, 20, { color: '#94a3b8', speed: 110, life: 0.8 });
    }

    // Atribui novas posições
    this.x = positions[0].x;
    this.y = positions[0].y;
    this.phantoms[0].x = positions[1].x;
    this.phantoms[0].y = positions[1].y;
    this.phantoms[1].x = positions[2].x;
    this.phantoms[1].y = positions[2].y;
  }

  update(player, map, dt, audio, particles, camera, projectiles, enemies = null) {
    this.animTime += dt * 3.8;
    this.timer += dt;
    this.attackTimer -= dt;
    this.shuffleCooldown -= dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    if (this.phantomAlertTimer > 0) this.phantomAlertTimer -= dt;
    this.phantoms.forEach(ph => {
      if (ph.hitTimer > 0) ph.hitTimer -= dt;
      if (ph.ripple > 0) ph.ripple -= dt;
    });

    // Dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.35;
        this.health -= 1;
        this.hitTimer = 0.15;
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 5, { color: '#ea580c', speed: 50 });
        }
        if (this.health <= 0) {
          this.alive = false;
          return;
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Embaralhamento Temporal a cada 8 segundos!
    if (this.shuffleCooldown <= 0) {
      this.shuffleCooldown = 8.0;
      this.shufflePositions(audio, camera, particles);
    }

    // Flutuação suave
    this.x += Math.cos(this.animTime * 0.8) * 20 * dt;
    this.y += Math.sin(this.animTime) * 15 * dt;
    this.phantoms[0].x += Math.cos(this.animTime * 0.7 + 1) * 20 * dt;
    this.phantoms[0].y += Math.sin(this.animTime * 0.9 + 1) * 15 * dt;
    this.phantoms[1].x += Math.cos(this.animTime * 0.6 + 2) * 20 * dt;
    this.phantoms[1].y += Math.sin(this.animTime * 0.8 + 2) * 15 * dt;

    // Atualizar projéteis e ondas de choque
    this.projectiles.forEach(p => p.update(player, dt, audio, camera, particles));
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.shockwaves.forEach(sw => sw.update(player, dt, audio, camera, particles));
    this.shockwaves = this.shockwaves.filter(sw => sw.alive);

    // Ataque: Todos os 3 disparam projéteis temporais para confundir o jogador
    if (this.attackTimer <= 0) {
      this.attackTimer = 2.3;
      if (audio && typeof audio.playShoot === 'function') audio.playShoot();

      // Tiro do Real
      const angReal = Math.atan2(player.y - this.y, player.x - this.x);
      this.projectiles.push(new EnemyProjectile(this.x, this.y, Math.cos(angReal) * 180, Math.sin(angReal) * 180, 'TEMPORAL'));

      // Tiros dos Fantasmas
      for (let ph of this.phantoms) {
        const ang = Math.atan2(player.y - ph.y, player.x - ph.x);
        this.projectiles.push(new EnemyProjectile(ph.x, ph.y, Math.cos(ang) * 170, Math.sin(ang) * 170, 'TEMPORAL'));
      }
    }

    // Dano por ataque corpo a corpo (Espada / Cajado)
    if (player.isAttacking && player.attackTimer > 0.1) {
      const pBounds = player.getAttackBounds();
      // Checa fantasma primeiro
      for (let ph of this.phantoms) {
        const pLeft = ph.x - ph.width / 2;
        const pRight = ph.x + ph.width / 2;
        const pTop = ph.y - ph.height / 2;
        const pBottom = ph.y + ph.height / 2;
        if (pLeft < pBounds.right && pRight > pBounds.left && pTop < pBounds.bottom && pBottom > pBounds.top) {
          this.onPhantomHit(ph, audio, camera, particles);
          break;
        }
      }
      // Checa real
      if (super.intersects(pBounds)) {
        const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
        this.takeDamage(dmg, audio, camera, particles);
        if (player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    // Dano por projéteis comuns do jogador
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      let consumed = false;
      for (let ph of this.phantoms) {
        if (Math.hypot(proj.x - ph.x, proj.y - ph.y) < 26) {
          proj.alive = false;
          this.onPhantomHit(ph, audio, camera, particles);
          consumed = true;
          break;
        }
      }
      if (!consumed && super.intersects(proj)) {
        const dmg = proj.damage || 1;
        if (proj.hasBurn || player.hasBurnPower) this.applyBurn(4.0);
        proj.alive = false;
        this.takeDamage(dmg, audio, camera, particles);
      }
    }

    // Atualizar HUD de Boss
    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  draw(ctx, camera) {
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.projectiles.forEach(p => p.draw(ctx, camera));

    // Renderizar Fantasmas
    for (let ph of this.phantoms) {
      const sx = ph.x - camera.x;
      const sy = ph.y - camera.y;
      const floatY = Math.sin(this.animTime + ph.id) * 4;

      ctx.save();
      ctx.translate(sx, sy + floatY);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 24 - floatY, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ondulação da Ilusão quando golpeado
      if (ph.ripple > 0) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Manto Temporal do Fantasma (Prateado / Translúcido Ilusório)
      ctx.fillStyle = ph.hitTimer > 0 ? '#ffffff' : '#475569';
      ctx.shadowColor = '#94a3b8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(18, 0);
      ctx.lineTo(14, 20);
      ctx.lineTo(-14, 20);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();

      // Núcleo Ilusório Pálido (Sem brilho solar verdadeiro)
      ctx.fillStyle = '#cbd5e1';
      ctx.shadowColor = '#64748b';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Renderizar Mirage REAL
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const floatY = Math.sin(this.animTime) * 4;

    ctx.save();
    ctx.translate(sx, sy + floatY);

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 24 - floatY, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Manto Temporal do Mirage Real
    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : '#78350f';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(18, 0);
    ctx.lineTo(14, 20);
    ctx.lineTo(-14, 20);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();

    // RELÍQUIA DOURADA DE CRONOS (O SEGREDO VISUAL QUE IDENTIFICA O VERDADEIRO!)
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Alerta Flutuante de Ilusão
    if (this.phantomAlertTimer > 0) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(this.phantomAlertText, this.phantomAlertX - camera.x, this.phantomAlertY - camera.y);
      ctx.restore();
    }
  }
}

// Foice Bumerangue das Sombras (Nocturnus)
class ShadowScythe extends Entity {
  constructor(x, y, targetX, targetY, owner) {
    super(x, y, 24, 24);
    this.owner = owner;
    this.startX = x;
    this.startY = y;
    this.speed = 185;
    const angle = Math.atan2(targetY - y, targetX - x);
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.time = 0;
    this.rot = 0;
    this.returning = false;
  }

  update(player, dt, audio, camera, particles) {
    this.time += dt;
    this.rot += dt * 14;

    if (this.time > 1.3 && !this.returning) {
      this.returning = true;
    }

    if (this.returning) {
      const angle = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
      this.vx = Math.cos(angle) * (this.speed * 1.35);
      this.vy = Math.sin(angle) * (this.speed * 1.35);
      if (Math.hypot(this.owner.x - this.x, this.owner.y - this.y) < 22) {
        this.alive = false;
        return;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.hypot(player.x - this.x, player.y - this.y) < 24) {
      player.takeDamage(1, audio, camera);
      this.alive = false;
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 1.25);
    ctx.stroke();

    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}

// Poço de Vazio Fervilhante (Nocturnus)
class VoidPool {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 28;
    this.life = 6.0;
    this.alive = true;
    this.damageCooldown = 0;
  }

  update(player, dt, audio, camera, particles) {
    this.life -= dt;
    if (this.damageCooldown > 0) this.damageCooldown -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < this.radius) {
      player.x -= player.vx * dt * 0.45; // Lentidão ao pisar no vazio
      player.y -= player.vy * dt * 0.45;
      if (this.damageCooldown <= 0) {
        player.takeDamage(1, audio, camera);
        this.damageCooldown = 1.2;
      }
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(24, 24, 27, 0.72)';
    ctx.shadowColor = '#581c87';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(Math.cos(this.life * 4) * 8, Math.sin(this.life * 4) * 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 8. CHEFE 6 (FASE 13): NOCTURNUS, O SOBERANO DO ABISMO
class BossNocturnus extends Entity {
  constructor(x, y) {
    super(x, y, 50, 50);
    this.name = 'NOCTURNUS, O SOBERANO DO ABISMO';
    this.maxHealth = 80;
    this.health = 80;
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;

    this.attackTimer = 2.0;
    this.teleportTimer = 5.0;
    this.hitCount = 0;

    this.scythes = [];
    this.voidPools = [];
    this.projectiles = [];
    this.shockwaves = [];
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnTickTimer = 0.35;
  }

  takeDamage(amount, arg2, arg3, arg4, arg5) {
    let audio = arg2;
    let camera = arg3;
    let particles = arg4;
    if (arg2 && typeof arg2.x === 'number') {
      audio = arg3;
      camera = arg4;
      particles = arg5;
    }

    this.health -= amount;
    this.hitTimer = 0.22;
    this.hitCount++;

    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(7);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 16, { color: '#c084fc', speed: 100 });
    }

    // Teletransporte de evasão após receber 4 golpes
    if (this.hitCount >= 4) {
      this.hitCount = 0;
      this.teleportShadow(audio, camera, particles);
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 60, { color: '#581c87', speed: 170, life: 2.0 });
        particles.emit(this.x, this.y, 40, { color: '#c084fc', speed: 140, life: 1.5 });
      }
    }
  }

  teleportShadow(audio, camera, particles) {
    if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
    if (camera && typeof camera.shake === 'function') camera.shake(8);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 25, { color: '#581c87', speed: 120, life: 0.8 });
    }

    // Teletransporta para uma posição segura dentro da arena
    const minX = 8 * CONFIG.TILE_SIZE;
    const maxX = 28 * CONFIG.TILE_SIZE;
    const minY = 8 * CONFIG.TILE_SIZE;
    const maxY = 20 * CONFIG.TILE_SIZE;
    this.x = minX + Math.random() * (maxX - minX);
    this.y = minY + Math.random() * (maxY - minY);

    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 25, { color: '#c084fc', speed: 120, life: 0.8 });
    }

    // Rajada de 6 projéteis de sombras ao reaparecer
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.projectiles.push(new EnemyProjectile(this.x, this.y, Math.cos(a) * 165, Math.sin(a) * 165, 'SHADOW'));
    }
  }

  update(player, map, dt, audio, particles, camera, projectiles, enemies = null) {
    this.animTime += dt * 3.5;
    this.timer += dt;
    this.attackTimer -= dt;
    this.teleportTimer -= dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    // Dano contínuo de queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.35;
        this.health -= 1;
        this.hitTimer = 0.15;
        if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 6, { color: '#ea580c', speed: 50 });
        }
        if (this.health <= 0) {
          this.alive = false;
          return;
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Teletransporte periódico
    if (this.teleportTimer <= 0) {
      this.teleportTimer = 6.0;
      this.teleportShadow(audio, camera, particles);
    }

    // Movimentação suave
    this.x += Math.cos(this.animTime * 0.9) * 35 * dt;
    this.y += Math.sin(this.animTime * 1.1) * 25 * dt;

    // Atualizar Foices do Abismo
    for (let i = this.scythes.length - 1; i >= 0; i--) {
      this.scythes[i].update(player, dt, audio, camera, particles);
      if (!this.scythes[i].alive) this.scythes.splice(i, 1);
    }

    // Atualizar Poços de Vazio
    for (let i = this.voidPools.length - 1; i >= 0; i--) {
      this.voidPools[i].update(player, dt, audio, camera, particles);
      if (!this.voidPools[i].alive) this.voidPools.splice(i, 1);
    }

    // Atualizar projéteis e ondas de choque
    this.projectiles.forEach(p => p.update(player, dt, audio, camera, particles));
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.shockwaves.forEach(sw => sw.update(player, dt, audio, camera, particles));
    this.shockwaves = this.shockwaves.filter(sw => sw.alive);

    // Ataque de Foice ou Poço de Vazio
    if (this.attackTimer <= 0) {
      this.attackTimer = 2.2;
      const roll = Math.random();

      if (roll < 0.5) {
        // Ataque 1: Duas Foices do Abismo Bumerangue!
        if (audio && typeof audio.playSwing === 'function') audio.playSwing(true);
        this.scythes.push(new ShadowScythe(this.x, this.y, player.x - 30, player.y - 30, this));
        this.scythes.push(new ShadowScythe(this.x, this.y, player.x + 30, player.y + 30, this));
      } else if (roll < 0.8) {
        // Ataque 2: Invoca Poços de Vazio no chão
        if (audio && typeof audio.playShockwave === 'function') audio.playShockwave();
        this.voidPools.push(new VoidPool(player.x, player.y));
        this.voidPools.push(new VoidPool(player.x + (Math.random() - 0.5) * 80, player.y + (Math.random() - 0.5) * 80));
      } else {
        // Ataque 3: Onda de Trevas
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        this.shockwaves.push(new Shockwave(this.x, this.y, '#7e22ce'));
      }
    }

    // Dano por ataque corpo a corpo (Espada / Cajado)
    if (player.isAttacking && player.attackTimer > 0.1) {
      const pBounds = player.getAttackBounds();
      if (this.intersects(pBounds)) {
        const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
        this.takeDamage(dmg, audio, camera, particles);
        if (player.hasBurnPower) this.applyBurn(4.0);
      }
    }

    // Dano por projéteis comuns do jogador
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      if (this.intersects(proj)) {
        const dmg = proj.damage || 1;
        if (proj.hasBurn || player.hasBurnPower) this.applyBurn(4.0);
        proj.alive = false;
        this.takeDamage(dmg, audio, camera, particles);
      }
    }

    // Atualizar HUD de Boss
    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  draw(ctx, camera) {
    this.voidPools.forEach(vp => vp.draw(ctx, camera));
    this.scythes.forEach(sc => sc.draw(ctx, camera));
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.projectiles.forEach(p => p.draw(ctx, camera));

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const floatY = Math.sin(this.animTime) * 4;

    ctx.save();
    ctx.translate(sx, sy + floatY);

    // Sombra do Abismo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 26 - floatY, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Manto Negro do Soberano
    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : '#09090b';
    ctx.shadowColor = '#581c87';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(22, 2);
    ctx.lineTo(16, 24);
    ctx.lineTo(-16, 24);
    ctx.lineTo(-22, 2);
    ctx.closePath();
    ctx.fill();

    // Capuz e Borda Roxa
    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Olhos do Vazio
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#e9d5ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(-6, -6, 3, 3);
    ctx.fillRect(3, -6, 3, 3);

    // Foice empunhada na mão
    ctx.save();
    ctx.rotate(Math.sin(this.animTime * 2) * 0.2);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.lineTo(26, -26);
    ctx.arc(22, -26, 8, 0, Math.PI, true);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}

// 9. CHEFE 7 (FASE 14): AETHON, O ARQUITETO DAS DIMENSÕES (MEGA-CHEFE FINAL)
class BossAethon extends Entity {
  constructor(x, y) {
    super(x, y, 54, 54);
    this.maxHealth = 85;
    this.health = 85;
    this.state = 'HOVER';
    this.timer = 0;
    this.animTime = 0;
    this.hitTimer = 0;
    this.shieldActive = true;
    this.shieldBrokenTimer = 0;
    this.projectiles = [];
    this.shockwaves = [];
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
  }

  applyBurn(duration = 4.0) {
    this.isBurning = true;
    this.burnTimer = duration;
    this.burnTickTimer = 0.8;
  }

  breakShield(audio, camera, particles) {
    if (!this.shieldActive) return;
    this.shieldActive = false;
    this.shieldBrokenTimer = 5.5; // 5.5 segundos vulnerável a ataques de Espada e Cajado!
    if (audio && typeof audio.playShockwave === 'function') audio.playShockwave();
    if (audio && typeof audio.playBeamHit === 'function') audio.playBeamHit();
    if (camera && typeof camera.shake === 'function') camera.shake(16);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 45, { color: '#38bdf8', speed: 140, life: 1.2 });
    }
  }

  update(player, map, dt, audio, particles, camera, playerProjectiles, enemies) {
    this.timer += dt;
    this.animTime += dt * 3.5;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    if (!this.shieldActive) {
      this.shieldBrokenTimer -= dt;
      if (this.shieldBrokenTimer <= 0) {
        this.shieldActive = true;
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 25, { color: '#818cf8', speed: 90 });
        }
      }
    }

    // Processamento de Queimadura (Burn DoT)
    if (this.isBurning && this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.8;
        if (!this.shieldActive) {
          this.health -= 1;
          this.hitTimer = 0.15;
          if (audio && typeof audio.playBurnCrackle === 'function') audio.playBurnCrackle();
        }
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 6, { color: '#ea580c', speed: 50 });
        }
      }
      if (this.burnTimer <= 0) this.isBurning = false;
    }

    // Atualizar projéteis e ondas de choque do boss
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update(player, dt, audio, camera, particles);
      if (!this.projectiles[i].alive) this.projectiles.splice(i, 1);
    }
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].update(player, dt, audio, camera, particles);
      if (!this.shockwaves[i].alive) this.shockwaves.splice(i, 1);
    }

    switch (this.state) {
      case 'HOVER':
        this.x += Math.cos(this.animTime * 0.7) * 60 * dt;
        this.y += Math.sin(this.animTime * 0.4) * 45 * dt;

        if (this.timer > 1.1) {
          this.timer = 0;
          const r = Math.random();
          if (r < 0.4) this.state = 'AETHER_BURST';
          else if (r < 0.75) this.state = 'WARP_STRIKE';
          else this.state = 'COSMIC_WAVE';
        }
        break;

      case 'AETHER_BURST':
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (camera && typeof camera.shake === 'function') camera.shake(8);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + this.animTime;
          this.projectiles.push(new EnemyProjectile(this.x, this.y, Math.cos(a) * 175, Math.sin(a) * 175, 'LIGHTNING'));
        }
        this.state = 'HOVER';
        break;

      case 'WARP_STRIKE':
        if (camera && typeof camera.shake === 'function') camera.shake(10);
        // Teleporta para um quadrante da arena
        const angles = [0.25, 0.75, 1.25, 1.75];
        const ang = angles[Math.floor(Math.random() * angles.length)] * Math.PI;
        const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
        const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
        this.x = centerX + Math.cos(ang) * 150;
        this.y = centerY + Math.sin(ang) * 100;
        if (particles && typeof particles.emit === 'function') {
          particles.emit(this.x, this.y, 35, { color: '#818cf8', speed: 120 });
        }
        this.shockwaves.push(new Shockwave(this.x, this.y, '#38bdf8'));
        this.state = 'HOVER';
        break;

      case 'COSMIC_WAVE':
        if (audio && typeof audio.playBossRoar === 'function') audio.playBossRoar();
        if (camera && typeof camera.shake === 'function') camera.shake(12);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          this.projectiles.push(new EnemyProjectile(this.x, this.y, Math.cos(a) * 140, Math.sin(a) * 140, 'METEOR'));
        }
        this.state = 'HOVER';
        break;
    }

    // Dano corpo a corpo com a Espada
    if (player.isAttacking && player.attackHitbox && this.hitTimer <= 0) {
      if (this.intersects(player.attackHitbox)) {
        if (this.shieldActive) {
          if (audio && typeof audio.playHit === 'function') audio.playHit();
          if (camera && typeof camera.shake === 'function') camera.shake(3);
          if (particles && typeof particles.emit === 'function') {
            particles.emit(this.x, this.y, 8, { color: '#38bdf8', speed: 60 });
          }
        } else {
          const dmg = player.activeWeapon === 'SWORD' ? (player.swordLevel === 2 ? 3 : 2) : 1;
          this.takeDamage(dmg, audio, camera, particles);
          if (player.hasBurnPower) this.applyBurn(4.0);
        }
      }
    }

    // Dano por feitiço de cajado
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
      if (this.intersects(playerProjectiles[i])) {
        const p = playerProjectiles[i];
        p.alive = false;
        if (this.shieldActive) {
          if (audio && typeof audio.playHit === 'function') audio.playHit();
          if (particles && typeof particles.emit === 'function') {
            particles.emit(this.x, this.y, 6, { color: '#38bdf8', speed: 50 });
          }
        } else {
          this.takeDamage(p.damage, audio, camera, particles);
          if (p.hasBurn || player.hasBurnPower) this.applyBurn(4.0);
        }
      }
    }

    const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (hpText) hpText.textContent = `${Math.ceil(hpPct)}%`;
  }

  takeDamage(amount, audio, camera, particles) {
    this.health -= amount;
    this.hitTimer = 0.22;
    if (audio && typeof audio.playHit === 'function') audio.playHit();
    if (camera && typeof camera.shake === 'function') camera.shake(7);
    if (particles && typeof particles.emit === 'function') {
      particles.emit(this.x, this.y, 14, { color: '#818cf8', speed: 100 });
    }

    if (this.health <= 0) {
      this.alive = false;
      if (particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, 90, { color: '#facc15', speed: 180, life: 2.5 });
      }
    }
  }

  draw(ctx, camera) {
    this.shockwaves.forEach(sw => sw.draw(ctx, camera));
    this.projectiles.forEach(m => m.draw(ctx, camera));

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Escudo Dimensional Impenetrável
    if (this.shieldActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      const sRadius = 38 + Math.sin(this.animTime * 2) * 3;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + this.animTime * 0.4;
        const px = Math.cos(a) * sRadius;
        const py = Math.sin(a) * sRadius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.restore();
    }

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 32, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Asas Astrais de Éter
    const wingFlap = Math.sin(this.animTime * 3) * 10;
    ctx.fillStyle = '#4338ca';
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(-22, -10);
    ctx.lineTo(-52, -38 + wingFlap);
    ctx.lineTo(-26, 16);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(22, -10);
    ctx.lineTo(52, -38 + wingFlap);
    ctx.lineTo(26, 16);
    ctx.fill();

    // Corpo de Titã Dimensional
    ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : (this.shieldActive ? '#1e1b4b' : '#312e81');
    ctx.fillRect(-22, -24, 44, 48);

    // Olhos Estelares
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 12;
    ctx.fillRect(-12, -14, 8, 4);
    ctx.fillRect(4, -14, 8, 4);

    // Núcleo Cósmico do Peito
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 4, 9, 0, Math.PI * 2);
    ctx.fill();

    // Chamas ardentes se sob efeito de queimadura
    if (this.isBurning) {
      for (let i = 0; i < 7; i++) {
        const fa = (i / 7) * Math.PI * 2 + this.animTime * 3.5;
        const fx = Math.cos(fa) * 34;
        const fy = Math.sin(fa) * 28;
        ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#eab308';
        ctx.beginPath();
        ctx.arc(fx, fy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Alerta de Escudo Dimensional
    if (this.shieldActive) {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ ESCUDO IMPENETRÁVEL! Use [C]', sx, sy - 46);
      ctx.restore();
    } else {
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#f87171';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ VULNERÁVEL! (${this.shieldBrokenTimer.toFixed(1)}s)`, sx, sy - 46);
      ctx.restore();
    }
  }
}

// Portal de Transição entre Áreas (Suporta estado trancado com aviso)
class AreaPortal extends Entity {
  constructor(x, y, targetArea, label, isGolden = false, locked = false, lockReason = '') {
    super(x, y, 36, 36);
    this.targetArea = targetArea;
    this.label = label;
    this.animTime = 0;
    this.isGolden = isGolden;
    this.locked = locked;
    this.lockReason = lockReason;
  }

  update(dt) { this.animTime += dt * 3.5; }

  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    if (this.locked) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-11, -11);
      ctx.lineTo(11, 11);
      ctx.moveTo(11, -11);
      ctx.lineTo(-11, 11);
      ctx.stroke();

      ctx.restore();

      if (isNear) {
        ctx.save();
        ctx.fillStyle = '#fca5a5';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(`🔒 ${this.lockReason}`, sx, sy - 28);
        ctx.restore();
      }
      return;
    }

    ctx.rotate(this.animTime);

    ctx.fillStyle = this.isGolden ? 'rgba(250, 204, 21, 0.45)' : 'rgba(56, 189, 248, 0.4)';
    ctx.shadowColor = this.isGolden ? '#facc15' : '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isNear) {
      ctx.save();
      ctx.fillStyle = this.isGolden ? '#fef08a' : '#67e8f9';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[E] Entrar: ${this.label}`, sx, sy - 28);
      ctx.restore();
    }
  }
}

// Baú, Totem, Coruja, Sementes, Coração, Arbustos
class TreasureChest extends Entity {
  constructor(x, y) { super(x, y, 28, 24); this.opened = false; }
  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-14, -8, 28, 20);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-14, 0, 28, 4);
    ctx.fillRect(-4, -2, 8, 8);
    if (this.opened) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-14, -16, 28, 8);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-6, -6, 12, 6);
    }
    ctx.restore();
    if (isNear && !this.opened) {
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Abrir Baú', sx, sy - 20);
      ctx.restore();
    }
  }
}

class OwlNPC extends Entity {
  constructor(x, y) { super(x, y, 32, 32); this.animTime = 0; }
  update(player, dt) { this.animTime += dt * 3; return Math.hypot(player.x - this.x, player.y - this.y) < 48; }
  draw(ctx, camera, isNear) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-14, 6, 28, 14);
    const breathe = Math.sin(this.animTime) * 1.5;
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, -2 + breathe, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, 1 + breathe, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-4, -8 + breathe, 3.5, 0, Math.PI * 2);
    ctx.arc(4, -8 + breathe, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-4, -8 + breathe, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -8 + breathe, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(0, -6 + breathe);
    ctx.lineTo(-2, -3 + breathe);
    ctx.lineTo(2, -3 + breathe);
    ctx.fill();
    if (isNear) {
      ctx.fillStyle = '#4ade80';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Falar', 0, -28);
    }
    ctx.restore();
  }
}

class AncientTotem extends Entity {
  constructor(x, y) { super(x, y, 48, 56); this.activated = false; this.glowTime = 0; }
  update(player, dt) { this.glowTime += dt * 3; return Math.hypot(player.x - this.x, player.y - this.y) < 54; }
  draw(ctx, camera, isNear, seedsCount) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-24, 10, 48, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-14, -36, 28, 34);
    for (let i = 0; i < CONFIG.TOTAL_SEEDS_NEEDED; i++) {
      const isLit = i < seedsCount || this.activated;
      ctx.fillStyle = isLit ? '#4ade80' : '#475569';
      if (isLit) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10; }
      ctx.fillRect(-4, -30 + i * 6, 8, 3);
    }
    if (this.activated) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.beginPath();
      ctx.arc(0, -10, 42 + Math.sin(this.glowTime) * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (isNear && !this.activated) {
      ctx.fillStyle = seedsCount >= CONFIG.TOTAL_SEEDS_NEEDED ? '#fef08a' : '#94a3b8';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(seedsCount >= CONFIG.TOTAL_SEEDS_NEEDED ? '[E] Restaurar' : `${seedsCount}/${CONFIG.TOTAL_SEEDS_NEEDED} Sementes`, 0, -56);
    }
    ctx.restore();
  }
}

class SeedItem extends Entity {
  constructor(x, y) { super(x, y, 20, 20); this.floatTime = Math.random() * 5; }
  update(dt) { this.floatTime += dt * 4; }
  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y + Math.sin(this.floatTime) * 4;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#86efac';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class HeartItem extends Entity {
  constructor(x, y) { super(x, y, 16, 16); this.floatTime = Math.random() * 5; this.despawn = 18; }
  update(dt) { this.floatTime += dt * 4; this.despawn -= dt; if (this.despawn <= 0) this.alive = false; }
  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y + Math.sin(this.floatTime) * 3;
    ctx.save();
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤️', sx, sy);
    ctx.restore();
  }
}

class BreakableObject extends Entity {
  constructor(x, y, type = 'BUSH') { super(x, y, 24, 24); this.type = type; }
  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx, sy);
    if (this.type === 'CRYSTAL') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 8);
      ctx.lineTo(-8, 8);
      ctx.fill();
    } else if (this.type === 'MAGMA_ROCK') {
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-3, -3, 6, 6);
    } else {
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -4, 3, 3);
    }
    ctx.restore();
  }
}

// --- 7. GERENCIADOR DO MUNDO (7 BIOMAS) ---
class GameMap {
  constructor(areaType) {
    this.areaType = areaType;
    this.cols = CONFIG.MAP_COLS;
    this.rows = CONFIG.MAP_ROWS;
    this.tileSize = CONFIG.TILE_SIZE;
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;

    this.grid = new Array(this.rows).fill(0).map(() => new Array(this.cols).fill(0));
    this.decorations = [];
    this.generate();
  }

  generate() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (r <= 1 || r >= this.rows - 2 || c <= 1 || c >= this.cols - 2) {
          this.grid[r][c] = 1;
        }
      }
    }

    if (this.areaType === 'FOREST') {
      const midR = Math.floor(this.rows / 2);
      const midC = Math.floor(this.cols / 2);
      for (let c = 3; c < this.cols - 3; c++) { this.grid[midR][c] = 2; this.grid[midR + 1][c] = 2; }
      for (let r = 3; r < this.rows - 3; r++) { this.grid[r][midC] = 2; this.grid[r][midC + 1] = 2; }
      for (let r = 4; r < 14; r++) { this.grid[r][8] = 3; this.grid[r][9] = 3; }
    } else if (this.areaType === 'CAVE') {
      for (let i = 0; i < 22; i++) {
        const cr = Math.floor(Math.random() * (this.rows - 6)) + 3;
        const cc = Math.floor(Math.random() * (this.cols - 6)) + 3;
        this.grid[cr][cc] = 1;
      }
    } else if (this.areaType === 'SKY_ISLANDS') {
      // Plataformas nos céus
      for (let i = 0; i < 16; i++) {
        const cr = Math.floor(Math.random() * (this.rows - 6)) + 3;
        const cc = Math.floor(Math.random() * (this.cols - 6)) + 3;
        this.grid[cr][cc] = 1;
      }
    } else if (this.areaType === 'MAGMA_CORE') {
      // Lava nos cantos (Tile 3: Água/Lava)
      for (let r = 5; r < 20; r++) { this.grid[r][6] = 3; this.grid[r][28] = 3; }
    } else if (this.areaType === 'FROZEN_TUNDRA') {
      // Abismo Glacial dividindo o mapa leste/oeste (colunas 17 e 18)
      for (let r = 4; r < 23; r++) {
        if (r !== 7 && r !== 18) { // Deixa duas passagens limpas para o feixe passar
          this.grid[r][17] = 3;
          this.grid[r][18] = 3;
        }
      }
      // Pequenas estalagmites de gelo
      for (let i = 0; i < 10; i++) {
        const cr = Math.floor(Math.random() * (this.rows - 6)) + 3;
        const cc = Math.floor(Math.random() * (this.cols - 6)) + 3;
        if (cc !== 10 && cc !== 25 && cc !== 16) this.grid[cr][cc] = 1;
      }
    } else if (this.areaType === 'CHRONOS_TEMPLE') {
      // Fossos temporais (Tile 3) isolando as plataformas dos totens
      for (let c = 5; c <= 9; c++) { this.grid[8][c] = 3; }
      for (let c = 25; c <= 29; c++) { this.grid[8][c] = 3; }
      for (let c = 14; c <= 20; c++) { this.grid[20][c] = 3; }
    } else if (this.areaType === 'SHADOW_LABYRINTH') {
      // Paredes de obsidiana labirínticas
      for (let c = 6; c < 30; c += 4) {
        for (let r = 5; r < 22; r += 3) {
          if (r !== 14 && c !== 18) this.grid[r][c] = 1;
        }
      }
    } else if (this.areaType === 'GLACIAL_ARENA' || this.areaType === 'CHRONOS_NEXUS' || this.areaType === 'SHADOW_SANCTUM' || this.areaType === 'AETHER_CITADEL') {
      // Arenas de Chefes: colunas celestiais nas quatro extremidades da arena
      this.grid[6][6] = 1; this.grid[6][29] = 1;
      this.grid[21][6] = 1; this.grid[21][29] = 1;
    }

    // GARANTIR QUE A ÁREA CENTRAL DE SPAWN ESTEJA SEMPRE 100% LIVRE DE OBSTÁCULOS
    const midR = Math.floor(this.rows / 2);
    const midC = Math.floor(this.cols / 2);
    for (let r = midR - 2; r <= midR + 3; r++) {
      for (let c = midC - 2; c <= midC + 2; c++) {
        if (r >= 2 && r < this.rows - 2 && c >= 2 && c < this.cols - 2) {
          this.grid[r][c] = 0;
        }
      }
    }

    // Garantir que a área do portal (canto nordeste) esteja sempre acessível
    for (let r = 4; r <= 7; r++) {
      for (let c = 29; c <= 32; c++) {
        if (r >= 2 && r < this.rows - 2 && c >= 2 && c < this.cols - 2) {
          this.grid[r][c] = 0;
        }
      }
    }

    // Garantir desobstrução dos pontos de enigma (cristais, rosa dos ventos, caldeiras, prismas, totens e orbes)
    const puzzleSpots = [
      [8, 7], [26, 7], [12, 21],          // Cristais da Caverna
      [9, 8], [25, 8], [9, 20], [25, 20], // Caldeiras Térmicas
      [10, 7], [25, 7], [25, 18], [16, 18], // Prismas Glaciais & Runa de Niflheim
      [7, 6], [27, 6], [17, 22]           // Totens de Cronos
    ];
    for (let [col, row] of puzzleSpots) {
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r >= 2 && r < this.rows - 2 && c >= 2 && c < this.cols - 2) {
            this.grid[r][c] = 0;
          }
        }
      }
    }
  }

  checkCollision(bounds) {
    const startCol = Math.floor(bounds.left / this.tileSize);
    const endCol = Math.floor(bounds.right / this.tileSize);
    const startRow = Math.floor(bounds.top / this.tileSize);
    const endRow = Math.floor(bounds.bottom / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
        if (this.grid[r][c] === 1 || this.grid[r][c] === 3) return true;
      }
    }
    return false;
  }

  // Verifica colisão somente com paredes sólidas (Tile 1) e limites de mapa.
  // Permite que o Raio Astral de longo alcance atravesse abismos, fossos temporais e fendas de gelo (Tile 3)!
  checkWallOnlyCollision(bounds) {
    const startCol = Math.floor(bounds.left / this.tileSize);
    const endCol = Math.floor(bounds.right / this.tileSize);
    const startRow = Math.floor(bounds.top / this.tileSize);
    const endRow = Math.floor(bounds.bottom / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
        if (this.grid[r][c] === 1) return true;
      }
    }
    return false;
  }

  draw(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.grid[r][c];
        const sx = c * this.tileSize - camera.x;
        const sy = r * this.tileSize - camera.y;

        if (this.areaType === 'FOREST') {
          if (tile === 2) { ctx.fillStyle = '#64748b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else if (tile === 3) { ctx.fillStyle = '#0284c7'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else if (tile === 1) {
            ctx.fillStyle = '#14532d'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 16, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#15803d' : '#166534'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
          }
        } else if (this.areaType === 'CAVE') {
          if (tile === 1) { ctx.fillStyle = '#1e1b4b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else { ctx.fillStyle = (r + c) % 2 === 0 ? '#0f172a' : '#1e293b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
        } else if (this.areaType === 'SKY_ISLANDS' || this.areaType === 'SKY_THRONE') {
          if (tile === 1) { ctx.fillStyle = '#0284c7'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else { ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
        } else if (this.areaType === 'MAGMA_CORE') {
          if (tile === 3) { ctx.fillStyle = '#ea580c'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else if (tile === 1) { ctx.fillStyle = '#451a03'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else { ctx.fillStyle = (r + c) % 2 === 0 ? '#1c1917' : '#292524'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
        } else if (this.areaType === 'VOID_CORE') {
          if (tile === 1) { ctx.fillStyle = '#4c0519'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else { ctx.fillStyle = (r + c) % 2 === 0 ? '#09090b' : '#18181b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
        } else if (this.areaType === 'FROZEN_TUNDRA') {
          if (tile === 3) {
            ctx.fillStyle = '#0284c7'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(sx + 4, sy + 4, this.tileSize - 8, this.tileSize - 8);
          } else if (tile === 1) {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(sx + 8, sy + 8, 16, 16);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#e0f2fe' : '#bae6fd'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
          }
        } else if (this.areaType === 'CHRONOS_TEMPLE') {
          if (tile === 3) {
            ctx.fillStyle = '#451a03'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#78350f'; ctx.fillRect(sx + 6, sy + 6, this.tileSize - 12, this.tileSize - 12);
          } else if (tile === 1) {
            ctx.fillStyle = '#78350f'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#ca8a04'; ctx.fillRect(sx + 4, sy + 4, this.tileSize - 8, 4);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#ca8a04' : '#a16207'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
          }
        } else if (this.areaType === 'SHADOW_LABYRINTH') {
          if (tile === 1) {
            ctx.fillStyle = '#18181b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#581c87'; ctx.fillRect(sx + 6, sy + 6, this.tileSize - 12, this.tileSize - 12);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#09090b' : '#1e1b4b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
          }
        } else if (this.areaType === 'GLACIAL_ARENA') {
          if (tile === 1) {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(sx + 6, sy + 6, this.tileSize - 12, this.tileSize - 12);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#0369a1' : '#075985'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            if ((r * 5 + c * 11) % 9 === 0) {
              ctx.fillStyle = '#7dd3fc'; ctx.fillRect(sx + 12, sy + 12, 4, 4);
            }
          }
        } else if (this.areaType === 'CHRONOS_NEXUS') {
          if (tile === 1) {
            ctx.fillStyle = '#451a03'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#ca8a04'; ctx.fillRect(sx + 6, sy + 6, this.tileSize - 12, this.tileSize - 12);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#78350f' : '#92400e'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            if ((r * 3 + c * 7) % 8 === 0) {
              ctx.fillStyle = '#facc15'; ctx.fillRect(sx + 14, sy + 14, 3, 3);
            }
          }
        } else if (this.areaType === 'SHADOW_SANCTUM') {
          if (tile === 1) {
            ctx.fillStyle = '#18181b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#7e22ce'; ctx.fillRect(sx + 6, sy + 6, this.tileSize - 12, this.tileSize - 12);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#09090b' : '#1e1b4b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            if ((r * 7 + c * 13) % 9 === 0) {
              ctx.fillStyle = '#c084fc'; ctx.fillRect(sx + 12, sy + 12, 3, 3);
            }
          }
        } else if (this.areaType === 'AETHER_CITADEL') {
          if (tile === 1) {
            ctx.fillStyle = '#312e81'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            ctx.fillStyle = '#facc15'; ctx.fillRect(sx + 8, sy + 8, 16, 16);
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1e1b4b' : '#312e81'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize);
            // Pequenas estrelas astrais decorativas
            if ((r * 7 + c * 13) % 11 === 0) {
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(sx + 14, sy + 14, 3, 3);
            }
          }
        } else {
          // Sanctuary
          if (tile === 1) { ctx.fillStyle = '#78350f'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
          else { ctx.fillStyle = (r + c) % 2 === 0 ? '#27272a' : '#18181b'; ctx.fillRect(sx, sy, this.tileSize, this.tileSize); }
        }
      }
    }
  }
}

// --- 8. GERENCIADOR DO JOGO PRINCIPAL (GAME ENGINE) ---
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.audio = new AudioEngine();
    this.input = new InputManager();
    this.particles = new ParticleSystem();

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.currentArea = 'FOREST';
    this.camera = new Camera(this.canvas.width, this.canvas.height);

    this.player = new Player(18 * CONFIG.TILE_SIZE, 16 * CONFIG.TILE_SIZE);
    this.projectiles = [];
    this.playerShockwaves = [];

    this.map = null;
    this.owl = null;
    this.totem = null;
    this.boss = null;
    this.portal = null;
    this.chest = null;
    this.forgeAltar = null;
    this.pylons = [];
    this.harmonicCrystals = [];
    this.harmonicStep = 1;
    this.windCompasses = [];
    this.magmaValves = [];
    this.puzzleMonument = null;
    this.enemies = [];
    this.seeds = [];
    this.breakables = [];
    this.items = [];

    // Coleções da Expansão das Fases 8 a 11 e Checkpoints
    this.activeCheckpoint = null; // { name, x, y, area }
    this.astralBeams = [];
    this.checkpointMonuments = [];
    this.icePrisms = [];
    this.iceRune = null;
    this.chronosTotems = [];
    this.shadowOrbs = [];

    this.gameState = 'TITLE';
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;

    this.lastTime = performance.now();
    this.questStep = 1;

    this.setupUI();
    this.loadArea('FOREST');

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    if (this.camera) {
      this.camera.width = this.canvas.width;
      this.camera.height = this.canvas.height;
    }
  }

  registerCheckpoint(name, x, y, area) {
    this.activeCheckpoint = { name, x, y, area };
    const badge = document.getElementById('checkpoint-badge');
    const text = document.getElementById('checkpoint-text');
    if (badge && text) {
      badge.classList.remove('hidden');
      text.textContent = `Checkpoint: ${name}`;
    }
  }

  loadArea(areaType, spawnX = null, spawnY = null) {
    this.currentArea = areaType;
    this.map = new GameMap(areaType);
    this.projectiles = [];
    this.playerShockwaves = [];
    this.enemies = [];
    this.items = [];
    this.breakables = [];
    this.seeds = [];
    this.pylons = [];
    this.harmonicCrystals = [];
    this.harmonicStep = 1;
    this.windCompasses = [];
    this.magmaValves = [];
    this.puzzleMonument = null;
    this.owl = null;
    this.totem = null;
    this.boss = null;
    this.portal = null;
    this.chest = null;
    this.forgeAltar = null;

    // Reinicializar coleções das novas fases
    this.astralBeams = [];
    this.checkpointMonuments = [];
    this.icePrisms = [];
    this.iceRune = null;
    this.chronosTotems = [];
    this.shadowOrbs = [];

    const bossHud = document.getElementById('boss-hud');
    if (bossHud) bossHud.classList.add('hidden');

    const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
    const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;

    if (spawnX && spawnY) {
      this.player.x = spawnX;
      this.player.y = spawnY;
    } else if (this.activeCheckpoint && this.activeCheckpoint.area === areaType) {
      this.player.x = this.activeCheckpoint.x;
      this.player.y = this.activeCheckpoint.y;
    } else {
      this.player.x = centerX;
      this.player.y = centerY + 48;
    }

    // Avançar de Fase: Restaura a saúde do Guardião plenamente ao adentrar nova região
    this.player.health = this.player.maxHealth;
    this.player.invulnerableTimer = 1.0;

    if (areaType === 'FOREST') {
      this.audio.startBGM('FOREST');
      this.showAreaBanner('BOSQUE DOS ECOS', 'Santuário da Seiva');
      document.getElementById('area-indicator').textContent = '📍 Bosque dos Ecos';

      this.owl = new OwlNPC(centerX, centerY - 48);
      this.totem = new AncientTotem(centerX, centerY);

      // Checkpoint do Bosque
      const cp = new CheckpointMonument(centerX, centerY + 80, 'Pedra dos Ecos');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Pedra dos Ecos') cp.activated = true;
      this.checkpointMonuments = [cp];

      if (this.questStep <= 2) {
        const seedCoords = [
          { x: 5 * CONFIG.TILE_SIZE, y: 5 * CONFIG.TILE_SIZE },
          { x: 30 * CONFIG.TILE_SIZE, y: 5 * CONFIG.TILE_SIZE },
          { x: 5 * CONFIG.TILE_SIZE, y: 22 * CONFIG.TILE_SIZE },
          { x: 30 * CONFIG.TILE_SIZE, y: 22 * CONFIG.TILE_SIZE },
          { x: 18 * CONFIG.TILE_SIZE, y: 8 * CONFIG.TILE_SIZE },
        ];
        this.seeds = seedCoords.map(pos => new SeedItem(pos.x, pos.y));
      }

      this.enemies = [
        new EnemyCreature(7 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'FOREST'),
        new EnemyCreature(28 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'FOREST'),
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 20 * CONFIG.TILE_SIZE, 'FOREST'),
      ];

      for (let i = 0; i < 10; i++) {
        const bx = (Math.floor(Math.random() * (CONFIG.MAP_COLS - 6)) + 3) * CONFIG.TILE_SIZE;
        const by = (Math.floor(Math.random() * (CONFIG.MAP_ROWS - 6)) + 3) * CONFIG.TILE_SIZE;
        this.breakables.push(new BreakableObject(bx, by, 'BUSH'));
      }

      if (this.questStep >= 3) {
        this.portal = new AreaPortal(31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE, 'CAVE', 'Caverna');
      }

    } else if (areaType === 'CAVE') {
      this.audio.startBGM('CAVE');
      this.showAreaBanner('CAVERNA DOS CRISTAIS', 'Profundezas Luminescentes');
      document.getElementById('area-indicator').textContent = '📍 Caverna dos Cristais';

      this.chest = new TreasureChest(centerX, centerY);
      if (this.player.hasAuroraGem) this.chest.opened = true;

      // Checkpoint da Caverna
      const cpCave = new CheckpointMonument(8 * CONFIG.TILE_SIZE, 14 * CONFIG.TILE_SIZE, 'Monólito da Caverna');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Monólito da Caverna') cpCave.activated = true;
      this.checkpointMonuments = [cpCave];

      // Monólito decifrável com a pista poética dos cristais harmônicos
      this.puzzleMonument = new PuzzleTabletMonument(
        centerX - 84, centerY - 52,
        'Tabuleta da Canção Rúnica',
        'A canção das pedras abrirá o Santuário: Primeiro desperta o Azul dos Mares (Safira), em seguida eleva-se o Ouro do Sol (Topázio), e por fim ressoa o Púrpura do Crepúsculo (Ametista). Se a harmonia for quebrada, o acorde se desfaz!'
      );

      // 3 Cristais Harmônicos Sequenciais Musicais (Dó, Mi, Sol)
      this.harmonicCrystals = [
        new HarmonicCrystal(8 * CONFIG.TILE_SIZE, 7 * CONFIG.TILE_SIZE, 'SAPPHIRE', 'Safira do Oceano', '#38bdf8', 261.63, 1),
        new HarmonicCrystal(26 * CONFIG.TILE_SIZE, 7 * CONFIG.TILE_SIZE, 'TOPAZ', 'Topázio do Sol', '#facc15', 329.63, 2),
        new HarmonicCrystal(12 * CONFIG.TILE_SIZE, 21 * CONFIG.TILE_SIZE, 'AMETHYST', 'Ametista do Crepúsculo', '#c084fc', 392.00, 3)
      ];

      this.enemies = [
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'CAVE'),
        new EnemyCreature(26 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'CAVE'),
        new EnemyCreature(18 * CONFIG.TILE_SIZE, 22 * CONFIG.TILE_SIZE, 'CAVE'),
      ];

      for (let i = 0; i < 8; i++) {
        const bx = (Math.floor(Math.random() * (CONFIG.MAP_COLS - 6)) + 3) * CONFIG.TILE_SIZE;
        const by = (Math.floor(Math.random() * (CONFIG.MAP_ROWS - 6)) + 3) * CONFIG.TILE_SIZE;
        this.breakables.push(new BreakableObject(bx, by, 'CRYSTAL'));
      }

      const caveUnlocked = Boolean(this.player.hasAuroraGem && this.harmonicCrystals.length > 0 && this.harmonicCrystals.every(c => c.activated));
      this.portal = new AreaPortal(
        31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE,
        'SANCTUARY', 'Santuário', false,
        !caveUnlocked, 'Abra o Baú e ressoe a Melodia Sagrada dos Cristais'
      );

    } else if (areaType === 'SANCTUARY') {
      this.audio.startBGM('BOSS');
      this.showAreaBanner('SANTUÁRIO ANCESTRAL', 'Arena do 1º Chefe: Malakar');
      document.getElementById('area-indicator').textContent = '📍 Santuário da Árvore Mãe';

      const cpSanc = new CheckpointMonument(centerX, centerY + 80, 'Santuário da Seiva');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Santuário da Seiva') cpSanc.activated = true;
      this.checkpointMonuments = [cpSanc];

      if (this.questStep >= 4) {
        this.portal = new AreaPortal(centerX, centerY - 40, 'SKY_ISLANDS', 'Palácio dos Ventos', true);
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'MALAKAR, O COLOSSO SOMBRIO';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossMalakar(centerX, centerY - 40);
        // Ajudantes do Chefe Malakar
        this.enemies = [
          new EnemyCreature(centerX - 90, centerY + 30, 'FOREST'),
          new EnemyCreature(centerX + 90, centerY + 30, 'FOREST')
        ];
      }

    } else if (areaType === 'SKY_ISLANDS') {
      // FASE PRÉ-BOSS 2: PALÁCIO DOS VENTOS!
      this.audio.startBGM('SKY');
      this.showAreaBanner('PALÁCIO DOS VENTOS', 'Ilhas Flutuantes Celestes');
      document.getElementById('area-indicator').textContent = '📍 Palácio dos Ventos';

      // Checkpoint das Ilhas dos Ventos
      const cpSky = new CheckpointMonument(centerX, centerY + 80, 'Torre dos Ventos');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Torre dos Ventos') cpSky.activated = true;
      this.checkpointMonuments = [cpSky];

      // Estela da Rosa dos Ventos
      this.puzzleMonument = new PuzzleTabletMonument(
        centerX, centerY - 64,
        'Estela dos Quatro Ventos',
        'O Arconte dos Céus exige o domínio das correntes: Gire os 4 cataventos sagrados (Norte, Sul, Leste, Oeste) até que TODAS as setas apontem CONVERGINDO EXATAMENTE PARA O CENTRO DO TEMPLO! Apenas a convergência desperta o portal.'
      );

      // 4 Cataventos da Rosa dos Ventos ao redor do templo
      this.windCompasses = [
        new WindCompassTotem(centerX, centerY - 150, 'NORTH', 2, 'Catavento Boreal (Norte)'),
        new WindCompassTotem(centerX, centerY + 140, 'SOUTH', 0, 'Catavento Austral (Sul)'),
        new WindCompassTotem(centerX - 150, centerY, 'WEST', 1, 'Catavento Ocidental (Oeste)'),
        new WindCompassTotem(centerX + 150, centerY, 'EAST', 3, 'Catavento Oriental (Leste)')
      ];

      this.enemies = [
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'SKY'),
        new EnemyCreature(26 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'SKY'),
        new EnemyCreature(18 * CONFIG.TILE_SIZE, 22 * CONFIG.TILE_SIZE, 'SKY'),
      ];

      const skyUnlocked = Boolean(this.windCompasses.length > 0 && this.windCompasses.every(w => w.isAligned()));
      this.portal = new AreaPortal(
        31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE,
        'SKY_THRONE', 'Trono do Trovão', true,
        !skyUnlocked, 'Faça convergir as 4 brisas da Rosa dos Ventos ao centro'
      );

    } else if (areaType === 'SKY_THRONE') {
      // ARENA DO 2º BOSS (VALDOR)!
      this.audio.startBGM('BOSS');
      this.showAreaBanner('TRONO DO TROVÃO', 'Arena do 2º Chefe: Valdor');
      document.getElementById('area-indicator').textContent = '📍 Trono do Trovão';

      const cpThrone = new CheckpointMonument(centerX, centerY + 80, 'Trono Celestial');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Trono Celestial') cpThrone.activated = true;
      this.checkpointMonuments = [cpThrone];

      if (this.questStep >= 5) {
        this.portal = new AreaPortal(centerX, centerY - 40, 'MAGMA_CORE', 'Abismo de Magma', true);
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'VALDOR, O ARCONTE DO TROVÃO';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossValdor(centerX, centerY - 40);
        // Ajudantes do Chefe Valdor
        this.enemies = [
          new EnemyCreature(centerX - 100, centerY + 40, 'SKY'),
          new EnemyCreature(centerX + 100, centerY + 40, 'SKY')
        ];
      }

    } else if (areaType === 'MAGMA_CORE') {
      // FASE PRÉ-BOSS 3: O ABISMO DA FORJA!
      this.audio.startBGM('MAGMA');
      this.showAreaBanner('ABISMO DA FORJA', 'Cavernas de Fogo e Magma');
      document.getElementById('area-indicator').textContent = '📍 Abismo de Magma';

      this.forgeAltar = new ForgeAltar(centerX, centerY);

      // Checkpoint do Abismo
      const cpMagma = new CheckpointMonument(centerX, centerY + 80, 'Fornalha dos Ancestrais');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Fornalha dos Ancestrais') cpMagma.activated = true;
      this.checkpointMonuments = [cpMagma];

      // Monólito das Caldeiras
      this.puzzleMonument = new PuzzleTabletMonument(
        centerX - 84, centerY - 54,
        'Tabuleta da Pressão Rúnica',
        'O Altar dos Titãs necessita de equilíbrio térmico absoluto: Regule as 4 caldeiras para somar EXATAMENTE 10 ºC no cadinho (+4 Enxofre, +6 Brasas, +7 Magma, -3 Obsidiana). Nem mais, nem menos!'
      );

      // 4 Caldeiras Térmicas com valores combinatórios (+4, +6, +7, -3)
      this.magmaValves = [
        new ThermalPressureValve(9 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'Caldeira de Enxofre', 4),
        new ThermalPressureValve(25 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'Fornalha de Brasas', 6),
        new ThermalPressureValve(9 * CONFIG.TILE_SIZE, 20 * CONFIG.TILE_SIZE, 'Cadinho de Magma', 7),
        new ThermalPressureValve(25 * CONFIG.TILE_SIZE, 20 * CONFIG.TILE_SIZE, 'Resfriador de Obsidiana', -3)
      ];

      this.enemies = [
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'MAGMA'),
        new EnemyCreature(26 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'MAGMA'),
      ];

      for (let i = 0; i < 8; i++) {
        const bx = (Math.floor(Math.random() * (CONFIG.MAP_COLS - 6)) + 3) * CONFIG.TILE_SIZE;
        const by = (Math.floor(Math.random() * (CONFIG.MAP_ROWS - 6)) + 3) * CONFIG.TILE_SIZE;
        this.breakables.push(new BreakableObject(bx, by, 'MAGMA_ROCK'));
      }

      const currentHeat = this.magmaValves.reduce((acc, v) => acc + (v.isOpen ? v.heatValue : 0), 0);
      const magmaUnlocked = Boolean(this.player.swordLevel >= 2 && currentHeat === 10);
      this.portal = new AreaPortal(
        31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE,
        'VOID_CORE', 'Núcleo do Eclipse', true,
        !magmaUnlocked, 'Ajuste as 4 caldeiras para 10 ºC e forje a Espada Estelar'
      );

    } else if (areaType === 'VOID_CORE') {
      // ARENA DO 3º CHEFE SUPREMO: KHARON!
      this.audio.startBGM('VOID');
      this.showAreaBanner('NÚCLEO DO ECLIPSE', 'Confronto Supremo: Kharon');
      document.getElementById('area-indicator').textContent = '📍 Núcleo do Eclipse';

      const cpVoid = new CheckpointMonument(centerX, centerY + 80, 'Altar do Vazio');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Altar do Vazio') cpVoid.activated = true;
      this.checkpointMonuments = [cpVoid];

      if (this.questStep >= 7) {
        this.portal = new AreaPortal(centerX, centerY - 40, 'FROZEN_TUNDRA', 'Geleira de Niflheim', true);
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'KHARON, O SOBERANO DO ECLIPSE';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossKharon(centerX, centerY - 40);
        this.enemies = [
          new EnemyCreature(centerX - 110, centerY - 20, 'VOID'),
          new EnemyCreature(centerX + 110, centerY - 20, 'VOID'),
          new EnemyCreature(centerX, centerY + 120, 'VOID')
        ];
      }

    } else if (areaType === 'FROZEN_TUNDRA') {
      // FASE 8: GELEIRA ANCESTRAL DE NIFLHEIM (ENIGMA DE REFRAÇÃO DE PRISMAS)
      this.audio.startBGM('FROZEN');
      this.showAreaBanner('GELEIRA DE NIFLHEIM', 'Enigma Glacial dos Três Prismas');
      document.getElementById('area-indicator').textContent = '📍 Geleira de Niflheim';

      // Checkpoint da Tundra
      const cpFrost = new CheckpointMonument(8 * CONFIG.TILE_SIZE, 14 * CONFIG.TILE_SIZE, 'Monólito Glacial');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Monólito Glacial') cpFrost.activated = true;
      this.checkpointMonuments = [cpFrost];

      // Tabuleta de Pistas Rúnicas
      this.puzzleMonument = new PuzzleTabletMonument(
        centerX - 84, centerY - 60,
        'Tabuleta da Refração Glacial',
        'A Runa do Portal repousa além da fenda de gelo intransponível! Posicione-se ao sul do Prisma Alfa e dispare o Raio Astral [C] para o norte. Ajuste a rotação dos 3 Prismas Glaciais [E] para guiar o feixe sucessivamente em 90 graus até a Runa no leste!'
      );

      // 3 Prismas Glaciais
      this.icePrisms = [
        new IcePrismMirror(10 * CONFIG.TILE_SIZE, 7 * CONFIG.TILE_SIZE, 1, 'Prisma Glacial Alfa (Oeste)'),
        new IcePrismMirror(25 * CONFIG.TILE_SIZE, 7 * CONFIG.TILE_SIZE, 0, 'Prisma Glacial Beta (Nordeste)'),
        new IcePrismMirror(25 * CONFIG.TILE_SIZE, 18 * CONFIG.TILE_SIZE, 1, 'Prisma Glacial Gama (Sudeste)')
      ];

      // Runa Cristalina Alvo
      this.iceRune = new IcePortalCrystalRune(16 * CONFIG.TILE_SIZE, 18 * CONFIG.TILE_SIZE);

      this.enemies = [
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'FROZEN'),
        new EnemyCreature(26 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'FROZEN'),
        new EnemyCreature(12 * CONFIG.TILE_SIZE, 20 * CONFIG.TILE_SIZE, 'FROZEN')
      ];

      const frozenUnlocked = Boolean(this.iceRune && this.iceRune.activated);
      this.portal = new AreaPortal(
        31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE,
        'GLACIAL_ARENA', 'Arena Glacial', true,
        !frozenUnlocked, 'Guie o Raio Astral através dos 3 prismas até a Runa'
      );

    } else if (areaType === 'GLACIAL_ARENA') {
      // FASE 9: ARENA GLACIAL (4º CHEFE: TRINIT, A TRÍADE GLACIAL)
      this.audio.startBGM('BOSS');
      this.showAreaBanner('ARENA GLACIAL', '4º Chefe: Trinit, a Tríade Glacial');
      document.getElementById('area-indicator').textContent = '❄️ Arena Glacial';

      const cpTrinit = new CheckpointMonument(centerX, centerY + 110, 'Santuário da Tríade Glacial');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Santuário da Tríade Glacial') cpTrinit.activated = true;
      this.checkpointMonuments = [cpTrinit];

      if (this.questStep >= 8) {
        this.portal = new AreaPortal(centerX, centerY - 40, 'CHRONOS_TEMPLE', 'Templo de Cronos', true);
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'TRINIT, A TRÍADE GLACIAL';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossTrinit(centerX, centerY - 40);
        this.enemies = [
          new EnemyCreature(centerX - 100, centerY + 20, 'FROZEN'),
          new EnemyCreature(centerX + 100, centerY + 20, 'FROZEN')
        ];
      }

    } else if (areaType === 'CHRONOS_TEMPLE') {
      // FASE 10: TEMPLO DE CRONOS (SINCRONIA TEMPORAL DE LONGA DISTÂNCIA)
      this.audio.startBGM('CHRONOS');
      this.showAreaBanner('TEMPLO DE CRONOS', 'Sincronia das Areias Temporais');
      document.getElementById('area-indicator').textContent = '📍 Templo de Cronos';

      // Checkpoint de Cronos
      const cpChr = new CheckpointMonument(centerX, centerY + 80, 'Relicário de Cronos');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Relicário de Cronos') cpChr.activated = true;
      this.checkpointMonuments = [cpChr];

      // Tabuleta de Pistas
      this.puzzleMonument = new PuzzleTabletMonument(
        centerX, centerY - 64,
        'Estela da Sincronia Temporal',
        'O tempo é uno e trino: Passado, Presente e Futuro! Dispare o Raio Astral [C] para ativar os 3 Totens distantes sobre os fossos. Cada totem permanece ressoando por apenas 6 segundos. Você deve manter os 3 totens acesos SIMULTANEAMENTE para dissolver a barreira temporal!'
      );

      // 3 Totens Temporais de Cronos isolados sobre fossos
      this.chronosTotems = [
        new ChronosTotem(7 * CONFIG.TILE_SIZE, 6 * CONFIG.TILE_SIZE, 0, 'Passado'),
        new ChronosTotem(27 * CONFIG.TILE_SIZE, 6 * CONFIG.TILE_SIZE, 1, 'Presente'),
        new ChronosTotem(17 * CONFIG.TILE_SIZE, 22 * CONFIG.TILE_SIZE, 2, 'Futuro')
      ];

      this.enemies = [
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 10 * CONFIG.TILE_SIZE, 'CHRONOS'),
        new EnemyCreature(26 * CONFIG.TILE_SIZE, 10 * CONFIG.TILE_SIZE, 'CHRONOS'),
        new EnemyCreature(17 * CONFIG.TILE_SIZE, 12 * CONFIG.TILE_SIZE, 'CHRONOS')
      ];

      const chronosUnlocked = Boolean(this.chronosTotems.length === 3 && this.chronosTotems.every(t => t.activeTimer > 0));
      this.portal = new AreaPortal(
        31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE,
        'CHRONOS_NEXUS', 'Nexus de Cronos', true,
        !chronosUnlocked, 'Ative os 3 Totens de Cronos simultaneamente com o Raio Astral'
      );

    } else if (areaType === 'CHRONOS_NEXUS') {
      // FASE 11: NEXUS DE CRONOS (5º CHEFE: MIRAGE, O SENHOR DOS REFLEXOS ILUSÓRIOS)
      this.audio.startBGM('BOSS');
      this.showAreaBanner('NEXUS TEMPORAL', '5º Chefe: Mirage, o Senhor dos Reflexos');
      document.getElementById('area-indicator').textContent = '⏳ Nexus de Cronos';

      const cpMirage = new CheckpointMonument(centerX, centerY + 110, 'Relicário do Nexus Temporal');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Relicário do Nexus Temporal') cpMirage.activated = true;
      this.checkpointMonuments = [cpMirage];

      if (this.questStep >= 9) {
        this.portal = new AreaPortal(centerX, centerY - 40, 'SHADOW_LABYRINTH', 'Labirinto das Sombras', true);
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'MIRAGE, O SENHOR DOS REFLEXOS';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossMirage(centerX, centerY - 40);
        this.enemies = [
          new EnemyCreature(centerX - 110, centerY - 20, 'CHRONOS'),
          new EnemyCreature(centerX + 110, centerY - 20, 'CHRONOS')
        ];
      }

    } else if (areaType === 'SHADOW_LABYRINTH') {
      // FASE 12: LABIRINTO DAS SOMBRAS (MATRIZ BOOLEANA DE ORBES ESPECTRAIS)
      this.audio.startBGM('SHADOW');
      this.showAreaBanner('LABIRINTO DAS SOMBRAS', 'Matriz Espectral do Abismo');
      document.getElementById('area-indicator').textContent = '📍 Labirinto das Sombras';

      // Checkpoint do Labirinto
      const cpShd = new CheckpointMonument(8 * CONFIG.TILE_SIZE, 14 * CONFIG.TILE_SIZE, 'Lanterna do Vazio');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Lanterna do Vazio') cpShd.activated = true;
      this.checkpointMonuments = [cpShd];

      // Tabuleta de Pistas
      this.puzzleMonument = new PuzzleTabletMonument(
        centerX - 84, centerY - 60,
        'Tabuleta da Inversão Espectral',
        'Quatro orbes governam o labirinto. Ao tocar [E] ou atingir um orbe com o Raio Astral [C], sua energia e a dos orbes vizinhos conectados se invertem! Harmonize a rede para que TODOS OS 4 ORBES permaneçam ACESOS simultaneamente!'
      );

      // 4 Orbes Lógicos Interligados
      const o0 = new ShadowLogicOrb(centerX, centerY - 95, 0, 'Orbe Norte (Alfa)', false);
      const o1 = new ShadowLogicOrb(centerX + 105, centerY, 1, 'Orbe Leste (Beta)', true);
      const o2 = new ShadowLogicOrb(centerX, centerY + 95, 2, 'Orbe Sul (Gama)', false);
      const o3 = new ShadowLogicOrb(centerX - 105, centerY, 3, 'Orbe Oeste (Delta)', true);
      o0.setNeighbors([1, 3]);
      o1.setNeighbors([0, 2]);
      o2.setNeighbors([1, 3]);
      o3.setNeighbors([0, 2]);
      this.shadowOrbs = [o0, o1, o2, o3];

      this.enemies = [
        new EnemyCreature(8 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'SHADOW'),
        new EnemyCreature(26 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE, 'SHADOW'),
        new EnemyCreature(18 * CONFIG.TILE_SIZE, 22 * CONFIG.TILE_SIZE, 'SHADOW')
      ];

      const shadowUnlocked = Boolean(this.shadowOrbs.length === 4 && this.shadowOrbs.every(o => o.isOn));
      this.portal = new AreaPortal(
        31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE,
        'SHADOW_SANCTUM', 'Santuário do Abismo', true,
        !shadowUnlocked, 'Acenda todos os 4 Orbes Espectrais na rede lógica'
      );

    } else if (areaType === 'SHADOW_SANCTUM') {
      // FASE 13: SANTUÁRIO DO ABISMO (6º CHEFE: NOCTURNUS, O SOBERANO DO ABISMO)
      this.audio.startBGM('BOSS');
      this.showAreaBanner('SANTUÁRIO DO ABISMO', '6º Chefe: Nocturnus, Soberano do Abismo');
      document.getElementById('area-indicator').textContent = '🌑 Santuário do Abismo';

      const cpNoct = new CheckpointMonument(centerX, centerY + 110, 'Altar do Abismo Umbral');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Altar do Abismo Umbral') cpNoct.activated = true;
      this.checkpointMonuments = [cpNoct];

      if (this.questStep >= 10) {
        this.portal = new AreaPortal(centerX, centerY - 40, 'AETHER_CITADEL', 'Cidadela do Éter', true);
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'NOCTURNUS, O SOBERANO DO ABISMO';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossNocturnus(centerX, centerY - 40);
        this.enemies = [
          new EnemyCreature(centerX - 110, centerY - 30, 'SHADOW'),
          new EnemyCreature(centerX + 110, centerY - 30, 'SHADOW')
        ];
      }

    } else if (areaType === 'AETHER_CITADEL') {
      // FASE 14: CIDADELA DO ÉTER (7º MEGA-CHEFE FINAL: AETHON, O ARQUITETO DAS DIMENSÕES)
      this.audio.startBGM('AETHER');
      this.showAreaBanner('CIDADELA DO ÉTER', 'O Confronto Final Supremo: Aethon');
      document.getElementById('area-indicator').textContent = '📍 Cidadela do Éter';

      // Checkpoint da Cidadela
      const cpAeth = new CheckpointMonument(centerX, centerY + 115, 'Altar do Éter Primordial');
      if (this.activeCheckpoint && this.activeCheckpoint.name === 'Altar do Éter Primordial') cpAeth.activated = true;
      this.checkpointMonuments = [cpAeth];

      if (this.questStep >= 11) {
        // Já vencido
      } else {
        if (bossHud) {
          document.getElementById('boss-name').textContent = 'AETHON, O ARQUITETO DAS DIMENSÕES';
          bossHud.classList.remove('hidden');
        }
        this.boss = new BossAethon(centerX, centerY - 40);
        this.enemies = [
          new EnemyCreature(centerX - 110, centerY, 'AETHER'),
          new EnemyCreature(centerX + 110, centerY, 'AETHER')
        ];
      }
    }

    this.updateHUD();
  }

  showAreaBanner(title, sub) {
    const banner = document.getElementById('area-banner');
    document.getElementById('area-banner-title').textContent = title;
    document.getElementById('area-banner-sub').textContent = sub;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2600);
  }

  checkBossPortalUnlock() {
    if (!this.portal) return;

    if (this.currentArea === 'CAVE') {
      const allHarmonized = this.harmonicCrystals.length > 0 && this.harmonicCrystals.every(c => c.activated);
      if (this.player.hasAuroraGem && allHarmonized && this.portal.locked) {
        this.portal.locked = false;
        // Dificuldade Aumentada: Cura Plena de Saúde sem concessão de vida extra
        this.player.health = this.player.maxHealth;
        this.audio.playVictory();
        this.camera.shake(12);
        this.particles.emit(this.portal.x, this.portal.y, 45, { color: '#38bdf8', speed: 120 });
        this.showNotification('MISTÉRIO RESOLVIDO!', 'CURA TOTAL RESTAURADA! A Harmonia Sagrada abriu o Santuário!');
        this.updateHUD();
      }
    } else if (this.currentArea === 'SKY_ISLANDS') {
      const allAligned = this.windCompasses.length > 0 && this.windCompasses.every(w => w.isAligned());
      if (allAligned && this.portal.locked) {
        this.portal.locked = false;
        this.player.health = this.player.maxHealth;
        this.audio.playVictory();
        this.camera.shake(14);
        this.particles.emit(this.portal.x, this.portal.y, 45, { color: '#facc15', speed: 120 });
        this.showNotification('MISTÉRIO CONVERGENTE!', 'CURA TOTAL RESTAURADA! Os 4 ventos revelaram o Trono de Valdor!');
        this.updateHUD();
      }
    } else if (this.currentArea === 'MAGMA_CORE') {
      const currentHeat = this.magmaValves.reduce((acc, v) => acc + (v.isOpen ? v.heatValue : 0), 0);
      const tempReady = currentHeat === 10;
      const swordForged = this.player.swordLevel >= 2;
      if (tempReady && swordForged && this.portal.locked) {
        this.portal.locked = false;
        this.player.health = this.player.maxHealth;
        this.audio.playVictory();
        this.camera.shake(16);
        this.particles.emit(this.portal.x, this.portal.y, 50, { color: '#f97316', speed: 130 });
        this.showNotification('MISTÉRIO DA FORJA!', 'CURA TOTAL RESTAURADA! O calor rúnico abriu o Núcleo do Eclipse!');
        this.updateHUD();
      }
    } else if (this.currentArea === 'FROZEN_TUNDRA') {
      const runeActive = this.iceRune && this.iceRune.activated;
      if (runeActive && this.portal.locked) {
        this.portal.locked = false;
        this.player.health = this.player.maxHealth;
        this.audio.playVictory();
        this.camera.shake(14);
        this.particles.emit(this.portal.x, this.portal.y, 45, { color: '#38bdf8', speed: 120 });
        this.showNotification('REFRAÇÃO PERFEITA!', 'CURA TOTAL RESTAURADA! A Runa Glacial abriu a Arena de Trinit!');
        this.updateHUD();
      }
    } else if (this.currentArea === 'CHRONOS_TEMPLE') {
      const allChronos = this.chronosTotems.length === 3 && this.chronosTotems.every(t => t.activeTimer > 0);
      if (allChronos && this.portal.locked) {
        this.portal.locked = false;
        this.player.health = this.player.maxHealth;
        this.audio.playVictory();
        this.camera.shake(14);
        this.particles.emit(this.portal.x, this.portal.y, 45, { color: '#facc15', speed: 120 });
        this.showNotification('SINCRONIA TEMPORAL!', 'CURA TOTAL RESTAURADA! O Templo abriu o Nexus de Mirage!');
        this.updateHUD();
      }
    } else if (this.currentArea === 'SHADOW_LABYRINTH') {
      const allOrbsOn = this.shadowOrbs.length === 4 && this.shadowOrbs.every(o => o.isOn);
      if (allOrbsOn && this.portal.locked) {
        this.portal.locked = false;
        this.player.health = this.player.maxHealth;
        this.audio.playVictory();
        this.camera.shake(16);
        this.particles.emit(this.portal.x, this.portal.y, 50, { color: '#22d3ee', speed: 130 });
        this.showNotification('MATRIZ ESPECTRAL!', 'CURA TOTAL RESTAURADA! O Labirinto abriu o Santuário de Nocturnus!');
        this.updateHUD();
      }
    }
  }

  setupUI() {
    document.getElementById('start-btn').addEventListener('click', () => {
      this.audio.init();
      this.audio.startBGM('FOREST');
      document.getElementById('title-screen').classList.add('hidden');
      this.gameState = 'PLAYING';
      this.triggerDialogue('Sylva', '🦉', [
        'Kaelen, a floresta precisa de você!',
        'Restaure o Totem do Bosque para dar início à sua jornada.',
        'Use [Shift] para CORRER rapidamente e [Q] para a esquiva rápida (Dash)!',
        'Derrote os chefes antigos e forje sua lâmina!',
      ]);
    });

    const audioBtn = document.getElementById('audio-toggle-btn');
    audioBtn.addEventListener('click', () => {
      this.audio.init();
      const unmuted = this.audio.toggleMute();
      audioBtn.textContent = unmuted ? '🔊' : '🔇';
    });

    document.getElementById('weapon-swap-btn').addEventListener('click', () => {
      this.player.swapWeapon(this.audio, this.particles);
      this.updateHUD();
    });

    document.getElementById('respawn-btn').addEventListener('click', () => {
      this.respawnPlayer();
    });

    document.getElementById('next-level-btn').addEventListener('click', () => {
      this.resetNewGamePlus();
    });

    const closePowerBtn = document.getElementById('close-power-banner-btn');
    if (closePowerBtn) {
      closePowerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('power-unlock-banner').classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const powerBanner = document.getElementById('power-unlock-banner');
    if (powerBanner) {
      powerBanner.addEventListener('click', () => {
        powerBanner.classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const closeSwordBtn = document.getElementById('close-sword-banner-btn');
    if (closeSwordBtn) {
      closeSwordBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('sword-unlock-banner').classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const swordBanner = document.getElementById('sword-unlock-banner');
    if (swordBanner) {
      swordBanner.addEventListener('click', () => {
        swordBanner.classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const closeBurnBtn = document.getElementById('close-burn-banner-btn');
    if (closeBurnBtn) {
      closeBurnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('burn-unlock-banner').classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const burnBanner = document.getElementById('burn-unlock-banner');
    if (burnBanner) {
      burnBanner.addEventListener('click', () => {
        burnBanner.classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const closeBeamBtn = document.getElementById('close-beam-banner-btn');
    if (closeBeamBtn) {
      closeBeamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('beam-unlock-banner').classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }

    const beamBanner = document.getElementById('beam-unlock-banner');
    if (beamBanner) {
      beamBanner.addEventListener('click', () => {
        beamBanner.classList.add('hidden');
        this.gameState = 'PLAYING';
      });
    }
  }

  triggerDialogue(name, avatar, lines) {
    this.dialogueQueue = lines;
    this.currentDialogue = { name, avatar, line: this.dialogueQueue.shift() };
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;
    this.gameState = 'DIALOGUE';

    const box = document.getElementById('dialogue-box');
    document.getElementById('dialogue-name').textContent = name;
    document.getElementById('dialogue-avatar').textContent = avatar;
    document.getElementById('dialogue-text').textContent = '';
    box.classList.remove('hidden');
  }

  updateDialogue(dt) {
    if (!this.currentDialogue) {
      // Se não há diálogo comum mas algum banner de chefe está visível, fecha com qualquer tecla de ação
      const powerBanner = document.getElementById('power-unlock-banner');
      const swordBanner = document.getElementById('sword-unlock-banner');
      const burnBanner = document.getElementById('burn-unlock-banner');
      const beamBanner = document.getElementById('beam-unlock-banner');
      const pOpen = powerBanner && !powerBanner.classList.contains('hidden');
      const sOpen = swordBanner && !swordBanner.classList.contains('hidden');
      const bOpen = burnBanner && !burnBanner.classList.contains('hidden');
      const bmOpen = beamBanner && !beamBanner.classList.contains('hidden');

      if (pOpen || sOpen || bOpen || bmOpen) {
        if (this.input.consumeAttack() || this.input.consumeInteract() || this.input.consumeSpecial() || this.input.consumeDash() || this.input.consumeBeam()) {
          if (pOpen) powerBanner.classList.add('hidden');
          if (sOpen) swordBanner.classList.add('hidden');
          if (bOpen) burnBanner.classList.add('hidden');
          if (bmOpen) beamBanner.classList.add('hidden');
          this.gameState = 'PLAYING';
        }
      } else {
        this.gameState = 'PLAYING';
      }
      return;
    }

    this.dialogueTimer += dt;
    if (this.dialogueTimer > 0.03 && this.dialogueCharIndex < this.currentDialogue.line.length) {
      this.dialogueCharIndex++;
      document.getElementById('dialogue-text').textContent = this.currentDialogue.line.substring(0, this.dialogueCharIndex);
      this.dialogueTimer = 0;
      this.audio.playDialogueBlip();
    }

    if (this.input.consumeAttack() || this.input.consumeInteract() || this.input.consumeSpecial() || this.input.consumeDash() || this.input.consumeBeam()) {
      if (this.dialogueCharIndex < this.currentDialogue.line.length) {
        this.dialogueCharIndex = this.currentDialogue.line.length;
        document.getElementById('dialogue-text').textContent = this.currentDialogue.line;
      } else if (this.dialogueQueue.length > 0) {
        this.currentDialogue.line = this.dialogueQueue.shift();
        this.dialogueCharIndex = 0;
        document.getElementById('dialogue-text').textContent = '';
      } else {
        this.gameState = 'PLAYING';
        document.getElementById('dialogue-box').classList.add('hidden');
        this.currentDialogue = null;
      }
    }
  }

  updateHUD() {
    // Sistema de Vidas do Guardião
    const livesContainer = document.getElementById('lives-icons');
    if (livesContainer) {
      livesContainer.innerHTML = '';
      for (let i = 0; i < this.player.maxLives; i++) {
        const icon = document.createElement('span');
        icon.className = `lives-icon ${i < this.player.lives ? '' : 'lost'}`;
        icon.textContent = '🛡️';
        livesContainer.appendChild(icon);
      }
    }

    const heartsContainer = document.getElementById('health-hearts');
    heartsContainer.innerHTML = '';
    for (let i = 0; i < this.player.maxHealth; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i < this.player.health ? '' : 'lost'}`;
      heart.textContent = '❤️';
      heartsContainer.appendChild(heart);
    }

    // Fôlego de Corrida (Shift)
    const staminaFill = document.getElementById('stamina-fill');
    staminaFill.style.width = `${(this.player.stamina / CONFIG.MAX_STAMINA) * 100}%`;

    // Recarga do Dash [Q]
    const dashFill = document.getElementById('dash-fill');
    const dPct = Math.max(0, 1 - (this.player.dashCooldownTimer / CONFIG.DASH_COOLDOWN));
    dashFill.style.width = `${dPct * 100}%`;

    // Super Poder Sísmico do 1º Boss [R]
    const specialHud = document.getElementById('special-skill-hud');
    const touchSpecial = document.getElementById('touch-special');
    if (this.player.hasColossusPower) {
      if (specialHud) specialHud.classList.remove('hidden');
      if (touchSpecial) touchSpecial.classList.remove('hidden');
      const specialFill = document.getElementById('special-fill');
      if (specialFill) {
        const sPct = Math.max(0, 1 - (this.player.specialCooldownTimer / this.player.specialCooldown));
        specialFill.style.width = `${sPct * 100}%`;
      }
    }

    // Super Poder de Longa Distância: Raio Astral [C] / [X]
    const beamHud = document.getElementById('beam-skill-hud');
    const touchBeam = document.getElementById('touch-beam');
    if (this.player.hasAstralBeam) {
      if (beamHud) beamHud.classList.remove('hidden');
      if (touchBeam) touchBeam.classList.remove('hidden');
      const beamFill = document.getElementById('beam-fill');
      if (beamFill) {
        const bPct = Math.max(0, 1 - (this.player.beamCooldownTimer / this.player.beamCooldown));
        beamFill.style.width = `${bPct * 100}%`;
      }
    }

    // Badge de Checkpoint Registrado
    const cpBadge = document.getElementById('checkpoint-badge');
    const cpText = document.getElementById('checkpoint-text');
    if (this.activeCheckpoint) {
      if (cpBadge) cpBadge.classList.remove('hidden');
      if (cpText) cpText.textContent = `Checkpoint: ${this.activeCheckpoint.name}`;
    } else {
      if (cpBadge) cpBadge.classList.add('hidden');
    }

    // Seletor de Armas
    const weaponHud = document.getElementById('weapon-hud');
    const touchSwap = document.getElementById('touch-weapon-swap');
    if (this.player.hasSword) {
      if (weaponHud) weaponHud.classList.remove('hidden');
      if (touchSwap) touchSwap.classList.remove('hidden');

      const wIcon = document.getElementById('weapon-icon');
      const wTitle = document.getElementById('weapon-title');
      const wSub = document.getElementById('weapon-sub');

      if (this.player.activeWeapon === 'SWORD') {
        wIcon.textContent = this.player.swordLevel === 2 ? '🔥' : '⚔️';
        wTitle.textContent = this.player.swordLevel === 2 ? 'Espada de Fogo' : 'Espada do Trovão';
        wSub.textContent = this.player.swordLevel === 2 ? 'Dano 3 + Fogo' : 'Dano 2 (Corpo a Corpo)';
      } else {
        wIcon.textContent = '🪄';
        wTitle.textContent = 'Cajado da Aurora';
        wSub.textContent = 'Magia à Distância';
      }
    }

    // Super Poder de Incineração Cósmica pós-Boss 3
    const burnHud = document.getElementById('burn-skill-hud');
    if (burnHud) {
      if (this.player.hasBurnPower) {
        burnHud.classList.remove('hidden');
      } else {
        burnHud.classList.add('hidden');
      }
    }

    document.getElementById('essence-counter').textContent = `${this.player.seedsCollected} / ${CONFIG.TOTAL_SEEDS_NEEDED}`;

    const questText = document.getElementById('quest-text');
    if (this.questStep === 1) {
      questText.textContent = 'Fale com Sylva e colete as 5 Sementes de Luz.';
    } else if (this.questStep === 2) {
      questText.textContent = `Ative o Totem com as 5 Sementes (${this.player.seedsCollected}/5).`;
    } else if (this.questStep === 3) {
      if (this.currentArea === 'CAVE') {
        const activeCrystals = this.harmonicCrystals.filter(c => c.activated).length;
        const gemStatus = this.player.hasAuroraGem ? '✅ Gema da Aurora' : '❌ Abra o Baú';
        questText.textContent = `Caverna: Harmonize os Cristais (${activeCrystals}/3) e ${gemStatus}.`;
      } else {
        questText.textContent = 'Enfrente Malakar, o Colosso Sombrio no Santuário!';
      }
    } else if (this.questStep === 4) {
      if (this.currentArea === 'SKY_ISLANDS') {
        const alignedCount = this.windCompasses.filter(w => w.isAligned()).length;
        questText.textContent = `Palácio dos Ventos: Converja as 4 brisas ao centro (${alignedCount}/4).`;
      } else {
        questText.textContent = 'Derrote Valdor, o Arconte do Trovão no Trono dos Céus!';
      }
    } else if (this.questStep === 5) {
      if (this.currentArea === 'MAGMA_CORE') {
        const heat = this.magmaValves.reduce((acc, v) => acc + (v.isOpen ? v.heatValue : 0), 0);
        const heatStatus = heat === 10 ? '🔥 Caldeiras em 10 ºC (Ideal)' : `⚠️ Pressão: ${heat} ºC (Alvo: 10 ºC)`;
        const swordStatus = this.player.swordLevel >= 2 ? '✅ Espada Forjada' : '❌ Forje no Altar';
        questText.textContent = `Abismo: ${heatStatus} | ${swordStatus}.`;
      } else {
        questText.textContent = 'Atravesse o Abismo de Magma e forje sua lâmina!';
      }
    } else if (this.questStep === 6) {
      questText.textContent = 'Derrote Kharon, o Soberano do Eclipse no confronto supremo!';
    } else if (this.questStep === 7) {
      if (this.currentArea === 'FROZEN_TUNDRA') {
        const runeActive = this.iceRune && this.iceRune.activated;
        questText.textContent = runeActive ? '✅ Runa Glacial Ativada! Siga para a Arena Glacial.' : 'Geleira: Guie o Raio Astral [C] pelos 3 prismas até a Runa Glacial!';
      } else {
        questText.textContent = 'Enfrente Trinit, a Tríade Glacial na Arena de Gelo!';
      }
    } else if (this.questStep === 8) {
      if (this.currentArea === 'CHRONOS_TEMPLE') {
        const activeTotems = this.chronosTotems.filter(t => t.activeTimer > 0).length;
        questText.textContent = activeTotems === 3 ? '✅ Sincronia Concluída! Siga para o Nexus de Cronos.' : `Templo de Cronos: Ative os 3 Totens com o Raio Astral [C] (${activeTotems}/3 sincronizados)!`;
      } else {
        questText.textContent = 'Enfrente Mirage, o Senhor dos Reflexos no Nexus de Cronos!';
      }
    } else if (this.questStep === 9) {
      if (this.currentArea === 'SHADOW_LABYRINTH') {
        const litOrbs = this.shadowOrbs.filter(o => o.isOn).length;
        questText.textContent = litOrbs === 4 ? '✅ Matriz Ativada! Siga para o Santuário do Abismo.' : `Labirinto: Acenda todos os 4 Orbes Espectrais na rede lógica (${litOrbs}/4)!`;
      } else {
        questText.textContent = 'Enfrente Nocturnus, o Soberano do Abismo no Santuário Umbral!';
      }
    } else if (this.questStep === 10) {
      questText.textContent = 'Enfrente Aethon, o Arquiteto das Dimensões na Cidadela do Éter!';
    } else {
      questText.textContent = '✨ O Multiverso e todos os 14 reinos foram restaurados em harmonia suprema!';
    }
  }

  showNotification(title, desc) {
    const banner = document.getElementById('notification-banner');
    document.getElementById('notification-title').textContent = title;
    document.getElementById('notification-desc').textContent = desc;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3500);
  }

  respawnPlayer() {
    this.player.lives = 3;
    this.player.health = this.player.maxHealth;
    this.player.invulnerableTimer = 2.5;
    document.getElementById('game-over-screen').classList.add('hidden');
    if (this.activeCheckpoint) {
      this.loadArea(this.activeCheckpoint.area, this.activeCheckpoint.x, this.activeCheckpoint.y);
    } else {
      this.loadArea(this.currentArea);
    }
    this.gameState = 'PLAYING';
    this.updateHUD();
  }

  resetNewGamePlus() {
    document.getElementById('victory-screen').classList.add('hidden');
    this.questStep = 1;
    this.player.lives = 3;
    this.player.health = this.player.maxHealth;
    this.player.seedsCollected = 0;
    this.activeCheckpoint = null;
    const badge = document.getElementById('checkpoint-badge');
    if (badge) badge.classList.add('hidden');
    this.loadArea('FOREST');
    this.gameState = 'PLAYING';
    this.showNotification('NOVO CICLO', 'A jornada renasce em glória cósmica!');
  }

  // --- GAME LOOP ---
  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    try {
      this.input.update();

      if (this.gameState === 'PLAYING') {
      // 1. Atualizar Jogador, Projéteis e Ondas Sísmicas
      this.player.update(this.input, this.map, dt, this.audio, this.particles, this.camera, this.projectiles, this.playerShockwaves, this.astralBeams);

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        this.projectiles[i].update(this.map, dt, this.particles);
        if (!this.projectiles[i].alive) this.projectiles.splice(i, 1);
      }

      for (let i = this.astralBeams.length - 1; i >= 0; i--) {
        this.astralBeams[i].update(
          this.map, dt, this.particles,
          this.icePrisms, this.iceRune, this.chronosTotems, this.shadowOrbs,
          this.boss, this.enemies, this.audio, this.camera
        );
        if (!this.astralBeams[i].alive) this.astralBeams.splice(i, 1);
      }

      for (let i = this.playerShockwaves.length - 1; i >= 0; i--) {
        this.playerShockwaves[i].update(this.enemies, this.boss, dt, this.audio, this.camera, this.particles);
        if (!this.playerShockwaves[i].alive) this.playerShockwaves.splice(i, 1);
      }

      if (this.player.health <= 0) {
        this.player.lives -= 1;
        this.updateHUD();
        if (this.player.lives > 0) {
          // Perdeu uma vida: restaura saúde plena, concede invulnerabilidade temporária e reposiciona
          this.player.health = this.player.maxHealth;
          this.player.invulnerableTimer = 2.5;
          this.audio.playPlayerHurt();
          this.camera.shake(14);
          this.particles.emit(this.player.x, this.player.y, 40, { color: '#ef4444', speed: 130 });

          if (this.activeCheckpoint && this.activeCheckpoint.area === this.currentArea) {
            this.player.x = this.activeCheckpoint.x;
            this.player.y = this.activeCheckpoint.y;
          } else {
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.player.x = centerX;
            this.player.y = centerY + 90;
          }

          this.showNotification('VIDA PERDIDA!', `Restam ${this.player.lives} vidas de guardião! Mantenha a guarda!`);
        } else {
          // 0 Vidas restantes: FIM DE JOGO REAL!
          this.gameState = 'GAMEOVER';
          document.getElementById('game-over-screen').classList.remove('hidden');
        }
      }

      // 2. Interação com a Coruja
      if (this.owl) {
        const nearOwl = this.owl.update(this.player, dt);
        if (nearOwl && this.input.consumeInteract()) {
          if (this.questStep === 1) {
            this.questStep = 2;
            this.triggerDialogue('Sylva', '🦉', [
              'Encontre as 5 sementes espalhadas para abrir o portal da Caverna!',
              'Lembre-se: segure [Shift] para correr e [Q] para esquivar!',
            ]);
          } else {
            this.triggerDialogue('Sylva', '🦉', [
              'A jornada é longa, Kaelen. As armas dos deuses aguardam sua coragem!',
            ]);
          }
        }
      }

      // 3. Interação com o Totem
      if (this.totem) {
        const nearTotem = this.totem.update(this.player, dt);
        if (nearTotem && !this.totem.activated && this.input.consumeInteract()) {
          if (this.player.seedsCollected >= CONFIG.TOTAL_SEEDS_NEEDED) {
            this.totem.activated = true;
            this.questStep = 3;
            this.audio.playVictory();
            this.camera.shake(12);
            this.particles.emit(this.totem.x, this.totem.y - 20, 50, { color: '#4ade80', speed: 140, life: 1.5 });
            this.showNotification('PORTAL ABERTO!', 'A Caverna dos Cristais foi desbloqueada!');
            this.portal = new AreaPortal(31 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE, 'CAVE', 'Caverna');
          } else {
            this.showNotification('SEMENTES FALTANDO', `Colete mais ${CONFIG.TOTAL_SEEDS_NEEDED - this.player.seedsCollected} sementes!`);
          }
        }
      }

      // 4. Interação com Baú
      if (this.chest && !this.chest.opened) {
        const dist = Math.hypot(this.player.x - this.chest.x, this.player.y - this.chest.y);
        if (dist < 44 && this.input.consumeInteract()) {
          this.chest.opened = true;
          this.player.hasAuroraGem = true;
          this.audio.playChestOpen();
          this.camera.shake(6);
          this.particles.emit(this.chest.x, this.chest.y, 25, { color: '#38bdf8', speed: 100 });
          this.showNotification('GEMA DA AURORA!', 'Seu cajado agora dispara projéteis de feitiço à distância!');
          this.checkBossPortalUnlock();
          this.updateHUD();
        }
      }

      // 5. Interação com Tabuleta de Pistas Rúnicas
      if (this.puzzleMonument) {
        const nearMon = this.puzzleMonument.update(this.player, dt);
        if (nearMon && this.input.consumeInteract()) {
          this.triggerDialogue(this.puzzleMonument.title, '📜', [this.puzzleMonument.riddle]);
        }
      }

      // 6. Interação com Cristais Harmônicos Musicais (Caverna)
      if (this.harmonicCrystals.length > 0) {
        for (let crystal of this.harmonicCrystals) {
          const near = crystal.update(this.player, dt);
          if (near && this.input.consumeInteract()) {
            if (crystal.activated) {
              this.audio.playPuzzleTone(crystal.freq);
              this.showNotification(crystal.name, 'Esta nota sagrada já ressoa em perfeita harmonia!');
            } else if (crystal.stepOrder === this.harmonicStep) {
              crystal.activated = true;
              this.harmonicStep++;
              this.audio.playPuzzleTone(crystal.freq);
              this.particles.emit(crystal.x, crystal.y, 30, { color: crystal.color, speed: 110 });
              this.showNotification('NOTA HARMÔNICA!', `${crystal.name} ressoou com perfeição (${this.harmonicStep - 1}/3)!`);
              if (this.harmonicStep > 3) {
                this.checkBossPortalUnlock();
              }
              this.updateHUD();
            } else {
              this.audio.playPuzzleFail();
              this.camera.shake(8);
              this.harmonicCrystals.forEach(c => {
                c.activated = false;
                c.flashTimer = 0.7;
              });
              this.harmonicStep = 1;
              this.particles.emit(crystal.x, crystal.y, 25, { color: '#ef4444', speed: 90 });
              this.showNotification('DISSONÂNCIA!', 'A ordem rúnica foi violada! O acorde se desfez e os cristais reiniciaram.');
              this.updateHUD();
            }
          }
        }
      }

      // 7. Interação com Cataventos da Rosa dos Ventos (Palácio dos Ventos)
      if (this.windCompasses.length > 0) {
        for (let compass of this.windCompasses) {
          const near = compass.update(this.player, dt);
          if (near && this.input.consumeInteract()) {
            compass.rotate(this.audio);
            this.particles.emit(compass.x, compass.y, 20, {
              color: compass.isAligned() ? '#facc15' : '#38bdf8',
              speed: 90
            });
            const dirNames = ['Norte (↑)', 'Leste (→)', 'Sul (↓)', 'Oeste (←)'];
            if (compass.isAligned()) {
              this.showNotification('VENTO ALINHADO!', `${compass.name} agora converge diretamente ao centro!`);
            } else {
              this.showNotification('VENTO DESVIADO', `${compass.name} aponta para ${dirNames[compass.direction]}.`);
            }
            this.checkBossPortalUnlock();
            this.updateHUD();
          }
        }
      }

      // 8. Interação com Caldeiras Térmicas (Abismo de Magma)
      if (this.magmaValves.length > 0) {
        for (let valve of this.magmaValves) {
          const near = valve.update(this.player, dt);
          if (near && this.input.consumeInteract()) {
            valve.toggle(this.audio);
            this.particles.emit(valve.x, valve.y, 20, {
              color: valve.heatValue < 0 ? '#38bdf8' : '#ea580c',
              speed: 80
            });
            const currentHeat = this.magmaValves.reduce((acc, v) => acc + (v.isOpen ? v.heatValue : 0), 0);
            if (currentHeat === 10) {
              this.audio.playVictory();
              this.camera.shake(8);
              this.particles.emit(this.forgeAltar.x, this.forgeAltar.y, 40, { color: '#facc15', speed: 120 });
              this.showNotification('CALOR PERFEITO (10 ºC)!', 'O Altar da Forja está ativado para forjar a Espada de Fogo!');
            } else {
              this.showNotification(valve.isOpen ? 'VÁLVULA ABERTA' : 'VÁLVULA FECHADA', `Pressão Térmica Total: ${currentHeat} ºC (Alvo: exatamente 10 ºC)`);
            }
            this.checkBossPortalUnlock();
            this.updateHUD();
          }
        }
      }

      // 9. Interação com Altar da Forja (Área 6)
      if (this.forgeAltar && !this.forgeAltar.used) {
        const nearForge = this.forgeAltar.update(this.player, dt);
        if (nearForge && this.input.consumeInteract()) {
          const currentHeat = this.magmaValves.reduce((acc, v) => acc + (v.isOpen ? v.heatValue : 0), 0);
          if (currentHeat !== 10) {
            this.audio.playHit();
            this.camera.shake(5);
            this.showNotification('TEMPERATURA INSTÁVEL!', `O cadinho está a ${currentHeat} ºC. Regule as 4 caldeiras para exatamente 10 ºC!`);
          } else {
            this.forgeAltar.used = true;
            this.player.swordLevel = 2; // Evolução para Espada do Fogo Estelar!
            this.player.activeWeapon = 'SWORD';
            this.questStep = 6;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.player.health = this.player.maxHealth;
            this.audio.playVictory();
            this.camera.shake(12);
            this.particles.emit(this.forgeAltar.x, this.forgeAltar.y, 45, { color: '#f97316', speed: 140 });
            this.showNotification('ESPADA FORJADA!', 'Lâmina do Fogo Estelar forjada! +1 VIDA EXTRA & CURA TOTAL!');
            this.checkBossPortalUnlock();
            this.updateHUD();
          }
        }
      }

      // 10. Interação com Monólitos de Checkpoint
      if (this.checkpointMonuments.length > 0) {
        for (let cp of this.checkpointMonuments) {
          const near = cp.update(this.player, dt);
          if (near && !cp.activated && this.input.consumeInteract()) {
            cp.activate(this);
            this.updateHUD();
          }
        }
      }

      // 11. Interação com Prismas Glaciais (Fase 8: Geleira de Niflheim)
      if (this.icePrisms.length > 0) {
        for (let prism of this.icePrisms) {
          const near = prism.update(this.player, dt);
          if (near && this.input.consumeInteract()) {
            prism.rotate(this.audio, this.particles);
            this.showNotification('PRISMA AJUSTADO', `${prism.name}: Orientação rotacionada para ${prism.rotation === 0 ? '↗ /' : '↘ \\'}!`);
          }
        }
      }

      // 12. Atualizar Runa Glacial (Fase 8)
      if (this.iceRune) {
        this.iceRune.update(dt);
        this.checkBossPortalUnlock();
      }

      // 13. Atualizar Totens Temporais de Cronos (Fase 9)
      if (this.chronosTotems.length > 0) {
        for (let totem of this.chronosTotems) {
          totem.update(dt);
        }
        this.checkBossPortalUnlock();
      }

      // 14. Interação com Orbes Espectrais de Lógica (Fase 10)
      if (this.shadowOrbs.length > 0) {
        for (let orb of this.shadowOrbs) {
          const near = orb.update(this.player, dt);
          if (near && this.input.consumeInteract()) {
            orb.toggle(this.audio, this.particles, this.shadowOrbs);
            this.showNotification('REDE ESPECTRAL ALTERADA', `${orb.name} e conexões vizinhas invertidas!`);
            this.checkBossPortalUnlock();
            this.updateHUD();
          }
        }
      }

      // 15. Interação com Portal
      if (this.portal) {
        this.portal.update(dt);
        const dist = Math.hypot(this.player.x - this.portal.x, this.player.y - this.portal.y);
        if (dist < 40 && this.input.consumeInteract()) {
          if (this.portal.locked) {
            this.audio.playHit();
            this.camera.shake(4);
            this.showNotification('PORTAL TRANCADO', this.portal.lockReason || 'Cumpra os objetivos da fase primeiro!');
          } else {
            this.audio.playTeleport();
            this.particles.emit(this.player.x, this.player.y, 20, { color: '#38bdf8', speed: 90 });
            const next = this.portal.targetArea;
            setTimeout(() => this.loadArea(next), 200);
          }
        }
      }

      // 16. Atualizar Inimigos Comuns
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const drop = this.enemies[i].update(this.player, this.map, dt, this.audio, this.particles, this.camera, this.projectiles);
        if (drop) this.items.push(drop);
        if (!this.enemies[i].alive) this.enemies.splice(i, 1);
      }

      // 17. Atualizar Chefes (Malakar, Valdor, Kharon ou Aethon)
      if (this.boss) {
        this.boss.update(this.player, this.map, dt, this.audio, this.particles, this.camera, this.projectiles, this.enemies);

        if (!this.boss.alive) {
          if (this.currentArea === 'SANCTUARY') {
            // CHEFE 1 DERROTADO (MALAKAR) -> +1 CORAÇÃO MÁXIMO, +1 VIDA EXTRA, CURA TOTAL, PODER SÍSMICO [R] E DISPARO TRIPLO!
            this.audio.playVictory();
            this.camera.shake(14);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.enemies = []; // Elimina ajudantes remanescentes
            this.player.hasColossusPower = true;
            this.questStep = 4;
            this.boss = null;
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.portal = new AreaPortal(centerX, centerY - 40, 'SKY_ISLANDS', 'Palácio dos Ventos', true);

            // Exibir Banner de Desbloqueio do Super Poder [R]
            document.getElementById('power-unlock-banner').classList.remove('hidden');
            this.gameState = 'DIALOGUE';
            this.updateHUD();

          } else if (this.currentArea === 'SKY_THRONE') {
            // CHEFE 2 DERROTADO (VALDOR) -> +1 CORAÇÃO MÁXIMO, +1 VIDA EXTRA, CURA TOTAL, GANHA A ESPADA [F]!
            this.audio.playVictory();
            this.camera.shake(16);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.enemies = []; // Elimina ajudantes remanescentes
            this.player.hasSword = true;
            this.questStep = 5;
            this.boss = null;
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.portal = new AreaPortal(centerX, centerY - 40, 'MAGMA_CORE', 'Abismo de Magma', true);

            // Exibir Banner de Desbloqueio da Espada
            document.getElementById('sword-unlock-banner').classList.remove('hidden');
            this.gameState = 'DIALOGUE';
            this.updateHUD();

          } else if (this.currentArea === 'VOID_CORE') {
            // CHEFE 3 DERROTADO (KHARON) -> +1 CORAÇÃO MÁXIMO, +1 VIDA EXTRA, CURA TOTAL, PODER DO FOGO CÓSMICO E RAIO ASTRAL!
            this.audio.playVictory();
            this.camera.shake(20);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.player.hasBurnPower = true;
            this.player.hasAstralBeam = true; // Desbloqueia Raio Astral [C] / [X]!
            this.enemies = []; // Elimina ajudantes remanescentes
            this.boss = null;
            this.questStep = 7;
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.portal = new AreaPortal(centerX, centerY - 40, 'FROZEN_TUNDRA', 'Geleira de Niflheim', true);

            // Exibir Banner de Desbloqueio do Raio Astral
            document.getElementById('beam-unlock-banner').classList.remove('hidden');
            this.gameState = 'DIALOGUE';
            this.updateHUD();

          } else if (this.currentArea === 'GLACIAL_ARENA') {
            // CHEFE 4 DERROTADO: TRINIT, A TRÍADE GLACIAL -> +1 CORAÇÃO MÁXIMO, +1 VIDA EXTRA, CURA TOTAL, PORTAL PARA O TEMPLO DE CRONOS!
            this.audio.playVictory();
            this.camera.shake(16);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.enemies = [];
            this.boss = null;
            this.questStep = 8;
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.portal = new AreaPortal(centerX, centerY - 40, 'CHRONOS_TEMPLE', 'Templo de Cronos', true);
            this.showNotification('TRÍADE GLACIAL DERROTADA!', '+1 Vida Extra e Coração Máximo! Siga para o Templo de Cronos!');
            this.updateHUD();

          } else if (this.currentArea === 'CHRONOS_NEXUS') {
            // CHEFE 5 DERROTADO: MIRAGE, O SENHOR DOS REFLEXOS -> +1 CORAÇÃO MÁXIMO, +1 VIDA EXTRA, CURA TOTAL, PORTAL PARA O LABIRINTO!
            this.audio.playVictory();
            this.camera.shake(18);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.enemies = [];
            this.boss = null;
            this.questStep = 9;
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.portal = new AreaPortal(centerX, centerY - 40, 'SHADOW_LABYRINTH', 'Labirinto das Sombras', true);
            this.showNotification('ILUSÃO TEMPORAL DISSIPADA!', '+1 Vida Extra e Coração Máximo! Siga para o Labirinto das Sombras!');
            this.updateHUD();

          } else if (this.currentArea === 'SHADOW_SANCTUM') {
            // CHEFE 6 DERROTADO: NOCTURNUS, O SOBERANO DO ABISMO -> +1 CORAÇÃO MÁXIMO, +1 VIDA EXTRA, CURA TOTAL, PORTAL PARA A CIDADELA!
            this.audio.playVictory();
            this.camera.shake(20);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.enemies = [];
            this.boss = null;
            this.questStep = 10;
            const centerX = (CONFIG.MAP_COLS * CONFIG.TILE_SIZE) / 2;
            const centerY = (CONFIG.MAP_ROWS * CONFIG.TILE_SIZE) / 2;
            this.portal = new AreaPortal(centerX, centerY - 40, 'AETHER_CITADEL', 'Cidadela do Éter', true);
            this.showNotification('SOBERANO DO ABISMO EXPULSO!', '+1 Vida Extra e Coração Máximo! O Portal Supremo da Cidadela foi liberado!');
            this.updateHUD();

          } else if (this.currentArea === 'AETHER_CITADEL') {
            // 7º MEGA-CHEFE FINAL DERROTADO: AETHON, O ARQUITETO DAS DIMENSÕES (VITÓRIA FINAL!)
            this.audio.playVictory();
            this.camera.shake(25);
            document.getElementById('boss-hud').classList.add('hidden');
            this.player.maxHealth += 1;
            this.player.health = this.player.maxHealth;
            if (this.player.lives < this.player.maxLives) this.player.lives++;
            this.enemies = [];
            this.boss = null;
            this.questStep = 11;
            this.updateHUD();

            setTimeout(() => {
              this.gameState = 'VICTORY';
              document.getElementById('victory-stats').innerHTML = `
                ⭐ 7 Grandes Chefes Derrotados: <b>MALAKAR, VALDOR, KHARON, TRINIT, MIRAGE, NOCTURNUS & AETHON</b><br>
                ⚔️ Arsenal Mestre Completo: <b>CAJADO, ESPADA DO FOGO ESTELAR & RAIO ASTRAL</b><br>
                ⚡ Habilidades Antigas: <b>PISÃO SÍSMICO [R], FOGO CÓSMICO (DoT) & RAIO PERFURANTE [C]</b><br>
                🧩 Enigmas Lógicos Decifrados: <b>REFRAÇÃO GLACIAL, SINCRONIA DE CRONOS & MATRIZ DAS SOMBRAS</b><br>
                🛡️ Vidas de Guardião Restantes: <b>${this.player.lives} / ${this.player.maxLives}</b><br>
                🚩 Checkpoints Descobertos: <b>TODOS OS SANTUÁRIOS REGISTRADOS!</b><br>
                🌌 14 Fases Épicas Superadas: <b>A JORNADA COMPLETA FOI CONQUISTADA!</b>
              `;
              document.getElementById('victory-screen').classList.remove('hidden');
            }, 2500);
          }
        }
      }

      // 18. Coleta de Sementes
      for (let i = this.seeds.length - 1; i >= 0; i--) {
        this.seeds[i].update(dt);
        if (this.player.intersects(this.seeds[i])) {
          this.player.seedsCollected++;
          this.audio.playPickup();
          this.particles.emit(this.seeds[i].x, this.seeds[i].y, 12, { color: '#4ade80', speed: 60 });
          this.seeds.splice(i, 1);
          this.updateHUD();
          if (this.player.seedsCollected === CONFIG.TOTAL_SEEDS_NEEDED) {
            this.showNotification('TODAS AS SEMENTES!', 'Restaure o Totem no centro do bosque!');
          }
        }
      }

      // 19. Coleta de Corações
      for (let i = this.items.length - 1; i >= 0; i--) {
        this.items[i].update(dt);
        if (this.player.intersects(this.items[i])) {
          if (this.player.health < this.player.maxHealth) {
            this.player.health++;
            this.audio.playPickup();
            this.particles.emit(this.items[i].x, this.items[i].y, 8, { color: '#ef4444', speed: 40 });
            this.items.splice(i, 1);
            this.updateHUD();
          }
        } else if (!this.items[i].alive) {
          this.items.splice(i, 1);
        }
      }

      // 20. Quebra de Arbustos e Cristais
      if (this.player.isAttacking && this.player.attackHitbox) {
        for (let i = this.breakables.length - 1; i >= 0; i--) {
          if (this.breakables[i].intersects(this.player.attackHitbox)) {
            const b = this.breakables[i];
            let pColor = '#22c55e';
            if (b.type === 'CRYSTAL') pColor = '#38bdf8';
            if (b.type === 'MAGMA_ROCK') pColor = '#f97316';
            this.particles.emit(b.x, b.y, 8, { color: pColor, speed: 60 });
            this.audio.playHit();
            this.breakables.splice(i, 1);
          }
        }
      }

      this.camera.update(this.player.x, this.player.y, this.map.width, this.map.height, dt);
      this.particles.update(dt);
      this.updateHUD();

    } else if (this.gameState === 'DIALOGUE') {
      this.updateDialogue(dt);
      this.particles.update(dt);
    }

    this.render();
  } catch (err) {
    console.error('Erro no loop do jogo:', err);
  }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Mapa
    this.map.draw(this.ctx, this.camera);

    // 2. Objetos Interativos e Puzzles
    this.breakables.forEach(b => b.draw(this.ctx, this.camera));
    this.seeds.forEach(s => s.draw(this.ctx, this.camera));
    this.items.forEach(item => item.draw(this.ctx, this.camera));

    if (this.totem) {
      const nearTotem = Math.hypot(this.player.x - this.totem.x, this.player.y - this.totem.y) < 54;
      this.totem.draw(this.ctx, this.camera, nearTotem, this.player.seedsCollected);
    }

    if (this.owl) {
      const nearOwl = Math.hypot(this.player.x - this.owl.x, this.player.y - this.owl.y) < 48;
      this.owl.draw(this.ctx, this.camera, nearOwl);
    }

    if (this.chest) {
      const nearChest = Math.hypot(this.player.x - this.chest.x, this.player.y - this.chest.y) < 44;
      this.chest.draw(this.ctx, this.camera, nearChest);
    }

    // Tabuleta de Enigmas / Monólito Rúnico
    if (this.puzzleMonument) {
      const nearMon = Math.hypot(this.player.x - this.puzzleMonument.x, this.player.y - this.puzzleMonument.y) < 46;
      this.puzzleMonument.draw(this.ctx, this.camera, nearMon);
    }

    // Cristais Harmônicos da Caverna
    this.harmonicCrystals.forEach(c => {
      const near = Math.hypot(this.player.x - c.x, this.player.y - c.y) < 46;
      c.draw(this.ctx, this.camera, near);
    });

    // Cataventos da Rosa dos Ventos (Palácio dos Ventos)
    this.windCompasses.forEach(w => {
      const near = Math.hypot(this.player.x - w.x, this.player.y - w.y) < 46;
      w.draw(this.ctx, this.camera, near);
    });

    // Caldeiras Térmicas do Abismo de Magma
    this.magmaValves.forEach(v => {
      const near = Math.hypot(this.player.x - v.x, this.player.y - v.y) < 46;
      v.draw(this.ctx, this.camera, near);
    });

    // Pilares legados (se houver)
    this.pylons.forEach(p => {
      const near = Math.hypot(this.player.x - p.x, this.player.y - p.y) < 44;
      p.draw(this.ctx, this.camera, near);
    });

    if (this.forgeAltar) {
      const nearForge = Math.hypot(this.player.x - this.forgeAltar.x, this.player.y - this.forgeAltar.y) < 54;
      const currentHeat = this.magmaValves.length > 0 ? this.magmaValves.reduce((acc, v) => acc + (v.isOpen ? v.heatValue : 0), 0) : null;
      this.forgeAltar.draw(this.ctx, this.camera, nearForge, currentHeat);
    }

    // Monólitos de Checkpoint das Fases
    this.checkpointMonuments.forEach(cp => {
      const near = Math.hypot(this.player.x - cp.x, this.player.y - cp.y) < 46;
      cp.draw(this.ctx, this.camera, near);
    });

    // Prismas Glaciais (Fase 8: Geleira de Niflheim)
    this.icePrisms.forEach(p => {
      const near = Math.hypot(this.player.x - p.x, this.player.y - p.y) < 46;
      p.draw(this.ctx, this.camera, near);
    });

    // Runa Glacial (Fase 8)
    if (this.iceRune) {
      this.iceRune.draw(this.ctx, this.camera);
    }

    // Totens Temporais de Cronos (Fase 9)
    this.chronosTotems.forEach(t => t.draw(this.ctx, this.camera));

    // Orbes Espectrais de Lógica (Fase 10)
    this.shadowOrbs.forEach(o => {
      const near = Math.hypot(this.player.x - o.x, this.player.y - o.y) < 44;
      o.draw(this.ctx, this.camera, near, this.shadowOrbs);
    });

    if (this.portal) {
      const nearPortal = Math.hypot(this.player.x - this.portal.x, this.player.y - this.portal.y) < 40;
      this.portal.draw(this.ctx, this.camera, nearPortal);
    }

    // 3. Inimigos e Chefes
    this.enemies.forEach(e => e.draw(this.ctx, this.camera));
    if (this.boss) this.boss.draw(this.ctx, this.camera);

    // 4. Projéteis do Jogador, Feixes Astrais e Ondas Sísmicas Sagradas
    this.projectiles.forEach(p => p.draw(this.ctx, this.camera));
    this.astralBeams.forEach(b => b.draw(this.ctx, this.camera));
    this.playerShockwaves.forEach(sw => sw.draw(this.ctx, this.camera));

    // 5. Jogador
    this.player.draw(this.ctx, this.camera);

    // 6. Partículas
    this.particles.draw(this.ctx, this.camera);

    // 7. Iluminação Dinâmica da Caverna
    if (this.currentArea === 'CAVE') {
      const sx = this.player.x - this.camera.x;
      const sy = this.player.y - this.camera.y;

      const grad = this.ctx.createRadialGradient(sx, sy, 40, sx, sy, 190);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.65, 'rgba(10, 15, 30, 0.65)');
      grad.addColorStop(1, 'rgba(5, 8, 20, 0.95)');

      this.ctx.save();
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
