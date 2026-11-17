/* ==========================================================
   app.js - Aula 6.o
   ========================================================== */

/* ---------- REGISTRO DE USO DE IA ----------
   (Pegá acá tu comentario de registro de IA.) */


/* ---------- 1. DATOS ----------
   Cuatro arrays vacíos. Cada elemento va a ser un objeto con los
   campos de tu tabla (los definimos cuando me la pases). */
let cursos = [];
let materiales = [];
let tareas = [];
let entregas = [];

// Modo actual de la aplicación: "docente" o "alumno"
let modo = "docente";

// Nombre (ficticio) del alumno: se pide una sola vez y se guarda
let alumnoActual = "";

// Clave con la que se guarda todo en localStorage
const CLAVE_DATOS = "aula-datos";


/* ---------- 2. GUARDAR Y CARGAR (localStorage) ---------- */

// Junta todo en un solo objeto, lo convierte a texto (JSON) y lo guarda
function guardarDatos() {
  const datos = { cursos, materiales, tareas, entregas, modo, alumnoActual };

  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  } catch (error) {
    console.error("No se pudieron guardar los datos:", error);
  }
}

// Lee el texto guardado, lo convierte otra vez a objeto y completa las variables
function cargarDatos() {
  try {
    const texto = localStorage.getItem(CLAVE_DATOS);
    if (!texto) return; // Primera vez: no hay nada guardado todavía

    const datos = JSON.parse(texto);

    // Solo aceptamos arrays, por si el contenido guardado está dañado
    cursos = Array.isArray(datos.cursos) ? datos.cursos : [];
    materiales = Array.isArray(datos.materiales) ? datos.materiales : [];
    tareas = Array.isArray(datos.tareas) ? datos.tareas : [];
    entregas = Array.isArray(datos.entregas) ? datos.entregas : [];

    // Solo aceptamos los dos modos válidos
    modo = datos.modo === "alumno" ? "alumno" : "docente";
    alumnoActual = typeof datos.alumnoActual === "string" ? datos.alumnoActual : "";
  } catch (error) {
    console.error("No se pudieron leer los datos guardados:", error);
  }
}


/* ---------- 3. MODO "VER COMO" ---------- */
const selectorRol = document.getElementById("selectorRol");

// Refleja el modo en la pantalla: el select y una clase en <body>
// (el CSS usa esa clase para ocultar lo que es solo-docente)
function aplicarModo() {
  selectorRol.value = modo;
  document.body.classList.toggle("modo-alumno", modo === "alumno");
}

// Cuando se cambia el select, se actualiza el modo y se guarda
selectorRol.addEventListener("change", function () {
  modo = selectorRol.value;
  aplicarModo();
  guardarDatos();

  // Si hay una tarea abierta, sus entregas se ven distinto según el modo
  if (tareaActualId !== null) {
    salirDeEdicionEntrega();
    dibujarEntregas();
  }
});


/* ---------- 4. VISTAS ---------- */

// Cada nombre de vista apunta al id de su <section> en el HTML
const vistas = {
  cursos: "vistaCursos",
  curso: "vistaCurso",
  tarea: "vistaTarea"
};

// Muestra la vista pedida ("cursos", "curso" o "tarea") y oculta las otras
function mostrarVista(nombre) {
  for (const clave in vistas) {
    const seccion = document.getElementById(vistas[clave]);
    seccion.hidden = clave !== nombre;
  }
}


/* ---------- 5. CURSOS: ALTA, EDICIÓN Y BAJA ----------
   Cada curso es un objeto con estos campos:
   { id, codigo, nombre, docente, color, descripcion } */

// Elementos del HTML que vamos a usar
const grillaCursos = document.getElementById("grillaCursos");
const formularioCurso = document.getElementById("formularioCurso");
const tituloFormularioCurso = document.getElementById("tituloFormularioCurso");
const campoNombre = document.getElementById("nombreCurso");
const campoCodigo = document.getElementById("codigoCurso");
const campoDocente = document.getElementById("docenteCurso");
const campoColor = document.getElementById("colorCurso");
const campoDescripcion = document.getElementById("descripcionCurso");
const mensajeErrorCurso = document.getElementById("errorCurso");
const botonGuardarCurso = document.getElementById("botonGuardarCurso");
const botonCancelarCurso = document.getElementById("botonCancelarCurso");
const tituloCurso = document.getElementById("tituloCurso");
const botonVolverCursos = document.getElementById("botonVolverCursos");

// id del curso que se está editando (null = estamos creando uno nuevo)
let cursoEnEdicionId = null;

// id del curso cuyo muro está abierto
let cursoActualId = null;

// Crea un identificador único para cada curso
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Busca un curso por su id
function buscarCurso(id) {
  return cursos.find(function (curso) {
    return curso.id === id;
  });
}

// Revisa los datos del formulario. Devuelve el texto del error,
// o una cadena vacía si está todo bien.
function validarCurso(nombre, codigo) {
  if (nombre === "") {
    return "El nombre del curso no puede estar vacío.";
  }

  // Entre 3 y 8 caracteres, solo letras (sin tildes ni ñ) o números
  if (!/^[A-Za-z0-9]{3,8}$/.test(codigo)) {
    return "El código debe tener de 3 a 8 letras (sin tildes) o números, sin espacios ni símbolos.";
  }

  // El código no puede repetirse (se ignora el curso que se está editando)
  const repetido = cursos.some(function (curso) {
    return curso.codigo === codigo && curso.id !== cursoEnEdicionId;
  });
  if (repetido) {
    return "Ya existe un curso con el código " + codigo + ".";
  }

  return "";
}

