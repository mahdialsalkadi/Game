import { sfx, GameSynthesizer, setAudioTheme, getAudioTheme } from "./src/utils/soundEffects";
import {
  THEMED_VOICE_LINES,
  CULTURAL_VOICE_LINES,
  THEMED_QUICK_EMOJIS,
  QUICK_EMOJIS
} from "./src/components/common/SocialReactionsBar";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("=================================================");
console.log("🧪 RUNNING THEMED AUDIO SOUNDSCAPES & SOCIAL BANTER SUITE");
console.log("=================================================");

// --- 1. Testing Audio Theme State & Helpers ---
console.log("\n--- 1. Testing Audio Theme State & Helpers ---");
assert(getAudioTheme() === "ARABIAN_MAJLIS", "Default audio theme is ARABIAN_MAJLIS");

setAudioTheme("CYBERPUNK_NEON");
assert(getAudioTheme() === "CYBERPUNK_NEON", "Audio theme updated to CYBERPUNK_NEON");

setAudioTheme("DEEP_SPACE");
assert(getAudioTheme() === "DEEP_SPACE", "Audio theme updated to DEEP_SPACE");

setAudioTheme("MEDIEVAL_FANTASY");
assert(getAudioTheme() === "MEDIEVAL_FANTASY", "Audio theme updated to MEDIEVAL_FANTASY");

setAudioTheme("ARABIAN_MAJLIS");
assert(getAudioTheme() === "ARABIAN_MAJLIS", "Audio theme reset to ARABIAN_MAJLIS");

// --- 2. Testing Safe Execution in Headless / Node Environment ---
console.log("\n--- 2. Testing Safe Execution in Headless Environment ---");
const themes = ["ARABIAN_MAJLIS", "CYBERPUNK_NEON", "DEEP_SPACE", "MEDIEVAL_FANTASY"];

for (const th of themes) {
  sfx.setAudioTheme(th);
  sfx.unlockAudio();
  sfx.playDiceRoll();
  sfx.playDiceShake();
  sfx.playDiceTumble();
  sfx.playCoinChime();
  sfx.playDramaAlert();
  sfx.playTurnChime();
  sfx.playAlert();
  sfx.playCardPlay();
  sfx.playCardSlide();
  sfx.playCardSlap();
  sfx.playUnoShout();
  sfx.playLadderAscent();
  sfx.playSnakeSlide();
  sfx.playPawnHop();
  sfx.playCaptureSlap();
  sfx.playVictoryFanfare();
  sfx.playReactionCue();
  assert(true, `All audio methods executed safely without throws under ${th}`);
}

// --- 3. Testing Procedural Synthesis with Mock Web Audio API ---
console.log("\n--- 3. Testing Procedural Web Audio API Synthesis ---");

class MockParam {
  public value: number = 0;
  setValueAtTime(_val: number, _time: number) { this.value = _val; }
  linearRampToValueAtTime(_val: number, _time: number) { this.value = _val; }
  exponentialRampToValueAtTime(_val: number, _time: number) { this.value = _val; }
}

class MockNode {
  connect(_dest: any) {}
  start(_time?: number) {}
  stop(_time?: number) {}
}

class MockOscillator extends MockNode {
  public type: OscillatorType = "sine";
  public frequency = new MockParam();
}

class MockGain extends MockNode {
  public gain = new MockParam();
}

class MockFilter extends MockNode {
  public type: BiquadFilterType = "lowpass";
  public frequency = new MockParam();
  public Q = new MockParam();
}

class MockBufferSource extends MockNode {
  public buffer: any = null;
}

class MockAudioContext {
  public currentTime = 10.0;
  public state = "running";
  public sampleRate = 44100;
  public destination = new MockNode();

  public createdOscillators: MockOscillator[] = [];
  public createdFilters: MockFilter[] = [];
  public createdGains: MockGain[] = [];

  createOscillator(): MockOscillator {
    const osc = new MockOscillator();
    this.createdOscillators.push(osc);
    return osc;
  }

  createGain(): MockGain {
    const g = new MockGain();
    this.createdGains.push(g);
    return g;
  }

  createBiquadFilter(): MockFilter {
    const f = new MockFilter();
    this.createdFilters.push(f);
    return f;
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: (_ch: number) => new Float32Array(length)
    };
  }

  createBufferSource(): MockBufferSource {
    return new MockBufferSource();
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }
}

// Test synthesizer with mock context
const mockCtx = new MockAudioContext();
const synth = new GameSynthesizer();
(synth as any).ctx = mockCtx;

// Test Cyberpunk sound synthesis characteristics
console.log("   Testing Cyberpunk procedural synthesis characteristics...");
synth.setAudioTheme("CYBERPUNK_NEON");
mockCtx.createdOscillators = [];
mockCtx.createdFilters = [];

synth.playCardSlide();
assert(
  mockCtx.createdOscillators.some((o) => o.type === "sawtooth"),
  "Cyberpunk card slide utilizes sawtooth wave for laser sweep"
);
assert(
  mockCtx.createdFilters.some((f) => f.type === "highpass"),
  "Cyberpunk card slide utilizes highpass filter"
);

mockCtx.createdOscillators = [];
mockCtx.createdFilters = [];
synth.playTurnChime();
assert(
  mockCtx.createdOscillators.some((o) => o.type === "sawtooth" || o.type === "square"),
  "Cyberpunk turn chime utilizes square/sawtooth synth wave"
);
assert(
  mockCtx.createdFilters.some((f) => f.type === "highpass"),
  "Cyberpunk turn chime utilizes highpass filter"
);

// Test Deep Space sound synthesis characteristics
console.log("   Testing Deep Space procedural synthesis characteristics...");
synth.setAudioTheme("DEEP_SPACE");
mockCtx.createdOscillators = [];
mockCtx.createdFilters = [];

