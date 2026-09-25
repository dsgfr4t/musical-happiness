# OctoBrowser.su – instrukcja użytkownika

## 1. Pierwsze uruchomienie

Kreator pojawia się tylko raz: **język** (English/Polski), **folder danych** (domyślnie `Dokumenty\OctoSuite`; unikaj folderów synchronizowanych z chmurą dla profili szyfrowanych) oraz **ochrona klucza**:

* **Konto Windows (zalecane)** – klucz chroni DPAPI; brak dodatkowego hasła;
* **Hasło główne** – wymagane przy starcie i po auto-blokadzie; nie da się go odzyskać.

Opcje prywatności: sprawdzanie publicznego IP (domyślnie wyłączone), automatyczne aktualizacje (domyślnie włączone).

## 2. Profile

Okno **Profile i ustawienia** (menedżer) pokazuje wszystkie profile. Domyślnie tworzone są: Osobisty, Praca, Prywatny, Testowy, Tymczasowy, Tor; możesz dodać **Własny**.

| Typ | Poziom | Domyślnie |
|---|---|---|
| Osobisty | Standard | historia i przywracanie sesji włączone, kamera/mikrofon na żądanie |
| Praca | Standard | j.w., osobne logowania |
| Prywatny | Ścisły | tryb ograniczony, schowek tylko do zapisu, bez historii |
| Testowy | Standard | tryb ograniczony, łatwy reset |
| Tymczasowy | Ścisły | dane usuwane po zamknięciu, schowek tylko do zapisu |
| Tor | Tor | otwiera oficjalny Tor Browser (instalowany osobno z torproject.org), bez dodatków |
| Własny | Standard | pełna konfiguracja |

Akcje: **utwórz, edytuj, duplikuj** (opcjonalnie z danymi), **importuj, eksportuj** (zawsze zaszyfrowane hasłem eksportu), **szyfruj/wyłącz szyfrowanie**, **zablokuj wszystkie**, **resetuj** (usuwa ciasteczka, dane stron, historię i sesję – zostają ustawienia i zakładki), **usuń**. Każdy profil ma własne dane, ustawienia prywatności, sieć (proxy/DNS), piaskownicę i wbudowane dodatki.

Profile działają jako osobne procesy – można mieć otwarte kilka profili jednocześnie. Operacje na plikach profilu (reset, eksport, szyfrowanie) wymagają jego zamknięcia.

## 3. Poziomy ochrony

Wartości są **stałe dla profilu** – nic nie jest losowane przy uruchomieniu.

| Ustawienie | Standard | Ścisły |
|---|---|---|
| Reklamy / elementy śledzące | blokowane | blokowane |
| Tylko HTTPS | tak (ostrzeżenie przed HTTP) | tak |
| Ciasteczka stron trzecich | blokowane | blokowane |
| Parametry śledzące w linkach | usuwane | usuwane |
| Śledzenie przez przekierowania | – | ograniczane, potwierdzanie przekierowań między witrynami |
| WebRTC | tylko publiczny interfejs | tylko przez proxy |
| Odczyt canvas | dozwolony | blokowany |
| WebGL | dozwolony | wyłączony |
| Szczegóły sprzętu | rzeczywiste | typowe stałe wartości |
| Autoodtwarzanie z dźwiękiem | blokowane | blokowane |
| Wyskakujące okna | blokowane | blokowane |
| Odsyłacz do innych witryn | pełny | tylko domena |
| Global Privacy Control | wysyłany | wysyłany |
| Lokalizacja / powiadomienia | pytaj | blokuj |
| Czyszczenie przy zamknięciu | – | tak |

**Tor** – strony otwierają się w oficjalnym Tor Browser. OctoBrowser nie udaje Tora.

Każde ustawienie można nadpisać w edytorze profilu (zakładka Prywatność). Panel prywatności pokazuje ostrzeżenia o niespójnych kombinacjach (np. proxy + WebRTC poza proxy).

## 4. Okno przeglądarki

* pasek kart (poziomy lub pionowy), wyszukiwanie kart (Ctrl+E), przypinanie, grupy (etykieta), usypianie nieaktywnych kart;
* **widok podzielony** (dwie karty obok siebie), **obraz w obrazie**;
* pasek adresu z ikoną stanu połączenia, liczbą zablokowanych elementów, zakładkami;
* plakietka profilu (kolor, typ, poziom ochrony, szyfrowanie, izolacja).

### Panele

