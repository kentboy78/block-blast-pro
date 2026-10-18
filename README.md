# Block Blast+ Pro (iOS Standalone Web App)

An enhanced, ad-free version of **Block Blast** built specifically to run as a full-screen iPhone Home Screen Web App (PWA) or desktop/mobile browser game.

## ✨ What Makes Block Blast+ Pro Better?

1. **Zero Ads & Instant Restarts** — No 30-second video interruptions between games.
2. **Gold Line-Clear Preview** — As you drag a piece over the 8×8 board, any rows or columns that will complete pulse bright gold *before* you release your finger.
3. **Smart Fair-Deal RNG ("Mercy Deal")** — Evaluates the current 8×8 board when dealing a new tray of 3 pieces so you aren't unfairly ended by impossible 3×3 deals.
4. **Hold Vault (`HOLD`)** — Drag any tricky piece into the Hold Vault on the right to save it for later and swap when needed.
5. **Tactical Power-Ups (Earned by Playing, Not Paid)** — Clearing lines and building combos charges your **⚡ Energy** bar:
   - **Rotate (`1⚡`)**: Rotate all pieces by 90° clockwise.
   - **Blast (`2⚡`)**: Vaporize any 3×3 zone on the board (also available as an emergency rescue if you run out of space!).
   - **Refill (`2⚡`)**: Deal 3 fresh solvable pieces.
   - **Undo (`Free` once per tray)**: Undo an accidental drop.
6. **3 Game Modes** — **Classic Pro**, **Crystal Gem Rush** (collect 12 embedded gems), and **Pure Classic** (traditional rules).

---

## 📲 How to Install as an iPhone App Shortcut

### Option A: Over Local Wi-Fi (Quickest Test)
1. Start a local static server from `/Users/chriskent/.gemini/antigravity/scratch/block-blast-pro`:
   ```bash
   python3 -m http.server 8080 --bind 0.0.0.0
   ```
2. Find your Mac's local Wi-Fi IP address (`ipconfig getifaddr en0` on macOS, e.g. `192.168.1.x`).
3. On your iPhone (connected to the same Wi-Fi), open **Safari** and visit `http://<YOUR_MAC_IP>:8080`.
4. Tap the **Share** button (`⬆️`) at the bottom of Safari → tap **Add to Home Screen** (`➕`) → tap **Add**.
5. Launch **Block Blast+** from your iPhone Home Screen! It opens in full-screen standalone mode without Safari's address bar or toolbars, complete with custom iOS app icon and offline caching.

### Option B: Free Static Hosting (Play Anywhere)
Drop the `block-blast-pro` folder onto **GitHub Pages**, **Cloudflare Pages**, **Netlify Drop**, or **Firebase Hosting**, open the HTTPS URL in iPhone Safari, and tap **Share → Add to Home Screen**.
