# SECTOR 4 · Terminal de análisis del antídoto

| Archivo | Qué es |
|---|---|
| `muestra-k7.html` | ✅ **Mezcla CORRECTA**: antídoto sintetizado (verde) |
| `muestra-r3.html` | ❌ **Mezcla INCORRECTA**: mezcla inestable (alarma roja) |
| `index.html` | Pantalla neutra "Terminal en espera" (lo que sale en la dirección raíz) |
| `lab.css` / `lab.js` | Estilo y lógica comunes (no hace falta tocarlos) |

Los nombres son neutros a propósito: así nadie adivina el resultado mirando el enlace.
**Truco para acordarse: k7 = OK, r3 = Rojo.**

## Cómo funciona
1. Pantalla de espera → pulsar **ANALIZAR MEZCLA** (también vale Enter o espacio en un portátil).
2. Unos 7 segundos de análisis con pitidos y barra de progreso. Es **idéntico en las dos páginas**.
3. Resultado:
   - Correcta: llega al 100 %, sale "ANTÍDOTO SINTETIZADO" y suena un acorde de éxito.
   - Incorrecta: al 73 % la barra se pone roja y tiembla, y salen sirena, destellos rojos (máximo uno por segundo), vibración en el móvil y "MEZCLA INESTABLE".
4. **Nuevo análisis** (o la tecla R / Esc) vuelve al inicio para el siguiente grupo.

Al pulsar el botón, la página mantiene la pantalla encendida si el navegador lo permite (no pasa a pantalla completa).
**Subid el volumen del móvil o la tablet**: el sonido se genera en la propia página, sin archivos.

Para cambiar los textos del resultado, edita la sección `3 · RESULTADO` de cada página.
Para cambiar las líneas del análisis, la duración o el % de fallo, edita el principio de `lab.js`.

## Publicar en GitHub Pages
1. En github.com → **New repository** → nombre, por ejemplo `sector4-lab` → **Public** → *Create repository*.
2. En el repo vacío: **uploading an existing file** → arrastra los 6 archivos (no la carpeta) → *Commit changes*.
3. **Settings → Pages** → *Source: Deploy from a branch* → Branch **main** / **(root)** → *Save*.
4. Espera 1-2 minutos. Las direcciones quedan así:
   - Correcta: `https://TU-USUARIO.github.io/sector4-lab/muestra-k7.html`
   - Incorrecta: `https://TU-USUARIO.github.io/sector4-lab/muestra-r3.html`

Para actualizar un texto: abre el archivo en GitHub → lápiz ✏️ → *Commit changes*. En un minuto está publicado.