// Dibuja una tarjeta por cada curso. Usamos textContent (y no innerHTML)
// para que lo que escribe la persona nunca se interprete como código HTML.
function dibujarCursos() {
  grillaCursos.innerHTML = "";

  for (const curso of cursos) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-curso";
    tarjeta.dataset.id = curso.id;
    tarjeta.tabIndex = 0; // se puede llegar con el teclado
    tarjeta.style.setProperty("--color-franja", curso.color);

    const titulo = document.createElement("h3");
    titulo.textContent = curso.nombre;

    const docente = document.createElement("p");
    docente.className = "docente-curso";
    docente.textContent = "👩‍🏫 " + (curso.docente || "Docente sin asignar");

    const codigo = document.createElement("span");
    codigo.className = "codigo-curso";
    codigo.textContent = curso.codigo;

    // Botones de editar y borrar: solo los ve el docente
    const acciones = document.createElement("div");
    acciones.className = "acciones-curso solo-docente";

    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.className = "boton-chico boton-secundario";
    botonEditar.dataset.accion = "editar";
    botonEditar.textContent = "✏️ Editar";

    const botonBorrar = document.createElement("button");
    botonBorrar.type = "button";
    botonBorrar.className = "boton-chico boton-peligro";
    botonBorrar.dataset.accion = "borrar";
    botonBorrar.textContent = "🗑️ Borrar";

    acciones.append(botonEditar, botonBorrar);
    tarjeta.append(titulo, docente, codigo, acciones);
    grillaCursos.append(tarjeta);
  }
}

// Vuelve el formulario al estado "crear curso"
function salirDeEdicion() {
  cursoEnEdicionId = null;
  formularioCurso.reset();
  mensajeErrorCurso.textContent = "";
  tituloFormularioCurso.textContent = "Crear curso";
  botonGuardarCurso.textContent = "Crear curso";
  botonCancelarCurso.hidden = true;
}

// Pasa el formulario a "editar" y lo completa con los datos del curso
function comenzarEdicion(id) {
  const curso = buscarCurso(id);
  if (!curso) return;

  cursoEnEdicionId = id;
  campoNombre.value = curso.nombre;
  campoCodigo.value = curso.codigo;
  campoDocente.value = curso.docente;
  campoColor.value = curso.color;
  campoDescripcion.value = curso.descripcion;

  mensajeErrorCurso.textContent = "";
  tituloFormularioCurso.textContent = "Editar curso";
  botonGuardarCurso.textContent = "Guardar cambios";
  botonCancelarCurso.hidden = false;

  formularioCurso.scrollIntoView({ behavior: "smooth" });
  campoNombre.focus();
}

// Borra un curso, pidiendo confirmación. Si tiene tareas con entregas, avisa.
function borrarCurso(id) {
  const curso = buscarCurso(id);
  if (!curso) return;

  // Tareas del curso y entregas de esas tareas
  const tareasDelCurso = tareas.filter(function (tarea) {
    return tarea.cursoId === id;
  });
  const idsTareas = tareasDelCurso.map(function (tarea) {
    return tarea.id;
  });
  const entregasDelCurso = entregas.filter(function (entrega) {
    return idsTareas.includes(entrega.tareaId);
  });

  let mensaje = "¿Querés borrar el curso \"" + curso.nombre + "\"?";

  if (entregasDelCurso.length > 0) {
    const tareasConEntregas = tareasDelCurso.filter(function (tarea) {
      return entregas.some(function (entrega) {
        return entrega.tareaId === tarea.id;
      });
    });
    mensaje =
      "⚠️ Atención: el curso \"" + curso.nombre + "\" tiene " +
      tareasConEntregas.length + " tarea(s) con entregas (" +
      entregasDelCurso.length + " en total).\n\n" +
      "Si lo borrás, se pierden también sus tareas, materiales y entregas.\n\n" +
      "¿Querés borrarlo igual?";
  }

  if (!confirm(mensaje)) return; // Si cancela, no pasa nada

  // Se borra el curso y todo lo que dependía de él
  cursos = cursos.filter(function (c) {
    return c.id !== id;
  });
  materiales = materiales.filter(function (material) {
    return material.cursoId !== id;
  });
  entregas = entregas.filter(function (entrega) {
    return !idsTareas.includes(entrega.tareaId);
  });
  tareas = tareas.filter(function (tarea) {
    return tarea.cursoId !== id;
  });

  if (cursoEnEdicionId === id) salirDeEdicion();
  guardarDatos();
  dibujarCursos();
}

// Abre el muro de un curso
function abrirCurso(id) {
  const curso = buscarCurso(id);
  if (!curso) return;

  cursoActualId = id;
  tituloCurso.textContent = curso.nombre + " (" + curso.codigo + ")";
  salirDeEdicionMaterial(); // deja el formulario del muro limpio
  dibujarMuro();      // muestra solo los materiales de este curso
  mostrarVista("curso");
}

// Alta y edición: se ejecuta al enviar el formulario
formularioCurso.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue
  if (modo !== "docente") return;

  const nombre = campoNombre.value.trim();
  const codigo = campoCodigo.value.trim().toUpperCase();

  const error = validarCurso(nombre, codigo);
  if (error) {
    mensajeErrorCurso.textContent = error;
    return; // no se guarda nada
  }

  if (cursoEnEdicionId === null) {
    // Alta: curso nuevo
    cursos.push({
      id: generarId(),
      codigo: codigo,
      nombre: nombre,
      docente: campoDocente.value.trim(),
      color: campoColor.value,
      descripcion: campoDescripcion.value.trim()
    });
  } else {
    // Edición: se actualiza el curso existente
    const curso = buscarCurso(cursoEnEdicionId);
    curso.codigo = codigo;
    curso.nombre = nombre;
    curso.docente = campoDocente.value.trim();
    curso.color = campoColor.value;
    curso.descripcion = campoDescripcion.value.trim();
  }

  guardarDatos();
  dibujarCursos();
  salirDeEdicion();
});

botonCancelarCurso.addEventListener("click", salirDeEdicion);
botonVolverCursos.addEventListener("click", function () {
  mostrarVista("cursos");
});

// Un solo "escuchador" para todas las tarjetas (delegación de eventos):
// según dónde se hizo clic, se edita, se borra o se abre el curso.
grillaCursos.addEventListener("click", function (evento) {
  const tarjeta = evento.target.closest(".tarjeta-curso");
  if (!tarjeta) return;

  const id = tarjeta.dataset.id;
  const boton = evento.target.closest("button[data-accion]");

  if (boton) {
    if (modo !== "docente") return;
    if (boton.dataset.accion === "editar") comenzarEdicion(id);
    if (boton.dataset.accion === "borrar") borrarCurso(id);
  } else {
    abrirCurso(id);
  }
});

// Con el teclado: Enter sobre la tarjeta también abre el curso
grillaCursos.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter" && evento.target.classList.contains("tarjeta-curso")) {
    abrirCurso(evento.target.dataset.id);
  }
});


