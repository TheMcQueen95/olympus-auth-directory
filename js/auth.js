document.addEventListener('DOMContentLoaded', () => {
    initDefaultUsers();
    setupPasswordValidation();
});

// Función Utilitaria: Generar Hash SHA-256 real con Web Crypto API
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Inicializar un Admin por defecto en localStorage si está vacío
async function initDefaultUsers() {
    if (!localStorage.getItem('olympus_users')) {
        const defaultAdminPwd = await hashPassword('Admin123');
        const initialUsers = [
            {
                id: '1',
                nombre: 'Administrador Olympus',
                email: 'admin@olympus.cl',
                passwordHash: defaultAdminPwd,
                rol: 'Admin',
                estado: 'Activo'
            },
            {
                id: '2',
                nombre: 'Sebastián Colaborador',
                email: 'colaborador@olympus.cl',
                passwordHash: defaultAdminPwd,
                rol: 'Colaborador',
                estado: 'Activo'
            }
        ];
        localStorage.setItem('olympus_users', JSON.stringify(initialUsers));
    }
}

// Control de Tabs Login/Registro
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.getElementById('tabLoginBtn').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('tabRegisterBtn').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// Alternar visibilidad de contraseña (Ojito)
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Validaciones en tiempo real del registro
function setupPasswordValidation() {
    const regPassword = document.getElementById('regPassword');
    if (!regPassword) return;

    regPassword.addEventListener('input', () => {
        const pwd = regPassword.value;
        
        updateHint('hintLength', pwd.length >= 8);
        updateHint('hintUpper', /[A-Z]/.test(pwd));
        updateHint('hintNumber', /[0-9]/.test(pwd));
    });
}

function updateHint(elementId, isValid) {
    const elem = document.getElementById(elementId);
    const icon = elem.querySelector('i');
    if (isValid) {
        elem.classList.add('valid');
        icon.classList.replace('fa-circle-xmark', 'fa-circle-check');
    } else {
        elem.classList.remove('valid');
        icon.classList.replace('fa-circle-check', 'fa-circle-xmark');
    }
}

// Manejo de Inicio de Sesión
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    const users = JSON.parse(localStorage.getItem('olympus_users') || '[]');
    const pwdHash = await hashPassword(pwd);

    const user = users.find(u => u.email === email && u.passwordHash === pwdHash);

    if (!user) {
        showAlert('Credenciales incorrectas o usuario inexistente.', 'danger');
        return;
    }

    if (user.estado === 'Inactivo') {
        showAlert('Tu cuenta se encuentra inactiva. Contacta al administrador.', 'danger');
        return;
    }

    // Guardar sesión activa
    const sessionData = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
    if (rememberMe) {
        localStorage.setItem('olympus_session', JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem('olympus_session', JSON.stringify(sessionData));
    }

    showAlert('¡Acceso correcto! Redirigiendo...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
});

// Manejo de Registro
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const rol = document.getElementById('regRole').value;
    const pwd = document.getElementById('regPassword').value;

    if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
        showAlert('La contraseña no cumple con los requisitos de seguridad.', 'danger');
        return;
    }

    const users = JSON.parse(localStorage.getItem('olympus_users') || '[]');
    if (users.some(u => u.email === email)) {
        showAlert('El correo ya se encuentra registrado.', 'danger');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        nombre,
        email,
        passwordHash: await hashPassword(pwd),
        rol,
        estado: 'Activo'
    };

    users.push(newUser);
    localStorage.setItem('olympus_users', JSON.stringify(users));

    showAlert('Cuenta creada exitosamente. Ya puedes iniciar sesión.', 'success');
    switchTab('login');
});

function showAlert(message, type) {
    const alertBox = document.getElementById('authAlert');
    alertBox.className = `auth-alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
}