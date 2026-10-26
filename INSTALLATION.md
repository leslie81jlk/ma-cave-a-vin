# Ma Cave à Vin - instalacja

Aplikacja działa od razu w trybie lokalnym: dane zapisują się w telefonie, a kopię robisz przyciskiem 'Exporter' w Paramètres. Synchronizacja z arkuszem Google wymaga trzech kroków poniżej, razem około 20 minut.

## 1. Hosting na GitHub Pages

1. Na github.com utwórz nowe repozytorium, np. 'ma-cave-a-vin'. Darmowe GitHub Pages wymaga repozytorium publicznego.
2. Wgraj wszystkie pliki z archiwum (Add file > Upload files), zachowując foldery 'js', 'icons' i 'vendor'.
3. Settings > Pages > Branch: 'main', folder '/ (root)' > Save.
4. Po około minucie aplikacja jest pod adresem 'https://<twoja-nazwa>.github.io/ma-cave-a-vin/'.

Kod nie zawiera Twoich danych. Kolekcja jest tylko w telefonie i w Twoim prywatnym arkuszu. Identyfikator klienta OAuth jest z założenia publiczny, a klucz API ograniczysz do adresu aplikacji w kroku 2.5.

## 2. Konfiguracja Google Cloud

Zaloguj się na to samo konto Google, na którym jest arkusz 'Ma Cave à Vin - base'.

1. Wejdź na console.cloud.google.com i utwórz projekt 'Ma Cave a Vin'.
2. APIs & Services > Library: włącz 'Google Sheets API', 'Google Drive API' i 'Google Picker API'.
3. Google Auth Platform (ekran zgody OAuth):
    - Branding: nazwa 'Ma Cave à Vin', Twój e-mail jako adres wsparcia.
    - Audience: typ 'External', status 'Testing', w 'Test users' dodaj swój adres e-mail.
    - Data Access: dodaj zakres '.../auth/drive.file'.
4. Clients > Create client > typ 'Web application'. W 'Authorized JavaScript origins' wpisz 'https://<twoja-nazwa>.github.io' (bez ścieżki). Skopiuj 'Client ID'.
5. APIs & Services > Credentials > Create credentials > API key. W ustawieniach klucza:
    - Application restrictions: 'Websites', adres 'https://<twoja-nazwa>.github.io/*'.
    - API restrictions: tylko 'Google Picker API'.
    - Skopiuj klucz.
6. Na stronie głównej projektu (Dashboard) skopiuj 'Project number' (same cyfry).
7. Otwórz plik 'config.js' i wpisz trzy wartości: 'googleClientId', 'googleApiKey', 'googleAppId'. Wgraj zmieniony plik do repozytorium.

## 3. Instalacja na telefonie

1. Otwórz adres aplikacji w Chrome na Androidzie.
2. Menu (trzy kropki) > 'Zainstaluj aplikację' lub 'Dodaj do ekranu głównego'.
3. W aplikacji: Paramètres > 'Connecter Google et choisir la base'.
4. Zaloguj się i zaakceptuj dostęp. Google pokaże ostrzeżenie o niezweryfikowanej aplikacji: to normalne dla aplikacji prywatnej w trybie testowym ('Zaawansowane' > 'Przejdź do Ma Cave à Vin').
5. W selektorze plików zaznacz oba elementy: 'Ma Cave à Vin - base' i folder 'Photos', potem 'Select'.

Aplikacja widzi wyłącznie te dwa elementy, nic więcej na Twoim Drive.

## Jak działa synchronizacja

- Po każdej zmianie aplikacja synchronizuje się sama, jeśli jest internet i ważne logowanie.
- Logowanie Google wygasa po około godzinie. Wtedy na ekranie głównym pojawia się 'Touchez pour synchroniser': jedno dotknięcie odnawia dostęp.
- Bez internetu zmiany czekają w kolejce ('Non synchronisé') i wysyłają się przy następnej synchronizacji.
- Zdjęcie ze stanu trafia do arkusza jako różnica ('-2'), więc równoległe zmiany w arkuszu się nie gubią.
- Pola Claude poprawione ręcznie w 'Modifier' trafiają do 'locked_fields' i Claude ich nie nadpisuje.

## Test przed codziennym użyciem

1. Dodaj jedno wino ze zdjęciem i sprawdź, czy pojawiło się w arkuszu i w folderze 'Photos'.
2. Włącz tryb samolotowy, zdejmij butelkę ze stanu, wyłącz tryb samolotowy i sprawdź arkusz.
3. Zrób eksport w Paramètres i otwórz plik .zip.
4. Przywróć wcześniejszą wersję arkusza (Plik > Historia wersji), zsynchronizuj i sprawdź, czy telefon pokazuje przywrócony stan.

## Aktualizacje aplikacji

Po wgraniu nowych plików zmień numer 'VERSION' w 'sw.js', żeby telefon pobrał nową wersję. Aplikacja odświeży się przy drugim uruchomieniu.