/* ---------- 6. MURO: MATERIALES ----------
   Cada material es un objeto con estos campos:
   { id, cursoId, titulo, tipo, contenido, fecha }
   - tipo "texto":   contenido = el texto
   - tipo "enlace":  contenido = la dirección (empieza con https://)
   - tipo "archivo": contenido = SOLO el nombre del archivo elegido
   - fecha: momento de creación (número), sirve para ordenar */

// Elementos del HTML
const formularioMaterial = document.getElementById("formularioPublicacion");
const tituloFormularioMaterial = document.getElementById("tituloFormularioPublicacion");
const campoTipoMaterial = document.getElementById("tipoPublicacion");
const campoTituloMaterial = document.getElementById("tituloPublicacion");
const grupoTexto = document.getElementById("grupoTexto");
const grupoEnlace = document.getElementById("grupoEnlace");
const grupoArchivo = document.getElementById("grupoArchivo");
const campoTexto = document.getElementById("textoPublicacion");
const campoEnlace = document.getElementById("enlacePublicacion");
const campoArchivo = document.getElementById("archivoPublicacion");
const avisoArchivoActual = document.getElementById("archivoActual");
const mensajeErrorMaterial = document.getElementById("errorPublicacion");
const botonGuardarMaterial = document.getElementById("botonGuardarPublicacion");
const botonCancelarMaterial = document.getElementById("botonCancelarPublicacion");
const listaPublicaciones = document.getElementById("listaPublicaciones");

// Campos que se usan solo cuando el tipo es "tarea"
const opcionTarea = document.getElementById("opcionTarea");
const grupoTarea = document.getElementById("grupoTarea");
const campoConsigna = document.getElementById("consignaPublicacion");
const campoFechaLimite = document.getElementById("fechaLimitePublicacion");
const campoPuntaje = document.getElementById("puntajePublicacion");

// Los tres tipos válidos
const TIPOS_MATERIAL = ["texto", "enlace", "archivo"];

// id del material que se está editando (null = estamos creando uno nuevo)
let materialEnEdicionId = null;

function buscarMaterial(id) {
  return materiales.find(function (material) {
    return material.id === id;
  });
}

// Indica si un texto es un enlace válido que empieza con https://
function esEnlaceSeguro(texto) {
  if (!texto.toLowerCase().startsWith("https://")) return false;

  try {
    new URL(texto); // si la dirección está mal escrita, lanza un error
    return true;
  } catch (error) {
    return false;
  }
}

// Muestra solo el campo que corresponde al tipo elegido
function mostrarCamposSegunTipo() {
  const tipo = campoTipoMaterial.value;
  grupoTexto.hidden = tipo !== "texto";
  grupoEnlace.hidden = tipo !== "enlace";
  grupoArchivo.hidden = tipo !== "archivo";
  grupoTarea.hidden = tipo !== "tarea";
}

// Revisa los datos. Devuelve el texto del error o "" si está todo bien.
function validarMaterial(titulo, tipo, contenido) {
  if (titulo === "") {
    return "El título es obligatorio.";
  }
  if (tipo === "texto" && contenido === "") {
    return "Escribí el texto del material.";
  }
  if (tipo === "enlace" && !esEnlaceSeguro(contenido)) {
    return "El enlace tiene que empezar con https:// y ser una dirección válida.";
  }
  if (tipo === "archivo" && contenido === "") {
    return "Elegí un archivo.";
  }
  return "";
}

// Convierte el número de fecha en un texto legible
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// Crea el <li> de un material (texto, enlace o archivo)
function crearItemMaterial(material) {
  const tipo = TIPOS_MATERIAL.includes(material.tipo) ? material.tipo : "texto";

  const item = document.createElement("li");
  item.className = "tipo-" + tipo; // el CSS pone el ícono según esta clase
  item.dataset.id = material.id;

  const contenedor = document.createElement("div");
  contenedor.className = "contenido-publicacion";

  const titulo = document.createElement("h4");
  titulo.textContent = material.titulo;

  // Lo que se muestra cambia según el tipo
  const cuerpo = document.createElement("div");
  cuerpo.className = "texto-publicacion";

  if (tipo === "enlace" && esEnlaceSeguro(material.contenido)) {
    const enlace = document.createElement("a");
    enlace.href = material.contenido;
    enlace.textContent = material.contenido;
    enlace.target = "_blank";               // abre en una pestaña nueva
    enlace.rel = "noopener noreferrer";     // por seguridad
    cuerpo.append(enlace);
  } else if (tipo === "archivo") {
    cuerpo.textContent = "📎 " + material.contenido + " (entregado en clase)";
  } else {
    cuerpo.textContent = material.contenido;
  }

  const fecha = document.createElement("p");
  fecha.className = "fecha-publicacion";
  fecha.textContent = formatearFecha(material.fecha);

  // Botones de editar y borrar: solo los ve el docente
  const acciones = document.createElement("div");
  acciones.className = "acciones-publicacion solo-docente";

  const botonEditar = document.createElement("button");
  botonEditar.type = "button";
  botonEditar.className = "boton-chico boton-secundario";
  botonEditar.dataset.accion = "editar";
  botonEditar.textContent = "✏️ Editar";

  const botonBorrar = document.createElement("button");
  botonBorrar.type = "button";
  botonBorrar.className = "boton-chico boton-peligro";
  botonBorrar.dataset.accion = "borrar";
  botonBorrar.textContent = "🗑️ Borrar";

  acciones.append(botonEditar, botonBorrar);
  contenedor.append(titulo, cuerpo, fecha, acciones);
  item.append(contenedor);
  return item;
}

