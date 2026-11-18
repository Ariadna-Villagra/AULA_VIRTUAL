/* ==========================================================
   sw.js - Service worker de Aula 6.o
   Un service worker es un archivo de JavaScript que el navegador
   ejecuta "por detrás" de la página. Acá lo usamos para guardar
   la app en el celular y que funcione sin internet.
   ========================================================== */

// Versión de la caché. Cada vez que cambies un archivo de la app, subila (v2, v3...)
const VERSION = "v2";

// Nombre completo de la caché: "aula-" + la versión (queda "aula-v1")
const NOMBRE_CACHE = "aula-" + VERSION;

// Lista de archivos que se guardan para usar sin internet
const ARCHIVOS = [
  "./",                // la raíz de la app (la página principal)
  "./index.html",      // la estructura
  "./styles.css",      // los estilos
  "./app.js",          // el código de la app
  "./manifest.json",   // los datos de la app instalable
  "./icono-192.png",   // ícono chico
  "./icono-512.png"    // ícono grande
];


/* ---------- INSTALL: se ejecuta una vez, cuando el navegador instala este service worker ---------- */
self.addEventListener("install", function (evento) {
  // waitUntil: "esperá a que termine esto antes de dar por terminada la instalación"
  evento.waitUntil(
    // Abre (o crea) la caché con nuestro nombre
    caches.open(NOMBRE_CACHE).then(function (cache) {
      // Descarga todos los archivos de la lista y los guarda en la caché
      // (si UNO solo falla, no se guarda ninguno)
      return cache.addAll(ARCHIVOS);
    })
  );
});


/* ---------- ACTIVATE: se ejecuta cuando esta versión pasa a estar en uso ---------- */
self.addEventListener("activate", function (evento) {
  // waitUntil: "esperá a que termine la limpieza"
  evento.waitUntil(
    // Pide los nombres de todas las cachés guardadas
    caches.keys().then(function (nombres) {
      // Promise.all espera a que se terminen de borrar todas las viejas
      return Promise.all(
        nombres
          // Nos quedamos solo con las de la app que NO son la versión actual
          // (así no tocamos cachés de otras apps)
          .filter(function (nombre) {
            return nombre.startsWith("aula-") && nombre !== NOMBRE_CACHE;
          })
          // Borramos cada una de las viejas
          .map(function (nombre) {
            return caches.delete(nombre);
          })
      );
    })
  );
});


/* ---------- FETCH: se ejecuta cada vez que la página pide un archivo ---------- */
self.addEventListener("fetch", function (evento) {
  // Solo manejamos pedidos GET (pedir archivos); lo demás sigue su camino normal
  if (evento.request.method !== "GET") return;

  // respondWith: "yo me encargo de contestar este pedido"
  evento.respondWith(
    // 1) Buscamos primero una copia guardada en la caché
    caches.match(evento.request).then(function (copiaGuardada) {
      // 2) Si la hay, la usamos; si no, lo buscamos en internet
      return copiaGuardada || fetch(evento.request);
    })
  );
});
