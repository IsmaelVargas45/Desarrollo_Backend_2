const API = "/api/tareas";
let tareaEditandoId = null;

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
                <div class="tarea-texto">
                    <strong>${t.titulo}</strong>
                    <p>${t.descripcion}</p>
                </div>
                <div class="tarea-botones">
                    <button onclick="editarTarea(${t.id})">Editar</button>
                    <button onclick="eliminarTarea(${t.id})">Eliminar</button>
                    <button onclick="toggleCompletada(${t.id}, ${!t.completada})">
                        ${t.completada ? "Realizada" : "Pendiente"}
                    </button>
                </div>
            </div>
        `;
    });
}

function openModalToCreate() {
    tareaEditandoId = null;
    document.getElementById("modal-title").textContent = "Nueva tarea";
    document.getElementById("modal-titulo").value = "";
    document.getElementById("modal-descripcion").value = "";
    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modal-titulo").focus();
}

async function editarTarea(id) {
    const res = await fetch(`${API}/${id}`);
    const tarea = await res.json();

    tareaEditandoId = id;
    document.getElementById("modal-title").textContent = "Editar tarea";
    document.getElementById("modal-titulo").value = tarea.titulo;
    document.getElementById("modal-descripcion").value = tarea.descripcion;
    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modal-titulo").focus();
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
    tareaEditandoId = null;
}

function cerrarModalAlClickFuera(event) {
    if (event.target.id === "modal") {
        closeModal();
    }
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        const modal = document.getElementById("modal");
        if (!modal.classList.contains("hidden")) {
            closeModal();
        }
    }
});

async function guardarTarea(event) {
    event.preventDefault();

    const titulo = document.getElementById("modal-titulo").value.trim();
    const descripcion = document.getElementById("modal-descripcion").value.trim();

    if (!titulo) {
        alert("El título es obligatorio.");
        document.getElementById("modal-titulo").focus();
        return;
    }

    if (tareaEditandoId) {
        const res = await fetch(`${API}/${tareaEditandoId}`);
        const tareaActual = await res.json();

        const actualizado = {
            ...tareaActual,
            titulo,
            descripcion
        };

        await fetch(`${API}/${tareaEditandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actualizado)
        });
    } else {
        await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, descripcion, completada: false })
        });
    }

    closeModal();
    cargarTareas();
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

cargarTareas();