// Crea el <li> de una tarea: ícono ✅ (por la clase tipo-tarea) y fecha de vencimiento
function crearItemTarea(tarea) {
  const item = document.createElement("li");
  item.className = "tipo-tarea";
  item.dataset.id = tarea.id;
  item.tabIndex = 0; // se puede llegar con el teclado

  const contenedor = document.createElement("div");
  contenedor.className = "contenido-publicacion";

  const titulo = document.createElement("h4");
  titulo.textContent = tarea.titulo;

  const vence = document.createElement("div");
  vence.className = "texto-publicacion";
  vence.textContent = "📅 Vence: " + formatearFecha(tarea.fechaLimite);

  const puntaje = document.createElement("p");
  puntaje.className = "fecha-publicacion";
  puntaje.textContent = "Puntaje máximo: " + tarea.puntajeMaximo + " (tocá para abrir la tarea)";

  // Cuántas entregas faltan corregir (solo lo ve el docente)
  const conteo = contarEntregas(tarea.id);
  const pendientes = document.createElement("p");
  pendientes.className = "pendientes-tarea solo-docente";
  pendientes.textContent =
    conteo.total === 0
      ? "📥 Sin entregas todavía"
      : "📥 Faltan corregir " + conteo.pendientes + " de " + conteo.total;

  contenedor.append(titulo, vence, puntaje, pendientes);
  item.append(contenedor);
  return item;
}

// Dibuja el muro del curso abierto (materiales y tareas), del más nuevo al más viejo
function dibujarMuro() {
  listaPublicaciones.innerHTML = "";

  const publicaciones = [];

  for (const material of materiales) {
    if (material.cursoId === cursoActualId) {
      publicaciones.push({ fecha: material.fecha, material: material });
    }
  }
  for (const tarea of tareas) {
    if (tarea.cursoId === cursoActualId) {
      publicaciones.push({ fecha: tarea.fecha, tarea: tarea });
    }
  }

  // fecha mayor = más nuevo, va primero
  publicaciones.sort(function (a, b) {
    return b.fecha - a.fecha;
  });

  for (const publicacion of publicaciones) {
    const item = publicacion.tarea
      ? crearItemTarea(publicacion.tarea)
      : crearItemMaterial(publicacion.material);
    listaPublicaciones.append(item);
  }
}

// Vuelve el formulario al estado "nuevo material"
function salirDeEdicionMaterial() {
  materialEnEdicionId = null;
  formularioMaterial.reset(); // también vacía el campo de archivo
  mensajeErrorMaterial.textContent = "";
  avisoArchivoActual.textContent = "";
  tituloFormularioMaterial.textContent = "Nueva publicación";
  opcionTarea.disabled = false; // volver a permitir crear tareas
  botonGuardarMaterial.textContent = "Publicar";
  botonCancelarMaterial.hidden = true;
  mostrarCamposSegunTipo();
}

// Pasa el formulario a "editar" y lo completa con los datos del material
function comenzarEdicionMaterial(id) {
  const material = buscarMaterial(id);
  if (!material) return;

  materialEnEdicionId = id;
  opcionTarea.disabled = true; // un material no se puede convertir en tarea
  campoTipoMaterial.value = material.tipo;
  campoTituloMaterial.value = material.titulo;
  campoTexto.value = material.tipo === "texto" ? material.contenido : "";
  campoEnlace.value = material.tipo === "enlace" ? material.contenido : "";
  campoArchivo.value = ""; // un campo de archivo no se puede completar por código

  // Para archivos, avisamos cuál es el actual
  avisoArchivoActual.textContent =
    material.tipo === "archivo"
      ? "Archivo actual: " + material.contenido + ". Elegí otro solo si querés cambiarlo."
      : "";

  mensajeErrorMaterial.textContent = "";
  tituloFormularioMaterial.textContent = "Editar material";
  botonGuardarMaterial.textContent = "Guardar cambios";
  botonCancelarMaterial.hidden = false;
  mostrarCamposSegunTipo();

  formularioMaterial.scrollIntoView({ behavior: "smooth" });
  campoTituloMaterial.focus();
}

// Borra un material pidiendo confirmación
function borrarMaterial(id) {
  const material = buscarMaterial(id);
  if (!material) return;

  if (!confirm("¿Querés borrar \"" + material.titulo + "\" del muro?")) return;

  materiales = materiales.filter(function (m) {
    return m.id !== id;
  });

  if (materialEnEdicionId === id) salirDeEdicionMaterial();
  guardarDatos();
  dibujarMuro();
}

// Alta y edición: se ejecuta al enviar el formulario
formularioMaterial.addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (modo !== "docente" || cursoActualId === null) return;

  const titulo = campoTituloMaterial.value.trim();
  const tipo = campoTipoMaterial.value;
  const materialAnterior = buscarMaterial(materialEnEdicionId);

  // Las tareas tienen sus propios campos y su propia validación
  if (tipo === "tarea") {
    guardarTarea(titulo);
    return;
  }

  // Se toma el contenido del campo que corresponde al tipo
  let contenido = "";
  if (tipo === "texto") {
    contenido = campoTexto.value.trim();
  } else if (tipo === "enlace") {
    contenido = campoEnlace.value.trim();
  } else {
    const archivoElegido = campoArchivo.files[0];
    if (archivoElegido) {
      contenido = archivoElegido.name; // guardamos SOLO el nombre
    } else if (materialAnterior && materialAnterior.tipo === "archivo") {
      contenido = materialAnterior.contenido; // al editar, se conserva el anterior
    }
  }

  const error = validarMaterial(titulo, tipo, contenido);
  if (error) {
    mensajeErrorMaterial.textContent = error;
    return;
  }

  if (materialAnterior) {
    // Edición: se actualiza (la fecha de creación no cambia)
    materialAnterior.titulo = titulo;
    materialAnterior.tipo = tipo;
    materialAnterior.contenido = contenido;
  } else {
    // Alta: material nuevo
    materiales.push({
      id: generarId(),
      cursoId: cursoActualId,
      titulo: titulo,
      tipo: tipo,
      contenido: contenido,
      fecha: Date.now()
    });
  }

  guardarDatos();
  dibujarMuro();
  salirDeEdicionMaterial();
});

campoTipoMaterial.addEventListener("change", function () {
  mensajeErrorMaterial.textContent = "";
  mostrarCamposSegunTipo();
});

botonCancelarMaterial.addEventListener("click", salirDeEdicionMaterial);

// Delegación de eventos: un solo "escuchador" para todos los botones de la lista
listaPublicaciones.addEventListener("click", function (evento) {
  const item = evento.target.closest("li");
  if (!item) return;

  const boton = evento.target.closest("button[data-accion]");

  if (boton) {
    // Botones de un material: solo el docente
    if (modo !== "docente") return;
    if (boton.dataset.accion === "editar") comenzarEdicionMaterial(item.dataset.id);
    if (boton.dataset.accion === "borrar") borrarMaterial(item.dataset.id);
  } else if (item.classList.contains("tipo-tarea")) {
    abrirTarea(item.dataset.id); // tocar una tarea la abre
  }
});

