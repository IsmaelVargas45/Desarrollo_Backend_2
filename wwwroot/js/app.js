// Configuración
const API_URL = '/api'; // Cambia por tu puerto

// Estado
let token = localStorage.getItem('token');
let userRole = '';
let userId = '';
let tareasActuales = []; // cache de la última carga, para filtrar sin volver a pedir al servidor

// Elementos del DOM
const authSection = document.getElementById('auth-section');
const tasksSection = document.getElementById('tasks-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const adminPanelOverlay = document.getElementById('admin-panel-overlay');
const btnNuevaTarea = document.getElementById('btn-nueva-tarea');

// Funciones de utilidad
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...options.headers }
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

// Autenticación
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        token = data.token;
        userRole = data.roles[0]; // Asumimos que tiene al menos un rol
        userId = data.email; // Podríamos guardar más info
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('userName', data.nombre || email);
        showTasks();
    } catch (error) {
        alert('Error en login: ' + error.message);
    }
}

async function register() {
    const nombre = document.getElementById('register-nombre').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ nombreCompleto: nombre, email, password })
        });
        alert('Usuario registrado. Ahora inicia sesión.');
        showLogin();
    } catch (error) {
        alert('Error en registro: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    token = null;
    userRole = '';
    cerrarModalTarea();
    authSection.style.display = 'block';
    tasksSection.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}

// Navegación entre formularios
function showRegister() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
}

function showLogin() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}

// Mostrar panel de tareas después de login
function showTasks() {
    authSection.style.display = 'none';
    tasksSection.style.display = 'block';
    document.getElementById('user-name').textContent = localStorage.getItem('userName') || '';
    document.getElementById('user-role').textContent = userRole;

    if (userRole === 'Admin') {
        btnNuevaTarea.style.display = 'inline-block';
        cargarUsuarios();
    } else {
        btnNuevaTarea.style.display = 'none';
    }
    cargarTareas();
}

// ---------- Modal: crear tarea ----------

function abrirModalTarea() {
    adminPanelOverlay.style.display = 'flex';
    document.getElementById('new-titulo').focus();
    document.addEventListener('keydown', cerrarModalTareaConEsc);
}

function cerrarModalTarea() {
    adminPanelOverlay.style.display = 'none';
    document.getElementById('new-titulo').value = '';
    document.getElementById('new-descripcion').value = '';
    document.removeEventListener('keydown', cerrarModalTareaConEsc);
}

// Cierra el modal si se hace click en el fondo oscuro (no en la tarjeta)
function cerrarModalTareaSiFondo(event) {
    if (event.target === adminPanelOverlay) {
        cerrarModalTarea();
    }
}

function cerrarModalTareaConEsc(event) {
    if (event.key === 'Escape') {
        cerrarModalTarea();
    }
}

// ---------- Tareas ----------

// Cargar tareas
async function cargarTareas() {
    try {
        tareasActuales = await fetchAPI('/tareas');
        renderizarTareas(tareasActuales);
    } catch (error) {
        alert('Error al cargar tareas: ' + error.message);
    }
}

// Filtra el cache local por título (no vuelve a pedir al servidor)
function filtrarTareas() {
    const texto = document.getElementById('buscar-tarea').value.trim().toLowerCase();
    if (!texto) {
        renderizarTareas(tareasActuales);
        return;
    }
    const filtradas = tareasActuales.filter(t => t.titulo.toLowerCase().includes(texto));
    renderizarTareas(filtradas);
}

function renderizarTareas(tareas) {
    const container = document.getElementById('lista-tareas');
    if (tareas.length === 0) {
        container.innerHTML = '<div class="lista-vacia">No hay tareas todavía.</div>';
        return;
    }

    container.innerHTML = tareas.map(t => {
        const asignado = t.usuarioAsignado ? t.usuarioAsignado.email : 'Sin asignar';
        const estadoClase = t.completada ? 'completada' : 'pendiente';
        const estadoTexto = t.completada ? 'Completada' : 'Pendiente';

        const botonCompletar = (!t.completada && userRole !== 'Admin')
            ? `<button onclick="marcarCompletada(${t.id})">Marcar completada</button>`
            : '';
        const botonEliminar = (userRole === 'Admin')
            ? `<button class="eliminar" onclick="eliminarTarea(${t.id})">Eliminar</button>`
            : '';

        return `
            <div class="tarea ${estadoClase}">
                <div class="tarea-info">
                    <p class="tarea-titulo">${t.titulo}</p>
                    ${t.descripcion ? `<p class="tarea-descripcion">${t.descripcion}</p>` : ''}
                    <p class="tarea-meta">${asignado} · ${estadoTexto}</p>
                </div>
                <div class="tarea-acciones">
                    ${botonCompletar}
                    ${botonEliminar}
                </div>
            </div>
        `;
    }).join('');
}

// Admin: cargar usuarios para el select
async function cargarUsuarios() {
    try {
        const usuarios = await fetchAPI('/tareas/usuarios');
        const select = document.getElementById('new-usuario');
        select.innerHTML = usuarios.map(u => `<option value="${u.id}">${u.nombreCompleto || u.email}</option>`).join('');
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// Admin: crear tarea
async function crearTarea() {
    const titulo = document.getElementById('new-titulo').value;
    const descripcion = document.getElementById('new-descripcion').value;
    const usuarioAsignadoId = document.getElementById('new-usuario').value;
    if (!titulo || !usuarioAsignadoId) {
        alert('Título y usuario asignado son obligatorios.');
        return;
    }
    try {
        await fetchAPI('/tareas', {
            method: 'POST',
            body: JSON.stringify({ titulo, descripcion, usuarioAsignadoId })
        });
        cerrarModalTarea();
        cargarTareas();
    } catch (error) {
        alert('Error al crear tarea: ' + error.message);
    }
}

// Usuario: marcar completada
async function marcarCompletada(id) {
    try {
        await fetchAPI(`/tareas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ completada: true })
        });
        cargarTareas();
    } catch (error) {
        alert('Error al actualizar: ' + error.message);
    }
}

// Admin: eliminar tarea
async function eliminarTarea(id) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
        await fetchAPI(`/tareas/${id}`, { method: 'DELETE' });
        cargarTareas();
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

// Comprobar si ya hay token al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (savedToken && savedRole) {
        token = savedToken;
        userRole = savedRole;
        showTasks();
    } else {
        authSection.style.display = 'block';
        tasksSection.style.display = 'none';
    }
});