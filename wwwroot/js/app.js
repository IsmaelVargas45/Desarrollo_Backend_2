// Configuración
const API_URL = '/api'; // Cambia por tu puerto

// Estado
let token = localStorage.getItem('token');
let userRole = '';
let userId = '';
let tareasActuales = []; // cache de la última carga, para filtrar sin volver a pedir al servidor
let tareaEditandoId = null;

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

    // ✅ Si es login y da 401, NO lo tratamos como sesión expirada
    if (response.status === 401 && endpoint === '/auth/login') {
        // Dejamos que el login maneje el error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales inválidas');
    }

    if (response.status === 401) {
        // Para cualquier otro endpoint, sesión expirada
        logout();
        throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
}

// Autenticación
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    console.log('Intentando login con:', { email, password: password ? '****' : '' });
    try {
        const data = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        // Dentro de login, después de obtener data
        console.log('Token:', data.token);
        localStorage.setItem('token', data.token);
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
// Función de registro con validación y manejo detallado de errores
async function register() {
    const nombre = document.getElementById('register-nombre').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');
    errorDiv.style.display = 'none'; // ocultar error previo

    // ✅ Validación previa en el frontend (opcional pero recomendable)
    if (!nombre || !email || !password) {
        mostrarErrorRegistro('Todos los campos son obligatorios.');
        return;
    }

    if (password.length < 6) {
        mostrarErrorRegistro('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    // (Opcional) Validar mayúscula, minúscula, número y símbolo con regex
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /\d/.test(password);
    const tieneSimbolo = /[^A-Za-z0-9]/.test(password);

    if (!tieneMayuscula || !tieneMinuscula || !tieneNumero || !tieneSimbolo) {
        mostrarErrorRegistro(
            'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo (ej: !@#$%).'
        );
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombreCompleto: nombre,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // 🔍 Capturamos los errores devueltos por Identity
            let mensajeError = data.message || 'Error al registrar usuario.';

            // Si hay una lista de errores (Identity devuelve "errors")
            if (data.errors && Array.isArray(data.errors)) {
                // Si son objetos con "description", los extraemos
                const descripciones = data.errors.map(e => e.description || e).join('\n');
                mensajeError += '\n' + descripciones;
            } else if (data.errors && typeof data.errors === 'object') {
                // A veces viene un objeto con claves
                const erroresTexto = Object.values(data.errors).flat().join('\n');
                mensajeError += '\n' + erroresTexto;
            }

            throw new Error(mensajeError);
        }

        // ✅ Registro exitoso
        alert('¡Usuario registrado correctamente! Ahora inicia sesión.');
        showLogin();
        // Limpiar formulario
        document.getElementById('register-nombre').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';

    } catch (error) {
        mostrarErrorRegistro(error.message);
    }
}

// Función auxiliar para mostrar errores en el div
function mostrarErrorRegistro(mensaje) {
    const errorDiv = document.getElementById('register-error');
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
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
    document.getElementById('titulo-tarea').textContent = userRole === 'Admin' ? 'Todas las Tareas' : 'Mis Tareas';

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
    tareaEditandoId = null;

    document.getElementById('titulo-modal-tarea').textContent =
        'Crear nueva tarea';

    document.getElementById('btn-guardar-tarea').textContent =
        'Crear';

    document.getElementById('new-titulo').value = '';
    document.getElementById('new-descripcion').value = '';

    adminPanelOverlay.style.display = 'flex';
    document.getElementById('new-titulo').focus();
    document.addEventListener('keydown', cerrarModalTareaConEsc);
}

function cerrarModalTarea() {
    adminPanelOverlay.style.display = 'none';
    document.getElementById('new-titulo').value = '';
    document.getElementById('new-descripcion').value = '';
    document.getElementById('new-usuario').selectedIndex = 0;
    tareaEditandoId = null;
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
        const botonEditar = (userRole === 'Admin')
            ? `<button onclick="abrirEditarTarea(${t.id})">Editar</button>`
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
                    ${botonEditar}
                    ${botonEliminar}
                </div>
            </div>
        `;
    }).join('');
}
// Admin: editar tarea (solo título y descripción, no reasignar ni cambiar estado)
function abrirEditarTarea(id) {
    const tarea = tareasActuales.find(t => t.id === id);
    if (!tarea) return;

    tareaEditandoId = id;

    document.getElementById('new-titulo').value = tarea.titulo;
    document.getElementById('new-descripcion').value =
        tarea.descripcion || '';
    document.getElementById('new-usuario').value =
        tarea.usuarioAsignadoId;

    document.getElementById('titulo-modal-tarea').textContent =
        'Editar tarea';

    document.getElementById('btn-guardar-tarea').textContent =
        'Guardar cambios';

    adminPanelOverlay.style.display = 'flex';
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

// Admin: guardar tarea (decide si crear o editar según el estado de tareaEditandoId)
function guardarTarea() {
    if (tareaEditandoId === null) {
        crearTarea();
    } else {
        editarTarea();
    }
}
// Admin: editar tarea
async function editarTarea() {
    const titulo = document.getElementById('new-titulo').value;
    const descripcion = document.getElementById('new-descripcion').value;
    const usuarioAsignadoId =
        document.getElementById('new-usuario').value;

    try {
        await fetchAPI(`/tareas/${tareaEditandoId}`, {
            method: 'PUT',
            body: JSON.stringify({
                titulo,
                descripcion,
                usuarioAsignadoId
            })
        });

        cerrarModalTarea();
        cargarTareas();
    } catch (error) {
        alert('Error al editar: ' + error.message);
    }
}
// Usuario: marcar completada
async function marcarCompletada(id) {
    try {
        await fetchAPI(`/tareas/${id}/completar`, {
            method: 'PATCH'
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

// Verifica si el JWT guardado todavía es válido (no vencido), sin pegarle al servidor.
function tokenEsValido(jwt) {
    if (!jwt) return false;
    try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        if (!payload.exp) return false;
        const expiraEnMs = payload.exp * 1000;
        return Date.now() < expiraEnMs;
    } catch {
        return false;
    }
}

// Comprobar si ya hay token al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');

    if (savedToken && savedRole && tokenEsValido(savedToken)) {
        token = savedToken;
        userRole = savedRole;
        showTasks();
    } else {
        // Token ausente, vencido o corrupto: limpiamos todo y mostramos login
        logout();
    }
});