// Con el teclado: Enter sobre una tarea también la abre
listaPublicaciones.addEventListener("keydown", function (evento) {
  const esTarea = evento.target.classList.contains("tipo-tarea");
  if (evento.key === "Enter" && esTarea) {
    abrirTarea(evento.target.dataset.id);
  }
});


/* ---------- 7. TAREAS Y ENTREGAS ----------
   Cada tarea: { id, cursoId, titulo, consigna, fechaLimite, puntajeMaximo, fecha }
   Cada entrega: { id, tareaId, alumno, tipo, contenido, fecha, estado,
                   corregida, nota, devolucion, fechaCorreccion }
   - fechaLimite y fecha son números (milisegundos): así se pueden comparar con < y >
   - estado: "a tiempo" o "tarde" (se calcula al entregar y no cambia al corregir)
   - corregida: false hasta que el docente guarda la corrección (nota + devolución) */

// Elementos de la vista Tarea
const tituloTarea = document.getElementById("tituloTarea");
const consignaTarea = document.getElementById("consignaTarea");
const botonVolverCurso = document.getElementById("botonVolverCurso");
const formularioEntrega = document.getElementById("formularioEntrega");
const tituloFormularioEntrega = document.getElementById("tituloFormularioEntrega");
const campoTipoEntrega = document.getElementById("tipoEntrega");
const grupoTextoEntrega = document.getElementById("grupoTextoEntrega");
const campoTextoEntrega = document.getElementById("textoEntrega");
const grupoEnlaceEntrega = document.getElementById("grupoEnlaceEntrega");
const campoEnlaceEntrega = document.getElementById("enlaceEntrega");
const mensajeErrorEntrega = document.getElementById("errorEntrega");
const botonGuardarEntrega = document.getElementById("botonGuardarEntrega");
const botonCancelarEntrega = document.getElementById("botonCancelarEntrega");
const listaEntregas = document.getElementById("listaEntregas");
const tituloEntregas = document.getElementById("tituloEntregas");
const resumenEntregas = document.getElementById("resumenEntregas");

// Elementos del bloque "nombre del alumno"
const formularioAlumno = document.getElementById("formularioAlumno");
const bloquePedirNombre = document.getElementById("pedirNombreAlumno");
const bloqueSaludo = document.getElementById("saludoAlumno");
const campoNombreActual = document.getElementById("nombreAlumnoActual");
const mensajeErrorAlumno = document.getElementById("errorAlumno");
const textoSaludo = document.getElementById("textoSaludo");
const botonCambiarNombre = document.getElementById("botonCambiarNombre");

// id de la tarea abierta y de la entrega que se está editando
let tareaActualId = null;
let entregaEnEdicionId = null;

function buscarTarea(id) {
  return tareas.find(function (tarea) {
    return tarea.id === id;
  });
}

function buscarEntrega(id) {
  return entregas.find(function (entrega) {
    return entrega.id === id;
  });
}

// Deja el nombre "parejo" para compararlo: sin espacios de más,
// en minúsculas y sin tildes ("María" y "maria" son el mismo nombre)
function normalizarNombre(texto) {
  return texto
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// --- Alta de tareas (la publica el docente desde el formulario del muro) ---
function guardarTarea(titulo) {
  const consigna = campoConsigna.value.trim();
  const fechaLimite = new Date(campoFechaLimite.value).getTime(); // NaN si está vacía
  const puntajeMaximo = Number(campoPuntaje.value);

  let error = "";
  if (titulo === "") {
    error = "El título es obligatorio.";
  } else if (consigna === "") {
    error = "Escribí la consigna de la tarea.";
  } else if (Number.isNaN(fechaLimite)) {
    error = "Elegí la fecha y hora límite.";
  } else if (!Number.isInteger(puntajeMaximo) || puntajeMaximo < 1) {
    error = "El puntaje máximo tiene que ser un número entero de 1 o más.";
  }

  if (error) {
    mensajeErrorMaterial.textContent = error;
    return;
  }

  tareas.push({
    id: generarId(),
    cursoId: cursoActualId,
    titulo: titulo,
    consigna: consigna,
    fechaLimite: fechaLimite,
    puntajeMaximo: puntajeMaximo,
    fecha: Date.now()
  });

  guardarDatos();
  dibujarMuro();
  salirDeEdicionMaterial();
}

// --- Nombre del alumno (se pide una sola vez) ---

// Muestra el campo para escribir el nombre o el saludo, según si ya está guardado
function dibujarAlumno() {
  const tieneNombre = alumnoActual !== "";
  bloquePedirNombre.hidden = tieneNombre;
  bloqueSaludo.hidden = !tieneNombre;
  textoSaludo.textContent = "👋 Hola, " + alumnoActual + ". Acá ves solo tus entregas.";
}

formularioAlumno.addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (modo !== "alumno") return;

  const nombre = campoNombreActual.value.trim().replace(/\s+/g, " ");
  if (nombre === "") {
    mensajeErrorAlumno.textContent = "Escribí tu nombre (uno ficticio).";
    return;
  }

  alumnoActual = nombre;
  guardarDatos();
  campoNombreActual.value = "";
  mensajeErrorAlumno.textContent = "";
  dibujarAlumno();

  // Si hay una tarea abierta, ya se pueden mostrar sus entregas
  if (tareaActualId !== null) dibujarEntregas();
});

botonCambiarNombre.addEventListener("click", function () {
  alumnoActual = "";
  guardarDatos();
  salirDeEdicionEntrega();
  dibujarAlumno();
  if (tareaActualId !== null) dibujarEntregas();
});

// --- Contar entregas (para "faltan corregir") ---
function contarEntregas(tareaId) {
  let total = 0;
  let pendientes = 0;

  for (const entrega of entregas) {
    if (entrega.tareaId === tareaId) {
      total++;
      if (!entrega.corregida) pendientes++;
    }
  }

  return { total: total, pendientes: pendientes };
}

