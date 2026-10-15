// Pega aquí la configuración de tu app web (Firebase Console > Configuración del proyecto > Tus apps).
// Estas claves SON públicas por diseño; la seguridad la dan las reglas de firestore.rules.
window.firebaseConfig = {
  apiKey: "REEMPLAZA",
  authDomain: "REEMPLAZA.firebaseapp.com",
  projectId: "REEMPLAZA",
  storageBucket: "REEMPLAZA.appspot.com",
  messagingSenderId: "REEMPLAZA",
  appId: "REEMPLAZA"
};
window.configurado = !window.firebaseConfig.apiKey.startsWith("REEMPLAZA");
