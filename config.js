// Konfiguracja połączenia z Google. Trzy pierwsze wartości pochodzą z Google Cloud Console
// (patrz INSTALLATION.md). Dopóki są puste, aplikacja działa w trybie lokalnym, bez synchronizacji.
window.CAVE_CONFIG = {
  googleClientId: '1050990960866-6srs5rvfdgjo1qho2b2938l3dsftqrdd.apps.googleusercontent.com',   // ID klienta OAuth, np. 1234-abc.apps.googleusercontent.com
  googleApiKey: 'AIzaSyBPk2BcuJVJmrVKqdb3sXZRhKV8MC3gDAE',     // Klucz API (dla selektora plików Google)
  googleAppId: '1050990960866',      // Numer projektu Google Cloud (same cyfry)
  spreadsheetId: '1qPfbjPr2aVxFD1XVB8C9ZNOrdMrRaXnyNt91qeHbBwE', // Ma Cave à Vin - base
  photosFolderId: '1qCJBo0MX49M0-olbP2Ooq2mWfFNcrNpw'            // folder Photos
};