// --- Abrir una tarea ---
function abrirTarea(id) {
  const tarea = buscarTarea(id);
  if (!tarea) return;

  tareaActualId = id;
  tituloTarea.textContent = tarea.titulo;

  // Consigna, fecha límite y puntaje
  consignaTarea.innerHTML = "";

  const texto = document.createElement("div");
  texto.className = "texto-publicacion";
  texto.textContent = tarea.consigna;

  const datos = document.createElement("p");
  datos.className = "datos-tarea";
  datos.textContent =
    "📅 Fecha límite: " + formatearFecha(tarea.fechaLimite) +
    " — Puntaje máximo: " + tarea.puntajeMaximo;

  consignaTarea.append(texto, datos);

  salirDeEdicionEntrega();
  dibujarEntregas();
  mostrarVista("tarea");
}

// --- Entregas ---

// Muestra solo el campo que corresponde al tipo elegido
function mostrarCamposEntrega() {
  const tipo = campoTipoEntrega.value;
  grupoTextoEntrega.hidden = tipo !== "texto";
  grupoEnlaceEntrega.hidden = tipo !== "enlace";
}

// Devuelve el texto del error, o "" si está todo bien
function validarEntrega(nombre, tipo, contenido) {
  if (nombre === "") {
    return "Primero escribí y guardá tu nombre en la parte de arriba.";
  }

  // Un mismo alumno no puede entregar dos veces la misma tarea
  const yaEntrego = entregas.some(function (entrega) {
    return (
      entrega.tareaId === tareaActualId &&
      entrega.id !== entregaEnEdicionId &&
      normalizarNombre(entrega.alumno) === normalizarNombre(nombre)
    );
  });
  if (yaEntrego) {
    return "Ya hay una entrega de " + nombre + " para esta tarea. Si todavía no fue corregida, usá Editar.";
  }

  if (tipo === "texto" && contenido === "") {
    return "Escribí tu respuesta.";
  }
  if (tipo === "enlace" && !esEnlaceSeguro(contenido)) {
    return "El enlace tiene que empezar con https:// y ser una dirección válida.";
  }
  return "";
}

// Crea una etiqueta redondeada (por ejemplo "A tiempo" o "Corregida")
function crearEtiqueta(texto, clase) {
  const etiqueta = document.createElement("span");
  etiqueta.className = "estado-entrega " + clase;
  etiqueta.textContent = texto;
  return etiqueta;
}

// Formulario para que el docente ponga nota y devolución a una entrega
function crearFormularioCorreccion(entrega, tarea) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-correccion";
  formulario.noValidate = true;
  formulario.dataset.id = entrega.id;

  const etiquetaNota = document.createElement("label");
  etiquetaNota.htmlFor = "nota-" + entrega.id;
  etiquetaNota.textContent = "Nota (de 1 a " + tarea.puntajeMaximo + ")";

  const campoNota = document.createElement("input");
  campoNota.type = "number";
  campoNota.inputMode = "numeric"; // teclado de números en el celular
  campoNota.id = "nota-" + entrega.id;
  campoNota.name = "nota";
  campoNota.min = 1;
  campoNota.max = tarea.puntajeMaximo;
  campoNota.step = 1;
  campoNota.value = entrega.corregida ? entrega.nota : "";

  const etiquetaDevolucion = document.createElement("label");
  etiquetaDevolucion.htmlFor = "devolucion-" + entrega.id;
  etiquetaDevolucion.textContent = "Devolución";

  const campoDevolucion = document.createElement("textarea");
  campoDevolucion.id = "devolucion-" + entrega.id;
  campoDevolucion.name = "devolucion";
  campoDevolucion.rows = 3;
  campoDevolucion.value = entrega.corregida ? entrega.devolucion : "";

  const error = document.createElement("p");
  error.className = "mensaje-error";
  error.setAttribute("role", "alert");

  const boton = document.createElement("button");
  boton.type = "submit";
  boton.textContent = entrega.corregida ? "Actualizar corrección" : "Guardar corrección";

  formulario.append(etiquetaNota, campoNota, etiquetaDevolucion, campoDevolucion, error, boton);
  return formulario;
}

// Dibuja las entregas de la tarea abierta
function dibujarEntregas() {
  listaEntregas.innerHTML = "";
  tituloEntregas.textContent = modo === "alumno" ? "Mis entregas" : "Entregas";

  const tarea = buscarTarea(tareaActualId);
  if (!tarea) return;

  // Resumen para el docente: cuántas faltan corregir
  const conteo = contarEntregas(tareaActualId);
  if (modo === "docente" && conteo.total > 0) {
    resumenEntregas.textContent =
      conteo.pendientes === 0
        ? "✅ Todas las entregas están corregidas (" + conteo.total + ")."
        : "📥 Faltan corregir " + conteo.pendientes + " de " + conteo.total + " entrega(s).";
  } else {
    resumenEntregas.textContent = "";
  }

  let lista = entregas.filter(function (entrega) {
    return entrega.tareaId === tareaActualId;
  });

  // El alumno solo ve SUS entregas (según el nombre guardado)
  if (modo === "alumno") {
    const buscado = normalizarNombre(alumnoActual);
    lista = lista.filter(function (entrega) {
      return buscado !== "" && normalizarNombre(entrega.alumno) === buscado;
    });
  }

  // Más nueva primero
  lista.sort(function (a, b) {
    return b.fecha - a.fecha;
  });

  for (const entrega of lista) {
    const item = document.createElement("li");
    item.dataset.id = entrega.id;

    // Alumno + estado (a tiempo / tarde) + si está corregida
    const titulo = document.createElement("h4");
    titulo.textContent = entrega.alumno;

    const aTiempo = entrega.estado === "a tiempo";
    titulo.append(crearEtiqueta(aTiempo ? "✅ A tiempo" : "⏰ Tarde", aTiempo ? "a-tiempo" : "tarde"));
    titulo.append(
      entrega.corregida
        ? crearEtiqueta("📝 Corregida", "corregida")
        : crearEtiqueta("Sin corregir", "pendiente")
    );

    // Lo que entregó
    const cuerpo = document.createElement("div");
    cuerpo.className = "texto-publicacion";
    if (entrega.tipo === "enlace" && esEnlaceSeguro(entrega.contenido)) {
      const enlace = document.createElement("a");
      enlace.href = entrega.contenido;
      enlace.textContent = entrega.contenido;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      cuerpo.append(enlace);
    } else {
      cuerpo.textContent = entrega.contenido;
    }

    const fecha = document.createElement("p");
    fecha.className = "fecha-publicacion";
    fecha.textContent = "Entregada: " + formatearFecha(entrega.fecha);

    item.append(titulo, cuerpo, fecha);

    // Nota y devolución: SOLO si la entrega está corregida
    if (entrega.corregida) {
      const resultado = document.createElement("div");
      resultado.className = "resultado-entrega";

      const nota = document.createElement("div");
      nota.className = "nota-entrega";
      nota.textContent = "Nota: " + entrega.nota + " / " + tarea.puntajeMaximo;
      resultado.append(nota);

      if (entrega.devolucion) {
        const devolucion = document.createElement("div");
        devolucion.className = "devolucion-entrega";
        devolucion.textContent = "Devolución: " + entrega.devolucion;
        resultado.append(devolucion);
      }

      item.append(resultado);
    }

    if (modo === "docente") {
      // El docente corrige (o actualiza la corrección)
      item.append(crearFormularioCorreccion(entrega, tarea));
    } else if (!entrega.corregida) {
      // El alumno puede editar solo si todavía no fue corregida
      const acciones = document.createElement("div");
      acciones.className = "acciones-publicacion solo-alumno";

      const botonEditar = document.createElement("button");
      botonEditar.type = "button";
      botonEditar.className = "boton-chico boton-secundario";
      botonEditar.dataset.accion = "editar";
      botonEditar.textContent = "✏️ Editar mi entrega";

      acciones.append(botonEditar);
      item.append(acciones);
    }

    listaEntregas.append(item);
  }
}

