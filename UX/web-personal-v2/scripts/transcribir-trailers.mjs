// Transcribe el audio de los tráileres con Whisper (en local) para sacar el
// borrador de los subtítulos. Solo se usa al preparar la web; la web no lo
// necesita para funcionar.
//
//   node scripts/transcribir-trailers.mjs <carpeta-de-salida> [modelo]
//
// Por cada vídeo de public/media/videos deja un <id>.json con los fragmentos
// y sus tiempos. A partir de ahí se revisan a mano y se escriben los .vtt de
// public/media/subtitles.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import { pipeline } from "@huggingface/transformers";

const [outDir, model = "onnx-community/whisper-small"] = process.argv.slice(2);
if (!outDir) {
  console.error("Uso: node scripts/transcribir-trailers.mjs <carpeta-de-salida> [modelo]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const videosDir = path.join("public", "media", "videos");
const videos = readdirSync(videosDir, { recursive: true })
  .filter((f) => f.endsWith(".mp4"))
  .map((f) => path.join(videosDir, f));

// Audio a 16 kHz, mono, float32: lo que espera Whisper.
function readAudio(file) {
  const raw = execFileSync(
    ffmpeg,
    ["-v", "error", "-i", file, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
    { maxBuffer: 1 << 30 },
  );
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

const transcriber = await pipeline("automatic-speech-recognition", model, { dtype: "fp32" });

for (const file of videos) {
  const id = path.relative(videosDir, file).replace(/\\/g, "/").replace(/\.mp4$/, "");
  console.log("Transcribiendo", id);
  const audio = readAudio(file);
  const result = await transcriber(audio, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
    task: "transcribe",
    language: "en",
    no_repeat_ngram_size: 3,
    repetition_penalty: 1.2,
  });
  const name = id.replace(/\//g, "__");
  writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(result, null, 2));
  console.log(`  ${(audio.length / 16000).toFixed(0)} s, ${result.chunks?.length ?? 0} fragmentos`);
}
