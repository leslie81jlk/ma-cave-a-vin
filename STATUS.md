# Ma Cave à Vin - STATUS

Ostatnia aktualizacja: 2026-10-31 · wersja aplikacji: 1.7.0

Ten plik Claude czyta na początku każdej sesji i aktualizuje na jej końcu. Nowa rozmowa: 'Przeczytaj STATUS.md w ma-cave-a-vin i jedziemy'.

## Stan w jednym zdaniu

Aplikacja działa na telefonie (GitHub Pages), baza jest w prywatnym repo, wina są wprowadzane, a Claude uzupełnia dane w czacie komendą 'Mets à jour ma cave'.

## Gdzie co jest

| Element | Miejsce |
| --- | --- |
| Kod aplikacji | repo leslie81jlk/ma-cave-a-vin (publiczne, GitHub Pages) |
| Baza danych | cave.json w prywatnym repo leslie81jlk/ma-cave-photos |
| Zdjęcia etykiet | ma-cave-photos/scans/ (zdjęcia oryginalne wysyłane do import/) |
| Kopia robocza | IndexedDB w telefonie, praca offline, kolejka zmian |
| Kopia zapasowa | eksport z Paramètres; Google Drive zaakceptowany jako miejsce kopii |
| Opis plików i instalacja | README.md, INSTALLATION.md |

## Zasady stałe (decyzje Leslie)

- Interfejs po francusku, ciemny motyw 'E' (aubergine i or rose) na wszystkich ekranach.
- Przyciski sortowania mogą zawijać się do dwóch rzędów, nigdy przewijanie.
- Kategoria koloru 'bulles' dla szampana, crémant i innych win musujących.
- Ceny rynkowe tylko ze sklepów internetowych z UE (bez USA, Kanady itd., bo podatki zniekształcają ceny). Osobne pole ceny rynkowej, w statystykach szacowana wartość piwnicy.
- Cena zakupu: pole opcjonalne na karcie wina.
- Bez płatnego API AI w aplikacji. Uzupełnianie danych i roczny przegląd Maturité robi Claude w czacie.
- Maturité: ocena 1-5 z okna picia (trzy równe części okna), progi proporcjonalne, przegląd raz w roku.
- Claude może poprawiać błędy wprowadzone ręcznie przy uzupełnianiu, z wyjątkiem pól w 'locked_fields' (poprawionych ręcznie w 'Modifier').
- Duplikaty (to samo wino sfotografowane osobno) Claude łączy w jeden rekord, sumując butelki.
- Wino można dodać samym zdjęciem etykiety, resztę uzupełnia Claude.
- Claude pushuje nowe funkcje bezpośrednio do repo ma-cave-a-vin; przy każdej wersji podbija APP_VERSION w js/app.js i VERSION w sw.js.

## Historia wersji

- 1.7.0 - ocena Vivino na karcie wina
- 1.6.0 - cena rynkowa na karcie i szacowana wartość piwnicy
- 1.5.0 - piwnica grupowana po regionach, sortowanie Appellation i Producteur, ekran 'À ouvrir bientôt'
- 1.4.x - inwentaryzacja ze zdjęć (import/), nowy układ karty
- 1.3.0 - powiększona etykieta (przód i tył, zoom)
- 1.2.0 - zakładki po krajach (Francja pierwsza)
- 1.1.0 - baza w cave.json na GitHubie zamiast Google Sheets (Sheets przestało synchronizować)
- 1.0.x - dodawanie zdjęciem, wiele win naraz, zdjęcia dla Claude w prywatnym repo

## Odłożone na V2

- Pole 'emplacement' (miejsce butelki w piwnicy).
- Szersze oceny zewnętrzne poza Vivino, gdy baza będzie pełna.

## Znane długi techniczne

- INSTALLATION.md nadal opisuje konfigurację Google Cloud z wersji 1.0.x; do skrócenia.
- config.js nieużywany od 1.1.0, zostawiony dla zgodności.

## Następny krok

Do ustalenia przez Leslie na początku kolejnej sesji. Kandydaci: dokończenie wprowadzania win i pierwsze pełne 'Mets à jour ma cave', porządki w INSTALLATION.md.

## Dziennik sesji

- 2026-10-31 - utworzono STATUS.md.
