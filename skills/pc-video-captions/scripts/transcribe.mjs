// Hebrew transcription with word timestamps (Groq whisper-large-v3).  node transcribe.mjs video.mp4 asr.json ["context prompt"]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const [input, out = 'asr.json', prompt = ''] = process.argv.slice(2)
const keyFile = path.join(os.homedir(), '.config', 'powercouple', 'groq-key')
const key = process.env.GROQ_API_KEY || (fs.existsSync(keyFile) && fs.readFileSync(keyFile, 'utf8').trim())
if (!key) { console.error('❌ חסר GROQ_API_KEY (או ~/.config/powercouple/groq-key)'); process.exit(1) }
const mp3 = path.join(os.tmpdir(), `asr-${Date.now()}.mp3`)
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', mp3])
const form = new FormData()
form.append('file', new Blob([fs.readFileSync(mp3)]), 'a.mp3')
form.append('model', 'whisper-large-v3'); form.append('language', 'he'); form.append('response_format', 'verbose_json')
form.append('timestamp_granularities[]', 'word'); form.append('timestamp_granularities[]', 'segment')
if (prompt) form.append('prompt', prompt)
const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form })
fs.unlinkSync(mp3)
const j = await r.json(); if (!r.ok) { console.error('❌', j.error?.message || r.status); process.exit(1) }
fs.writeFileSync(out, JSON.stringify(j, null, 1))
for (const s of j.segments || []) console.log(s.start.toFixed(2).padStart(6), '→', s.end.toFixed(2).padStart(6), s.text.trim())
console.log(`✅ ${out} · ${(j.words || []).length} מילים`)
