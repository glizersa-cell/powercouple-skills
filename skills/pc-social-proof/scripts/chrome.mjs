// Shared: launch the locally installed Chrome via puppeteer-core.
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const CANDIDATES = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean)
export async function launch() {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p))
  if (!executablePath) throw new Error('Chrome not found – install Google Chrome or set CHROME_PATH')
  return puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] })
}