synth.playDiceTumble();
assert(
  mockCtx.createdOscillators.some((o) => o.type === "sine"),
  "Deep Space dice tumble utilizes resonant sine waves"
);

mockCtx.createdOscillators = [];
synth.playTurnChime();
assert(
  mockCtx.createdOscillators.every((o) => o.type === "sine"),
  "Deep Space turn chime utilizes pure low/cosmic sines"
);

// Test Medieval Fantasy sound synthesis characteristics
console.log("   Testing Medieval Fantasy procedural synthesis characteristics...");
synth.setAudioTheme("MEDIEVAL_FANTASY");
mockCtx.createdOscillators = [];

synth.playTurnChime();
assert(
  mockCtx.createdOscillators.some((o) => o.type === "triangle" || o.type === "sine"),
  "Medieval turn chime utilizes horn triangle and bell sine frequencies"
);

// Test All Reaction Cues under Mock Audio Context
console.log("   Testing all reaction cues procedural audio synthesis...");
const allCues = [
  // Arabian
  "flame", "crown", "dice", "laugh", "coffee", "eagle",
  // Cyberpunk
  "hack", "zap", "glitch", "bypass", "overclock", "algorithm",
  // Deep Space
  "infinity", "meteor", "blackhole", "torpedo", "captain", "lost_space",
  // Medieval
  "kingdom", "knight_treachery", "dragon_fire", "wizard_spell", "castle_siege", "crown_fallen"
];

for (const cue of allCues) {
  mockCtx.createdOscillators = [];
  synth.playReactionCue(cue);
  assert(
    mockCtx.createdOscillators.length > 0,
    `Reaction cue '${cue}' synthesized audio oscillators successfully`
  );
}

// --- 4. Testing Themed Cultural Social Banter ---
console.log("\n--- 4. Testing Themed Cultural Social Banter ---");

// ARABIAN_MAJLIS
const arabianLines = THEMED_VOICE_LINES.ARABIAN_MAJLIS;
assert(Array.isArray(arabianLines) && arabianLines.length === 6, "ARABIAN_MAJLIS has exactly 6 voice lines");
const expectedArabian = [
  "يا لعيب! 🔥",
  "أكلت الجو! 👑",
  "حظك يفلق الصخر! 🎲",
  "ما يصحش كده! 😅",
  "بالشفا! ☕",
  "وين طاير؟ 🦅"
];
expectedArabian.forEach((phrase, idx) => {
  assert(arabianLines[idx].phrase === phrase, `Arabian phrase [${idx}] matches: ${phrase}`);
});

// CYBERPUNK_NEON
const cyberLines = THEMED_VOICE_LINES.CYBERPUNK_NEON;
assert(Array.isArray(cyberLines) && cyberLines.length === 6, "CYBERPUNK_NEON has exactly 6 voice lines");
const expectedCyber = [
  "نظامك تهكر! 🤖",
  "شحنة خارقة! ⚡",
  "انقطع اتصالك! 💥",
  "تجاوزت الحماية! 🔓",
  "أوفركلوك! 🚀",
  "خوارزمية محكمة! 🦾"
];
expectedCyber.forEach((phrase, idx) => {
  assert(cyberLines[idx].phrase === phrase, `Cyberpunk phrase [${idx}] matches: ${phrase}`);
});

// DEEP_SPACE
const spaceLines = THEMED_VOICE_LINES.DEEP_SPACE;
assert(Array.isArray(spaceLines) && spaceLines.length === 6, "DEEP_SPACE has exactly 6 voice lines");
const expectedSpace = [
  "إلى اللانهاية! 🌌",
  "اصطدام نيزكي! ☄️",
  "جاذبية فائقة! 🕳️",
  "أطلقت الطوربيدات! 🚀",
  "كابتن الأسطول! 👨‍🚀",
  "ضعت في الفضاء! 🛸"
];
expectedSpace.forEach((phrase, idx) => {
  assert(spaceLines[idx].phrase === phrase, `Deep Space phrase [${idx}] matches: ${phrase}`);
});

// MEDIEVAL_FANTASY
const medievalLines = THEMED_VOICE_LINES.MEDIEVAL_FANTASY;
assert(Array.isArray(medievalLines) && medievalLines.length === 6, "MEDIEVAL_FANTASY has exactly 6 voice lines");
const expectedMedieval = [
  "لتحيا المملكة! ⚔️",
  "غدر الفرسان! 🛡️",
  "نار التنين! 🐉",
  "ضربة الساحر! 🧙‍♂️",
  "حصار محكم! 🏰",
  "سقط التاج! 👑"
];
expectedMedieval.forEach((phrase, idx) => {
  assert(medievalLines[idx].phrase === phrase, `Medieval phrase [${idx}] matches: ${phrase}`);
});

// --- 5. Testing Themed Sticker Emojis & Backward Compatibility ---
console.log("\n--- 5. Testing Themed Quick Emojis & Backward Compatibility ---");
for (const th of themes) {
  const emojis = THEMED_QUICK_EMOJIS[th];
  assert(Array.isArray(emojis) && emojis.length === 8, `Theme ${th} has 8 quick emojis`);
}

assert(CULTURAL_VOICE_LINES === THEMED_VOICE_LINES.ARABIAN_MAJLIS, "CULTURAL_VOICE_LINES equals Arabian lines");
assert(QUICK_EMOJIS.length === 8, "QUICK_EMOJIS length is 8");

console.log("\n=================================================");
console.log("🎉 ALL THEMED AUDIO SOUNDSCAPES & SOCIAL BANTER TESTS PASSED!");
console.log("=================================================");
