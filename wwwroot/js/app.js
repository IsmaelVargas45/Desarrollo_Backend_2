const API = "/api/tareas";

async function cargarTareas() {
    const res = await fetch(API);
    const tareas = await res.json();
    const lista = document.getElementById("lista");
    lista.innerHTML = "";
    tareas.forEach(t => {
        lista.innerHTML += `
            <div class="tarea">
                <strong>${t.titulo}</strong> - ${t.descripcion}
                ${t.completada ? "✅" : "❌"}
                <button onclick="eliminarTarea(${t.id})">Eliminar</button>
                <button onclick="toggleCompletada(${t.id}, ${!t.completada})">${t.completada ? "Marcar pendiente" : "Completar"}</button>
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

cargarTareas();