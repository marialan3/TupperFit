# 🚀 Cómo publicar TupperFit (paso a paso, sin saber programar)

Al final tendrás una dirección web (`https://marialan3.github.io/TupperFit/`) que podrás abrir
desde el ordenador **y** desde el móvil, e instalar como si fuera una app.
Es gratis y no necesitas instalar nada.

> ⚠️ GitHub Pages gratuito exige que el repositorio sea **público**. Tus datos personales
> (peso, comidas…) **no** se suben nunca: se guardan solo en tu móvil/ordenador.
> Lo único público es el código de la app.

## Paso 1 · Subir los archivos a GitHub

1. Entra en <https://github.com/marialan3/TupperFit> e inicia sesión.
2. Pulsa **Add file → Upload files**.
3. Abre la carpeta `TupperFit` de tu ordenador y **arrastra su CONTENIDO** (no la carpeta entera)
   a la ventana del navegador: `index.html`, `app.js`, `styles.css`, `sw.js`,
   `manifest.webmanifest`, la carpeta `icons` y estos `.md`.
   - ✅ Correcto: `index.html` aparece directamente al entrar en el repositorio.
   - ❌ Incorrecto: tener que abrir una carpeta `TupperFit` dentro del repositorio para ver `index.html`.
4. Abajo, pulsa **Commit changes**.

## Paso 2 · Activar la web (GitHub Pages)

1. En el repositorio: **Settings** (Configuración) → menú izquierdo **Pages**.
2. En *Build and deployment → Source* elige **Deploy from a branch**.
3. En *Branch* elige **main** y la carpeta **/ (root)** → **Save**.
4. Espera 1-2 minutos y recarga la página: arriba aparecerá
   *"Your site is live at https://marialan3.github.io/TupperFit/"*. Esa es tu app. 🎉

## Paso 3 · Instalarla en el móvil

- **Android (Chrome):** abre la dirección → menú ⋮ → **Instalar aplicación** (o *Añadir a pantalla de inicio*).
- **iPhone (Safari):** abre la dirección → botón Compartir ⬆️ → **Añadir a pantalla de inicio**.
- **Ordenador (Chrome/Edge):** icono de instalar ⊕ al final de la barra de direcciones.

Se abrirá a pantalla completa y funcionará también sin internet.

## Paso 4 · Actualizar la app más adelante

Cuando haya cambios: repite el Paso 1 (subir los archivos nuevos; GitHub los reemplaza).
En 1-2 minutos la web se actualiza; cierra y abre la app para ver los cambios.

---

## 💾 Importante: tus datos y el móvil

Los datos se guardan **en el dispositivo donde usas la app** (no hay servidor ni cuenta).
Eso significa que el móvil y el ordenador tienen datos **separados**. Para pasarlos de uno a otro
(o hacer copia de seguridad):

1. En el dispositivo original: **Ajustes → Exportar datos** (se descarga un archivo `.json`).
2. Envíatelo (WhatsApp, correo, Drive…).
3. En el otro dispositivo: **Ajustes → Importar datos** y elige el archivo.

👉 Recomendación: usa la app principalmente **en el móvil** y haz una exportación de vez en cuando.
Si borras los datos del navegador o desinstalas la app, se pierden (por eso la copia de seguridad).

## 🧪 Probarla en el ordenador sin publicar

Haz doble clic en `index.html`: se abre en el navegador y ya puedes usarla
(la instalación como app y el modo sin conexión solo funcionan en la dirección publicada).

## ❓ Si algo falla

| Problema | Solución |
|---|---|
| La web da error 404 | Comprueba que `index.html` está en la raíz del repositorio y que Pages está en *main* / *root*. Espera 2 min. |
| Veo la versión antigua | Cierra la app del todo y ábrela de nuevo (o recarga con Ctrl+F5). |
| No aparece "Instalar" | Debes abrir la dirección `https://…github.io/TupperFit/` (no el archivo local). |