| Panel | Zawartość |
|---|---|
| **Ruch i sieć** | tryb połączenia, proxy, VPN (heurystyka), Tor, DNS/DoH, publiczny IP (za zgodą), WebRTC, certyfikat strony, liczba żądań, zablokowane reklamy/trackery/skrypty/ciasteczka, usunięte parametry, przełączenia na HTTPS, domeny kontaktowane przez kartę (tylko w pamięci), dane wysłane/odebrane |
| **Dźwięk** | karty odtwarzające dźwięk, głośność karty, wyciszanie karty/profilu, urządzenie wyjściowe (korektora nie ma) |
| **Prywatność** | poziom, stan wszystkich zabezpieczeń, ostrzeżenia spójności, czyszczenie danych witryny, „Sprawdź w OctoDetect.su”, „Otwórz w Piaskownicy Windows” |
| **Wbudowane dodatki** | metadane (wersja, licencja, źródło, uprawnienia, integralność, status) |
| **Pobrane / Zakładki / Historia / Aktualizacje / Skróty** | jak w nazwie |

## 5. Piaskownica i tryb ograniczony

Przed uruchomieniem profilu z izolacją pojawia się podsumowanie: tryb, kamera, mikrofon, urządzenia USB, schowek, udostępnione foldery, trasa sieci, VPN, brak uprawnień administratora.

* **Windows Sandbox** – wymaga Windows Pro/Enterprise/Education i włączonej funkcji „Piaskownica systemu Windows”;
* gdy niedostępna, używany jest **tryb ograniczony** (blokada kamery/mikrofonu/USB, schowek tylko do zapisu, pobieranie tylko do folderu profilu).

## 6. Sieć per profil

Tryb: systemowy / bezpośredni / proxy (`http`, `https`, `socks4`, `socks5`), lista wyjątków, dane logowania proxy (przechowywane zaszyfrowane). DNS: systemowy lub DNS przez HTTPS (Quad9, Cloudflare, Mullvad, własny adres `https://`).

## 7. Skróty klawiszowe

| Skrót | Akcja |
|---|---|
| Ctrl+T / Ctrl+W (Ctrl+F4) | nowa / zamknij kartę |
| Ctrl+Shift+T | przywróć zamkniętą kartę |
| Ctrl+Tab / Ctrl+Shift+Tab | następna / poprzednia karta |
| Ctrl+L | pasek adresu |
| Ctrl+R, F5 / Ctrl+Shift+R, Shift+F5 | odśwież / odśwież bez cache |
| Ctrl+F | znajdź na stronie |
| Ctrl+E | szukaj kart |
| Ctrl+D | dodaj zakładkę |
| Ctrl+J | pobrane |
| Ctrl+Shift+O | zakładki |
| Ctrl+Shift+N | panel ruchu |
| Ctrl+Shift+P | panel prywatności |
| Ctrl+Shift+A | panel dźwięku |
| Ctrl+M / Ctrl+Shift+M | wycisz kartę / profil |
| Ctrl+Shift+↑ / ↓ | głośność karty |
| Ctrl+Shift+S | widok podzielony |
| Alt+P | obraz w obrazie |
| Ctrl+Shift+U | przełącz profil |
| Ctrl+ + / Ctrl+ − | powiększ / pomniejsz |
| Ctrl+P | drukuj |
| F11 | pełny ekran |
| F12, Ctrl+Shift+I | narzędzia deweloperskie |

## 8. Bezpieczeństwo, kopie, logi

* **Bezpieczeństwo**:
  * aktualna ochrona klucza – „Konto Windows (DPAPI) – bez hasła” albo „Hasło główne”;
  * **Ustaw / zmień / usuń hasło główne** (minimum 10 znaków; zmiana hasła nie zmienia klucza, więc zaszyfrowane dane pozostają czytelne);
  * **Gdzie przechowywać sekrety** – zaszyfrowany plik w folderze danych (domyślnie, jest w kopiach) albo Menedżer poświadczeń Windows (ten użytkownik, bez kopii);
  * auto-blokada: po bezczynności zamykane są zaszyfrowane profile, a przy haśle głównym blokowany jest także lokalny klucz (aplikacja pyta o hasło ponownie);
  * listy filtrów i data ich ostatniej aktualizacji;
  * szczegóły: [encryption.md](encryption.md);
* **Kopie zapasowe**: tworzone automatycznie przed każdą zmianą konfiguracji; przywracanie jednym kliknięciem;
* **Logi**: tryb standardowy/diagnostyczny, „Otwórz folder logów”, **„Usuń logi”**;
* **O programie**: wersja, lista połączeń sieciowych, telemetria wyłączona, licencje.

## 9. Ograniczenia

Patrz [feature-matrix.md](feature-matrix.md) – m.in. brak korektora dźwięku, brak obsługi zewnętrznych rozszerzeń WebExtensions (funkcje wbudowane), okna wyskakujące otwierane jako karty bez `window.opener`. Pełna, uczciwa lista: [known-limitations.md](known-limitations.md).