// Vuelve el formulario al estado "entregar"
function salirDeEdicionEntrega() {
  entregaEnEdicionId = null;
  formularioEntrega.reset();
  mensajeErrorEntrega.textContent = "";
  tituloFormularioEntrega.textContent = "Entregar tarea";
  botonGuardarEntrega.textContent = "Entregar";
  botonCancelarEntrega.hidden = true;
  mostrarCamposEntrega();
}

// Pasa el formulario a "editar" y lo completa con la entrega
function comenzarEdicionEntrega(id) {
  const entrega = buscarEntrega(id);
  if (!entrega) return;

  if (entrega.corregida) {
    mensajeErrorEntrega.textContent = "Esta entrega ya fue corregida y no se puede editar.";
    return;
  }

  entregaEnEdicionId = id;
  campoTipoEntrega.value = entrega.tipo;
  campoTextoEntrega.value = entrega.tipo === "texto" ? entrega.contenido : "";
  campoEnlaceEntrega.value = entrega.tipo === "enlace" ? entrega.contenido : "";

  mensajeErrorEntrega.textContent = "";
  tituloFormularioEntrega.textContent = "Editar mi entrega";
  botonGuardarEntrega.textContent = "Guardar cambios";
  botonCancelarEntrega.hidden = false;
  mostrarCamposEntrega();

  formularioEntrega.scrollIntoView({ behavior: "smooth" });
  campoTextoEntrega.focus();
}

// Registrar o editar una entrega
formularioEntrega.addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (modo !== "alumno" || tareaActualId === null) return;

  const tarea = buscarTarea(tareaActualId);
  if (!tarea) return;

  const tipo = campoTipoEntrega.value;
  const contenido =
    tipo === "texto" ? campoTextoEntrega.value.trim() : campoEnlaceEntrega.value.trim();

  const error = validarEntrega(alumnoActual, tipo, contenido);
  if (error) {
    mensajeErrorEntrega.textContent = error;
    return;
  }

  const entregaAnterior = buscarEntrega(entregaEnEdicionId);
  if (entregaAnterior && entregaAnterior.corregida) {
    mensajeErrorEntrega.textContent = "Esta entrega ya fue corregida y no se puede editar.";
    return;
  }

  // Fecha y hora actual, comparada con la fecha límite
  const ahora = Date.now();
  const estado = ahora <= tarea.fechaLimite ? "a tiempo" : "tarde";

  if (entregaAnterior) {
    // Edición: cuenta como una nueva entrega, así que fecha y estado se actualizan
    entregaAnterior.tipo = tipo;
    entregaAnterior.contenido = contenido;
    entregaAnterior.fecha = ahora;
    entregaAnterior.estado = estado;
  } else {
    entregas.push({
      id: generarId(),
      tareaId: tareaActualId,
      alumno: alumnoActual,
      tipo: tipo,
      contenido: contenido,
      fecha: ahora,
      estado: estado,
      corregida: false,
      nota: null,
      devolucion: "",
      fechaCorreccion: null
    });
  }

  guardarDatos();
  salirDeEdicionEntrega();
  dibujarEntregas();
});

// Corrección del docente: un solo "escuchador" para todos los formularios de la lista
listaEntregas.addEventListener("submit", function (evento) {
  const formulario = evento.target.closest(".formulario-correccion");
  if (!formulario) return;

  evento.preventDefault();
  if (modo !== "docente") return;

  const entrega = buscarEntrega(formulario.dataset.id);
  const tarea = entrega ? buscarTarea(entrega.tareaId) : null;
  if (!entrega || !tarea) return;

  const nota = Number(formulario.elements.nota.value);
  const devolucion = formulario.elements.devolucion.value.trim();
  const mensajeError = formulario.querySelector(".mensaje-error");

  // La nota tiene que ser un número entero de 1 al puntaje máximo
  if (!Number.isInteger(nota) || nota < 1 || nota > tarea.puntajeMaximo) {
    mensajeError.textContent = "La nota tiene que ser un número entero de 1 a " + tarea.puntajeMaximo + ".";
    return;
  }

  entrega.nota = nota;
  entrega.devolucion = devolucion;
  entrega.corregida = true;          // ahora figura como corregida
  entrega.fechaCorreccion = Date.now();

  guardarDatos();
  dibujarEntregas(); // se actualiza la lista y el "faltan corregir"
});

campoTipoEntrega.addEventListener("change", function () {
  mensajeErrorEntrega.textContent = "";
  mostrarCamposEntrega();
});

botonCancelarEntrega.addEventListener("click", salirDeEdicionEntrega);

