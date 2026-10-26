# Ma Cave à Vin

Prywatna aplikacja PWA do zarządzania piwnicą wina, z interfejsem po francusku (styl 'Aubergine et or rose').

- Główna baza: arkusz Google Sheets 'Ma Cave à Vin - base' (zakładka 'Vins', 29 kolumn).
- Telefon: kopia robocza w IndexedDB, pełna praca offline, kolejka zmian.
- Uzupełnianie danych: Claude w czacie, komendą 'Mets à jour ma cave'.
- Maturité: ocena 1-5 liczona z okna picia (trzy równe części okna).

## Pliki

| Plik | Rola |
| --- | --- |
| index.html, app.css | Szkielet i wygląd |
| js/app.js | Ekrany i obsługa użytkownika |
| js/logic.js | Model danych, Maturité, sortowanie, statystyki |
| js/db.js | Lokalna baza (IndexedDB) |
| js/sync.js | Synchronizacja z Google Sheets i Drive |
| config.js | Identyfikatory Google |
| sw.js, manifest.webmanifest | Instalacja i praca offline |
| vendor/ | Biblioteki eksportu (SheetJS, JSZip) |

Instalacja: INSTALLATION.md.
