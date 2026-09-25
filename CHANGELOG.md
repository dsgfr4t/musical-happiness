# Changelog / Historia zmian

## 0.1.0 – wersja wstępna (niewydana)

**PL – rozszerzenie ochrony klucza**
- **Opcjonalne hasło główne**: kreator pierwszego uruchomienia (krok 3) pozwala wybrać ochronę klucza danymi konta Windows (DPAPI, bez hasła) albo hasłem głównym (Argon2id → AES-256-GCM). Hasło można później ustawić, zmienić lub usunąć w Ustawieniach → Bezpieczeństwo obu aplikacji; zmiana hasła nie zmienia klucza danych, więc wszystkie zaszyfrowane dane pozostają czytelne.
- **Okno hasła głównego** (`packages/shell/src/unlock.ts`, `renderer/unlock.html`): ponowne odblokowanie przy starcie, po auto-blokadzie i po zablokowaniu ekranu; 3 nieudane próby = komunikat z możliwością rozpoczęcia z nowym kluczem; „Nie pamiętam hasła” przenosi stary klucz do `backups\unreadable-<data>` (nic nie jest usuwane); anulowanie kończy pracę aplikacji.
- **Auto-blokada rozszerzona o klucz lokalny**: przy haśle głównym po czasie bezczynności blokowany jest także klucz danych (wcześniej tylko zaszyfrowane profile).
- **Menedżer poświadczeń Windows** jako opcjonalne miejsce przechowywania sekretów (np. haseł proxy): `packages/core/src/credman.ts` (CredWriteW/CredReadW/CredDeleteW przez PowerShella, JSON na stdin/stdout – bez sekretów w wierszu poleceń), przełącznik w Ustawieniach → Bezpieczeństwo, `config\credman-index.json` przechowuje wyłącznie nazwy.
- **Nowa dokumentacja**: `docs/encryption.md` (instrukcja szyfrowania), `docs/threat-model.md` (model zagrożeń), `docs/known-limitations.md`, `docs/testing.md` (mapa testów bezpieczeństwa), `docs/release-checklist.md` (checklista przed publikacją).
- Testy: +15 przypadków (hasło główne, Menedżer poświadczeń, router sekretów) – łącznie 130.

**EN – key protection extension**
- **Optional master password**: the first-run wizard (step 3) now offers Windows-account (DPAPI, no password) or master-password protection (Argon2id → AES-256-GCM). It can be set, changed and removed later in Settings → Security of either app; changing it re-wraps the same data key, so all encrypted data stays readable.
- **Master-password window** (`packages/shell/src/unlock.ts`, `renderer/unlock.html`): re-unlock on start, after auto-lock and after the screen locks; 3 wrong attempts offer starting with a new key; "I do not remember the password" quarantines the old key in `backups\unreadable-<date>` (nothing is deleted); cancelling quits the app.
- **Auto-lock extended to the local key**: with a master password the data key is locked after the idle time as well (previously only encrypted profiles).
- **Windows Credential Manager** as an optional secret store (e.g. proxy passwords): `packages/core/src/credman.ts` (CredWriteW/CredReadW/CredDeleteW via PowerShell, JSON on stdin/stdout - no secrets on a command line), switch in Settings → Security, `config\credman-index.json` holds names only.
- **New documentation**: `docs/encryption.md`, `docs/threat-model.md`, `docs/known-limitations.md`, `docs/testing.md`, `docs/release-checklist.md`.
- Tests: +15 cases (master password, Credential Manager, secret router) - 130 in total.

**PL – poprawki interfejsu**
- **Naprawione niewidoczne etykiety**: przyciski „Uruchom”, „Nowy profil” i inne klasy `btn primary` miały biały tekst na białym tle (tekst i ikona były niewidoczne), tak samo aktywny przycisk poziomu ochrony (`seg button.on`) i numer aktywnego kroku w kreatorze. Teraz tekst na białym tle jest czarny.
- **Karty profili**: pod nazwą profilu nie powtarza się już jego typ („Personal / Personal”, „Work / Work”…) – zamiast tego krótki opis roli profilu (`profile.kindTag.*`).
- **Proxy systemowe**: etykieta trybu sieci brzmi teraz „Proxy systemowe” / „System proxy” zamiast „Ustawienia systemowe”, które wyglądało jak odsyłacz do ustawień.
- **Monochromatyczny interfejs**: usunięte pozostałości barw (zielony/amber/różowy) z OctoDetect i OctoBrowser; stan zawsze opisują ikona, waga tekstu i podpis.
- **Nowy test UI** (`packages/shell/test/ui-contrast.test.ts`): sprawdza kontrast każdej reguły `background` + `color` (≥ 3:1) i zakazuje barw w arkuszach stylów – regresja „białe na białym” nie przejdzie już przez `npm test`.
- Testy: +3 przypadki – łącznie 133.

**EN – UI fixes**
- **Invisible labels fixed**: `.btn primary` buttons ("Launch", "New profile", …) had white text on a white background - label and icon were invisible; the same applied to the active protection-level segment and to the active step number in the first-run wizard. Text on white is now black.
- **Profile cards**: the profile type no longer repeats the profile name ("Personal / Personal", "Work / Work" …); a short role description (`profile.kindTag.*`) is shown instead.
- **System proxy**: the network mode now reads "System proxy" / "Proxy systemowe" instead of "System settings", which looked like a link to the settings page.
- **Monochrome UI**: leftover hues (green/amber/rose) removed from OctoDetect and OctoBrowser; state is always carried by icon, weight and a text label.
- **New UI test** (`packages/shell/test/ui-contrast.test.ts`): checks the contrast of every `background` + `color` rule (>= 3:1) and forbids hues in the stylesheets, so "white on white" cannot regress through `npm test` again.
- Tests: +3 cases - 133 in total.

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
