# Original game audio

Fourteen original mono PCM WAV effects created with `scripts/generate-audio.mjs`: layered filtered-noise impacts and swooshes, swept-frequency blasters, energy bursts, metallic gear clicks, pack tear and reveal, chimes, brass-style fanfares and low percussion. No third-party samples. Regenerate with Node from the project root. All waveforms have headroom below full scale; playback uses a shared decoded-buffer cache and gain control. The PWA caches WAV files for offline use. Settings lets players preview each sound; sound stays opt-in.
