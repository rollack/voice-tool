// Simple WAV encoder/header injector for raw PCM data if needed, 
// and logic to concatenate audio buffers.

export const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const decodeAudioData = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
  return await audioContext.decodeAudioData(arrayBuffer);
};

export const concatenateAudioBuffers = (buffers: AudioBuffer[]): AudioBuffer => {
  if (buffers.length === 0) return audioContext.createBuffer(1, 1, 24000);

  const channels = buffers[0].numberOfChannels;
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const sampleRate = buffers[0].sampleRate;

  const result = audioContext.createBuffer(channels, totalLength, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const resultData = result.getChannelData(ch);
    let offset = 0;
    for (const buf of buffers) {
      resultData.set(buf.getChannelData(ch), offset);
      offset += buf.length;
    }
  }

  return result;
};

export const mixAudioBuffers = (speechBuffer: AudioBuffer, bgBuffer: AudioBuffer, bgVolume: number = 0.2): AudioBuffer => {
  const channels = speechBuffer.numberOfChannels;
  const length = speechBuffer.length;
  const sampleRate = speechBuffer.sampleRate;

  const mixed = audioContext.createBuffer(channels, length, sampleRate);

  for (let c = 0; c < channels; c++) {
    const speechData = speechBuffer.getChannelData(c);
    // Handle mono/stereo mismatch by cycling channels if needed, or just picking 0 for mono bg
    const bgChannelData = bgBuffer.getChannelData(c % bgBuffer.numberOfChannels);
    const mixedData = mixed.getChannelData(c);

    for (let i = 0; i < length; i++) {
      // Loop background audio
      const bgSample = bgChannelData[i % bgBuffer.length];
      mixedData[i] = speechData[i] + (bgSample * bgVolume);
    }
  }

  return mixed;
};

// Convert AudioBuffer to WAV Blob
export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArr], { type: "audio/wav" });

  function setUint16(data: any) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: any) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};