// Al volver al muro, se vuelve a dibujar para que el "faltan corregir" esté al día
botonVolverCurso.addEventListener("click", function () {
  dibujarMuro();
  mostrarVista("curso");
});

listaEntregas.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton || modo !== "alumno") return;

  if (boton.dataset.accion === "editar") {
    comenzarEdicionEntrega(boton.closest("li").dataset.id);
  }
});


/* ---------- 8. EXPORTAR E IMPORTAR ---------- */

const botonExportar = document.getElementById("botonExportar");
const botonImportar = document.getElementById("botonImportar");
const archivoImportar = document.getElementById("archivoImportar");
const mensajeArchivo = document.getElementById("mensajeArchivo");

// Las cuatro listas que tiene que traer el archivo
const LISTAS_ESPERADAS = ["cursos", "materiales", "tareas", "entregas"];

// Muestra un mensaje arriba de la página (rojo si es error, verde si salió bien)
function mostrarMensajeArchivo(texto, esError) {
  mensajeArchivo.textContent = texto;
  mensajeArchivo.classList.toggle("mensaje-exito", !esError);
}

// --- Exportar ---
function exportarDatos() {
  const datos = { cursos, materiales, tareas, entregas, modo };

  // null, 2 = que el JSON salga con sangría de 2 espacios y se pueda leer
  const texto = JSON.stringify(datos, null, 2);

  // Un Blob es un "archivo en memoria"; con él armamos un enlace temporal
  const archivo = new Blob([texto], { type: "application/json" });
  const direccion = URL.createObjectURL(archivo);

  const enlace = document.createElement("a");
  enlace.href = direccion;
  enlace.download = "aula.json"; // nombre con el que se descarga
  document.body.append(enlace);
  enlace.click();                // "toca" el enlace para empezar la descarga
  enlace.remove();

  URL.revokeObjectURL(direccion); // libera la memoria
  mostrarMensajeArchivo("Se descargó aula.json con todos los datos.", false);
}

// --- Importar ---

// Revisa que el contenido tenga la forma esperada.
// Devuelve el texto del error, o "" si está todo bien.
function validarDatosImportados(datos) {
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    return "El archivo no tiene el formato del aula (tiene que ser un objeto con listas).";
  }

  for (const nombre of LISTAS_ESPERADAS) {
    if (!Array.isArray(datos[nombre])) {
      return "Falta la lista \"" + nombre + "\" o no es una lista.";
    }

    // Cada elemento tiene que ser un objeto con un id de texto
    for (const elemento of datos[nombre]) {
      const esObjeto = elemento !== null && typeof elemento === "object" && !Array.isArray(elemento);
      if (!esObjeto || typeof elemento.id !== "string") {
        return "La lista \"" + nombre + "\" tiene elementos inválidos (cada uno necesita un id).";
      }
    }
  }

  if (datos.modo !== "docente" && datos.modo !== "alumno") {
    return "El campo \"modo\" tiene que ser \"docente\" o \"alumno\".";
  }

  return "";
}

// Recibe el texto leído del archivo y, si está todo bien, reemplaza los datos
function importarTexto(texto) {
  // 1) ¿Es un JSON válido?
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (error) {
    mostrarMensajeArchivo("No se importó nada: el archivo no es un JSON válido.", true);
    return;
  }

  // 2) ¿Tiene todas las listas esperadas?
  const problema = validarDatosImportados(datos);
  if (problema !== "") {
    mostrarMensajeArchivo("No se importó nada: " + problema, true);
    return;
  }

  // 3) Confirmación antes de reemplazar
  const aviso =
    "Vas a REEMPLAZAR todos los datos actuales:\n" +
    "• Ahora: " + cursos.length + " cursos, " + materiales.length + " materiales, " +
    tareas.length + " tareas, " + entregas.length + " entregas.\n" +
    "• Archivo: " + datos.cursos.length + " cursos, " + datos.materiales.length + " materiales, " +
    datos.tareas.length + " tareas, " + datos.entregas.length + " entregas.\n\n" +
    "¿Querés continuar?";

  if (!confirm(aviso)) {
    mostrarMensajeArchivo("Importación cancelada. No se cambió nada.", true);
    return;
  }

  // 4) Recién ahora se reemplazan los datos
  cursos = datos.cursos;
  materiales = datos.materiales;
  tareas = datos.tareas;
  entregas = datos.entregas;
  modo = datos.modo;
  guardarDatos();

  // 5) Se limpia todo lo que estaba abierto y se vuelve a dibujar la pantalla
  cursoActualId = null;
  tareaActualId = null;
  salirDeEdicion();
  salirDeEdicionMaterial();
  salirDeEdicionEntrega();

  aplicarModo();
  dibujarAlumno();
  dibujarCursos();
  mostrarVista("cursos");

  mostrarMensajeArchivo("Datos importados correctamente.", false);
}

botonExportar.addEventListener("click", exportarDatos);

// El botón "Importar" activa el <input type="file"> que está oculto
botonImportar.addEventListener("click", function () {
  mensajeArchivo.textContent = "";
  archivoImportar.click();
});

// Cuando se elige un archivo, se lee como texto
archivoImportar.addEventListener("change", function () {
  const archivo = archivoImportar.files[0];
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = function () {
    importarTexto(lector.result);
    archivoImportar.value = ""; // así se puede elegir el mismo archivo otra vez
  };

  lector.onerror = function () {
    mostrarMensajeArchivo("No se importó nada: no se pudo leer el archivo.", true);
    archivoImportar.value = "";
  };

  lector.readAsText(archivo);
});


/* ---------- 9. INICIO ---------- */
cargarDatos();
aplicarModo();
dibujarAlumno();
dibujarCursos();
mostrarVista("cursos");


/* ---------- 10. SERVICE WORKER (para que la app funcione sin internet) ---------- */

// Solo se registra si el navegador lo admite
if ("serviceWorker" in navigator) {
  // Se espera a que la página termine de cargar, así no la demora
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./sw.js") // le pide al navegador que instale sw.js
      .then(function (registro) {
        console.log("Service worker registrado. Alcance:", registro.scope);
      })
      .catch(function (error) {
        console.error("No se pudo registrar el service worker:", error);
      });
  });
}
