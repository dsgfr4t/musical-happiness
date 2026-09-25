# Rozwiązywanie problemów

| Objaw | Co zrobić |
|---|---|
| Aplikacja nie startuje po aktualizacji | `scripts\repair.bat`; w razie potrzeby „Przywróć poprzednią wersję” lub ponowna instalacja poprzedniego instalatora z `<dane>\OctoBrowser\updater\installed` |
| „Konfiguracja uszkodzona – przywrócono kopię” | automatyczne przywrócenie ostatniej poprawnej kopii; starsze kopie: Profile i ustawienia → Kopie zapasowe |
| „Problem z ochroną klucza – Windows nie mógł odszyfrować lokalnego klucza (DPAPI)” | to już **nie blokuje startu**: w oknie wybierz „Utwórz nowy klucz i kontynuuj”. Stary klucz i `secrets.bin` trafiają do `backups\unreadable-<data>` (nic nie jest kasowane). Trzeba ponownie wpisać hasła proxy; profile zaszyfrowane otwierasz ich 12 słowami. To samo wymusza uruchomienie z `--reset-keyring` |
| Zgubiona 12-wyrazowa fraza profilu | frazy nie da się odzyskać – nie jest nigdzie zapisana. Dane tego profilu pozostaną zaszyfrowane; profil można zresetować `scripts\reset-profile.bat` i zacząć od nowa |
| „Ta fraza nie otwiera tego profilu” | sprawdź kolejność słów i literówki (każde słowo jest jednym z 2048 słów listy BIP-39); wielkość liter i nadmiarowe spacje nie mają znaczenia |
| Nie da się zresetować/wyeksportować profilu | zamknij okna tego profilu (pliki są zablokowane przez działający proces) |
| „Piaskownica Windows niedostępna” | wymaga Windows Pro/Enterprise/Education i włączenia funkcji „Piaskownica systemu Windows” (`optionalfeatures.exe`) + wirtualizacji w BIOS; w przeciwnym razie używany jest tryb ograniczony |
| Profil Tor nie otwiera się | zainstaluj Tor Browser z https://www.torproject.org; jest wykrywany automatycznie, a jeśli nie – w oknie „Nie znaleziono Tor Browser” wskaż plik wykonywalny |
| Strona nie działa w poziomie Ścisłym | WebGL i odczyt canvas są w poziomie Ścisłym wyłączone; zmień pojedyncze ustawienie w edytorze profilu (zakładka Prywatność) lub użyj osobnego profilu Standard dla tej witryny (wyjątków per witryna nie ma) |
| Strona HTTP blokowana | ekran „Ta witryna nie obsługuje HTTPS” ma przycisk „Przejdź do … przez HTTP” |
| „Aktualizacje nie są skonfigurowane” | build bez klucza publicznego – zainstaluj oficjalne wydanie |
| `update.bat`: „Nie można zweryfikować podpisu” | zainstalowana aplikacja jest uszkodzona lub brak klucza – uruchom `repair.bat` albo pobierz instalator ręcznie z oficjalnego GitHub Releases i użyj `install.bat` |
| Polskie znaki w konsoli skryptów | skrypty przełączają konsolę na UTF-8; w starym `conhost` zmień czcionkę na Consolas/Cascadia |

## Logi

* aplikacje: `<folder danych>\OctoBrowser\logs`, `<folder danych>\OctoDetect\logs`;
* skrypty: `<folder danych>\OctoBrowser\logs\scripts-RRRRMMDD.log`;
* tryb diagnostyczny (Ustawienia → Logi) dodaje szczegóły techniczne i sam wyłącza się po 24 h;
* logi nie zawierają haseł, kluczy, tokenów ani adresów stron, ale przed udostępnieniem je przejrzyj;
* „Usuń logi” usuwa wszystkie pliki logów aplikacji.
