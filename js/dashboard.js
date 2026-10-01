document.addEventListener('DOMContentLoaded', () => {
    const currentSession = JSON.parse(
        localStorage.getItem('olympus_session') || sessionStorage.getItem('olympus_session')
    );

    setupNavbar(currentSession);
    renderDashboard();
    setupEvents(currentSession);
});

function setupNavbar(session) {
    // Renderizado datos usuario activo
    document.getElementById('headerUserName').textContent = session.nombre;
    document.getElementById('headerUserRole').textContent = session.rol;
    document.getElementById('mobileUserName').textContent = session.nombre;
    document.getElementById('mobileUserRole').textContent = session.rol;

    // Menú Hamburguesa Móvil
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
        });
    }

    // Botón Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('olympus_session');
        sessionStorage.removeItem('olympus_session');
        window.location.href = 'index.html';
    });
}

function renderDashboard() {
    const users = JSON.parse(localStorage.getItem('olympus_users') || '[]');
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const roleVal = document.getElementById('roleFilter').value;
    const statusVal = document.getElementById('statusFilter').value;

    // Actualizar KPIs
    document.getElementById('kpiTotalUsers').textContent = users.length;
    document.getElementById('kpiActiveUsers').textContent = users.filter(u => u.estado === 'Activo').length;
    document.getElementById('kpiAdminUsers').textContent = users.filter(u => u.rol === 'Admin').length;

    // Filtrar Lista
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.nombre.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
        const matchesRole = roleVal === 'Todos' || u.rol === roleVal;
        const matchesStatus = statusVal === 'Todos' || u.estado === statusVal;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const currentSession = JSON.parse(
        localStorage.getItem('olympus_session') || sessionStorage.getItem('olympus_session')
    );

    const tbody = document.getElementById('directoryTableBody');
    tbody.innerHTML = '';

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No se encontraron registros.</td></tr>`;
        return;
    }

    filteredUsers.forEach(user => {
        const tr = document.createElement('tr');
        
        // Determinar qué mostrar en la columna de acciones según los permisos del usuario activo
        const hasEditPermission = canEdit(currentSession.rol);
        const hasDeletePermission = canDelete(currentSession.rol);
        
        let actionsHtml = '';

        if (hasEditPermission || hasDeletePermission) {
            if (hasEditPermission) {
                actionsHtml += `
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('${user.id}')" title="Editar">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                `;
            }
            if (hasDeletePermission) {
                actionsHtml += `
                    <button class="btn btn-secondary btn-sm" style="color: var(--danger)" onclick="deleteUser('${user.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
            }
        } else {
            // Si es Cliente (sin permisos), renderizamos una marca de Solo Lectura para mantener la estructura simétrica
            actionsHtml = `<span class="read-only-tag" title="Sin permisos de modificación"><i class="fa-solid fa-lock"></i> Solo lectura</span>`;
        }

        tr.innerHTML = `
            <td><strong>${user.nombre}</strong></td>
            <td>${user.email}</td>
            <td><span class="badge-role">${user.rol}</span></td>
            <td><span class="status-badge ${user.estado.toLowerCase()}">${user.estado}</span></td>
            <td class="action-btns">${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function canEdit(rol) { return rol === 'Admin' || rol === 'Colaborador'; }
function canDelete(rol) { return rol === 'Admin'; }

function setupEvents(session) {
    // Restringir botón de Crear
    const btnCreate = document.getElementById('btnOpenCreateModal');
    if (!canEdit(session.rol)) {
        btnCreate.style.display = 'none';
    }

    btnCreate.addEventListener('click', () => {
        document.getElementById('userForm').reset();
        document.getElementById('userIdHidden').value = '';
        document.getElementById('modalTitle').textContent = 'Registrar Nueva Persona';
        document.getElementById('userModal').style.display = 'flex';
    });

    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancelModal').addEventListener('click', closeModal);

    // Eventos de Filtro y Buscador
    document.getElementById('searchInput').addEventListener('input', renderDashboard);
    document.getElementById('roleFilter').addEventListener('change', renderDashboard);
    document.getElementById('statusFilter').addEventListener('change', renderDashboard);

    // Guardar / Modificar Usuario
    document.getElementById('userForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('userIdHidden').value;
        const nombre = document.getElementById('modalNombre').value.trim();
        const email = document.getElementById('modalEmail').value.trim();
        const rol = document.getElementById('modalRol').value;
        const estado = document.getElementById('modalEstado').value;

        let users = JSON.parse(localStorage.getItem('olympus_users') || '[]');

        if (id) {
            // Modificar existente
            users = users.map(u => u.id === id ? { ...u, nombre, email, rol, estado } : u);
        } else {
            // Crear Nuevo
            users.push({ id: Date.now().toString(), nombre, email, passwordHash: '', rol, estado });
        }

        localStorage.setItem('olympus_users', JSON.stringify(users));
        closeModal();
        renderDashboard();
    });
}

function closeModal() {
    document.getElementById('userModal').style.display = 'none';
}

function openEditModal(id) {
    const users = JSON.parse(localStorage.getItem('olympus_users') || '[]');
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById('userIdHidden').value = user.id;
    document.getElementById('modalNombre').value = user.nombre;
    document.getElementById('modalEmail').value = user.email;
    document.getElementById('modalRol').value = user.rol;
    document.getElementById('modalEstado').value = user.estado;

    document.getElementById('modalTitle').textContent = 'Editar Datos de Persona';
    document.getElementById('userModal').style.display = 'flex';
}

function deleteUser(id) {
    if (confirm('¿Estás seguro de dar de baja a este usuario?')) {
        let users = JSON.parse(localStorage.getItem('olympus_users') || '[]');
        users = users.filter(u => u.id !== id);
        localStorage.setItem('olympus_users', JSON.stringify(users));
        renderDashboard();
    }
}