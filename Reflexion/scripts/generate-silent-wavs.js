// Generate minimal silent WAV files for placeholder purposes
const fs = require('fs');
const path = require('path');

// Minimal WAV file header for a silent 0.1 second audio file
function createSilentWav() {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const duration = 0.1; // 100ms
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // Data is already zeros (silent)
  
  return buffer;
}

const soundsDir = path.join(__dirname, '../assets/sounds');

// Create directory if it doesn't exist
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

const soundFiles = [
  'tap.wav',
  'miss.wav',
  'combo.wav',
  'coin.wav',
  'levelup.wav',
  'gameover.wav',
  'lucky.wav'
];

const wavData = createSilentWav();

soundFiles.forEach(filename => {
  const filepath = path.join(soundsDir, filename);
  fs.writeFileSync(filepath, wavData);
  console.log(`✅ Created ${filename}`);
});

console.log('\n✅ All placeholder sound files created successfully!');
console.log('⚠️ These are silent placeholder files. Replace with actual game sounds for better UX.');



