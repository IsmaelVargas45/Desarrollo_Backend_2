const API = "/api/tareas";

async function cargarTareas() {
    const res = await fetch(API);
    const tareas = await res.json();

    const textoBusqueda = document
        .getElementById("buscar")
        .value
        .toLowerCase();

    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    const tareasFiltradas = tareas.filter(t =>
        t.titulo.toLowerCase().includes(textoBusqueda) ||
        t.descripcion.toLowerCase().includes(textoBusqueda)
    );

    tareasFiltradas.forEach(t => {
        lista.innerHTML += `
            <div class="tarea">
                <strong>${t.titulo}</strong> - ${t.descripcion}
                
                <button onclick="eliminarTarea(${t.id})">
                    Eliminar
                </button>
                <button onclick="editarTarea(${t.id})">
                Editar
                        </button>

                <button onclick="toggleCompletada(${t.id}, ${!t.completada})">
                    ${t.completada ? "Realizada" : "Pendiente"}
                </button>
            </div>
        `;
    });
}

async function crearTarea() {
    const titulo = document.getElementById("titulo").value;
    const descripcion = document.getElementById("descripcion").value;
    if (!titulo) return;
    const nueva = { titulo, descripcion, completada: false };
    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nueva)
    });
    cargarTareas();
    document.getElementById("titulo").value = "";
    document.getElementById("descripcion").value = "";
}

async function eliminarTarea(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    cargarTareas();
}

async function toggleCompletada(id, estadoActual) {
    const res = await fetch(`${API}/${id}`);
    const tarea = await res.json();
    tarea.completada = estadoActual;
    await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tarea)
    });
    cargarTareas();
}
async function editarTarea(id) {
    const res = await fetch(`${API}/${id}`);
    const tarea = await res.json();

    const nuevoTitulo = prompt("Nuevo título:", tarea.titulo);
    if (nuevoTitulo === null) return;

    const nuevaDescripcion = prompt("Nueva descripción:", tarea.descripcion);
    if (nuevaDescripcion === null) return;

    tarea.titulo = nuevoTitulo;
    tarea.descripcion = nuevaDescripcion;

    await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(tarea)
    });

    cargarTareas();
}
cargarTareas();