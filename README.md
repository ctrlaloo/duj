# Invitación Cenita #18 — guía rápida

Estructura: HTML/CSS/JS puro + Firebase (Auth + Firestore + Hosting). Elegí esto porque no necesita compilar nada y se publica con un comando.
Requiere servidor (no abrir con doble clic): `npx serve .` para probar local.

## 1. Firebase
1. console.firebase.google.com → Crear proyecto.
2. Compilación > **Authentication** > Comenzar > Método de acceso: activa **Anónimo** y **Correo/contraseña**.
3. Compilación > **Firestore Database** > Crear base de datos (modo producción).
4. Configuración del proyecto > Tus apps > Web (`</>`) → copia la config en `firebase-config.js`.
5. Authentication > Configuración > Dominios autorizados: añade tu dominio final (Hosting lo agrega solo).

## 2. Cuenta admin
Authentication > Usuarios > Agregar usuario (tu correo + contraseña larga). Copia su **UID** y pégalo en `firestore.rules` (`REEMPLAZA_UID_ADMIN`). Cambiar contraseña: Authentication > Usuarios > ⋮ > Restablecer contraseña (te llega un correo).

## 3. Publicar
```
npm i -g firebase-tools && firebase login && firebase init   # elige Firestore + Hosting, conserva firebase.json y las reglas
firebase deploy
```
Panel: `https://TU-PROYECTO.web.app/admin` (la seguridad la dan Auth + reglas, no la URL). GitHub Pages sirve el sitio, pero por sí solo no protege nada: las reglas viven en Firebase.

## 4. Personalizar
Textos, fecha, dirección, dress code, mapa → directo en `index.html` (ya no existe config.js). Fotos → reemplaza los archivos de `assets/img/` (portada.png, outfit-1.jpg, outfit-2.jpg). 

## 5. Probar
- Abre la invitación, confirma: debe aparecer en Firestore > rsvps y en /admin.
- Recarga: tu respuesta vuelve precargada y puedes corregirla (en el mismo navegador).
- Abre /admin en una ventana de incógnito: solo ves el login. En Firestore, un invitado no puede listar `rsvps` (las reglas lo rechazan).
- Compartir: manda el enlace `https://TU-PROYECTO.web.app` por WhatsApp.
