# Changelog / Historia zmian

## 0.1.0 – wersja wstępna (niewydana)

**PL**
- Pierwsza wersja OctoBrowser.su i OctoDetect.su dla Windows 10/11.
- Profile (osobisty, praca, prywatny, testowy, tymczasowy, Tor, własny) w osobnych procesach, szyfrowanie AES-256-GCM, klucz lokalny chroniony DPAPI.
- **Bez hasła głównego**: aplikacja startuje bez pytania o cokolwiek, a klucza, którego Windows nie potrafi już odszyfrować (DPAPI), nie blokuje startu – trafia do kwarantanny w `backups\unreadable-<data>`, powstaje nowy (`--reset-keyring` wymusza to ręcznie).
- **12-wyrazowa fraza (BIP-39)** szyfruje profil i pozwala go odzyskać: pokazywana raz przy włączaniu szyfrowania, wymagana przy otwieraniu zaszyfrowanego profilu oraz przy eksporcie i imporcie.
- Interfejs obu aplikacji przerobiony na czarno-biały i minimalistyczny: ikony zamiast barw znaczeniowych, wyraźne odstępy między informacjami i polami.
- Poziomy ochrony Standard / Ścisły / Tor (wartości stałe, bez losowania), blokowanie reklam i trackerów, tylko HTTPS, usuwanie parametrów śledzących.
- Panele: ruch i sieć, dźwięk, prywatność; widok podzielony, obraz w obrazie, grupy i usypianie kart.
- OctoDetect.su: lokalny audyt prywatności z poziomami ryzyka, zaszyfrowane raporty, eksport JSON/HTML.
- Aktualizacje podpisane Ed25519 + SHA-256, rollback; instalator Inno Setup; skrypty serwisowe.
- Interfejs po polsku i angielsku; brak telemetrii.
- `install.bat` / `setup.bat` – autoinstalacja wymagań (Node.js, git przez winget, `npm ci`, `npm run build`) i `run.bat` – uruchomienie obu aplikacji bez okna konsoli.
- `github-update.bat` – aktualizacja prosto z GitHuba (wydanie albo `git pull` + `npm ci` + `npm run build` w kopii deweloperskiej) oraz `start-all.bat` – aktualizacja i uruchomienie obu aplikacji jednym plikiem.

**EN**
- First version of OctoBrowser.su and OctoDetect.su for Windows 10/11.
- Profiles in separate processes, AES-256-GCM encryption, local key protected by DPAPI.
- **No master password**: the app starts without asking for anything, and a key Windows can no longer decrypt (DPAPI) never blocks the start - it is quarantined in `backups\unreadable-<date>` and replaced (`--reset-keyring` forces this manually).
- **12-word passphrase (BIP-39)** encrypts a profile and recovers it: shown once when encryption is enabled, required to open an encrypted profile and to export or import one.
- Both UIs reworked to a black-and-white, minimal design: icons instead of meaningful colours, clear spacing between information and input fields.
- Standard / Strict / Tor protection levels (fixed values, no randomisation), ad and tracker blocking, HTTPS-only, tracking-parameter removal.
- Traffic, audio and privacy panels; split view, picture-in-picture, tab groups and sleeping tabs.
- OctoDetect.su: local privacy audit with risk levels, encrypted reports, JSON/HTML export.
- Ed25519 + SHA-256 signed updates with rollback; Inno Setup installer; maintenance scripts.
- Polish and English UI; no telemetry.
- `install.bat` / `setup.bat` - automatic setup of all prerequisites (Node.js, git via winget, `npm ci`, `npm run build`) and `run.bat` - starts both apps with no console window.
- `github-update.bat` - update straight from GitHub (release install, or `git pull` + `npm ci` + `npm run build` in a development checkout) and `start-all.bat` - update and start both apps from a single file.
