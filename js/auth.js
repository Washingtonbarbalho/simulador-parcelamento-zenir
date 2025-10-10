// Módulo de Autenticação (auth.js)
// Lida com login, registro, logout e estado do usuário.

import { db, auth, firebase } from './firebase-init.js';
import { ADMIN_EMAIL } from './config.js';
import * as UI from './ui.js';

export let currentUser = null;

// --- Funções Principais de Autenticação ---

export async function handleAuthStateChanged(user) {
    document.getElementById('loadingScreen').style.display = 'flex';
    if (user) {
        try {
            const userDoc = await firebase.getDoc(firebase.doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                currentUser = { ...user, userData: userDoc.data() };
            } else {
                // Se o documento não existir (caso raro, talvez de um cadastro antigo), cria um.
                const newUserData = {
                    uid: user.uid, email: user.email, displayName: user.displayName || user.email.split('@')[0],
                    status: user.email === ADMIN_EMAIL ? 'approved' : 'pending',
                    accessLevel: user.email === ADMIN_EMAIL ? 'full' : 'none',
                    createdAt: new Date().toISOString(), phone: '', branch: ''
                };
                await firebase.setDoc(firebase.doc(db, 'users', user.uid), newUserData);
                currentUser = { ...user, userData: newUserData };
            }
            
            UI.setCurrentUserData(currentUser);

            // Roteamento baseado no status do usuário
            if (user.email === ADMIN_EMAIL) {
                UI.showApp();
                UI.updateUIForAdminAccess();
            } else if (currentUser.userData.status === 'approved') {
                UI.showApp();
                UI.updateUIForUserAccess(currentUser.userData);
            } else {
                UI.showPendingApproval();
            }

            document.getElementById('userDisplayName').textContent = currentUser.userData.displayName;
            document.getElementById('userRole').textContent = determineUserRole(currentUser);

        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            logout();
        }
    } else {
        currentUser = null;
        UI.setCurrentUserData(null);
        UI.showLoginForm();
    }
    setTimeout(() => { document.getElementById('loadingScreen').style.display = 'none'; }, 500);
}

async function login(email, password) {
    try {
        await firebase.signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

async function register(name, email, phone, branch, password) {
    try {
        const userCredential = await firebase.createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await firebase.updateProfile(user, { displayName: name.toUpperCase() });
        
        await firebase.setDoc(firebase.doc(db, 'users', user.uid), {
            uid: user.uid, email, displayName: name.toUpperCase(), phone,
            branch: branch.toUpperCase(),
            status: email === ADMIN_EMAIL ? 'approved' : 'pending',
            accessLevel: email === ADMIN_EMAIL ? 'full' : 'none',
            createdAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

export async function logout() {
    try {
        await firebase.signOut(auth);
        // A lógica de UI é tratada pelo onAuthStateChanged
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
}


// --- Funções Auxiliares ---

function determineUserRole(user) {
    if (user.email === ADMIN_EMAIL) return "Administrador";
    if (user.userData.status === 'approved') {
        return user.userData.accessLevel === 'full' ? "Acesso Total" : "Acesso Parcial";
    }
    return "Pendente de Aprovação";
}

function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'E-mail ou senha incorretos.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas de login. Tente novamente mais tarde.';
        case 'auth/invalid-email':
            return 'E-mail inválido.';
        case 'auth/email-already-in-use':
            return 'Este e-mail já está sendo utilizado.';
        case 'auth/weak-password':
            return 'Senha muito fraca. Use pelo menos 6 caracteres.';
        default:
            return 'Ocorreu um erro. Tente novamente.';
    }
}


// --- Configuração de Eventos ---

export function setupAuthEventListeners() {
    // Abas
    document.getElementById('loginTabBtn').addEventListener('click', () => UI.switchAuthTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => UI.switchAuthTab('register'));
    document.getElementById('forgotPasswordTabBtn').addEventListener('click', () => UI.switchAuthTab('forgotPassword'));

    // Botões de Logout
    document.getElementById('logoutBtnPending').addEventListener('click', logout);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Formulário de Login
    document.getElementById('loginBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!email || !password) {
            errorDiv.textContent = 'Preencha todos os campos.';
            errorDiv.classList.remove('hidden');
            return;
        }
        errorDiv.classList.add('hidden');
        
        const result = await login(email, password);
        if (!result.success) {
            errorDiv.textContent = result.error;
            errorDiv.classList.remove('hidden');
        }
    });

    // Formulário de Cadastro
    document.getElementById('registerBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const branch = document.getElementById('registerBranch').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const errorDiv = document.getElementById('registerError');

        // Validações
        if (!name || !email || !phone || !branch || !password || !passwordConfirm) {
            errorDiv.textContent = 'Preencha todos os campos.';
            return errorDiv.classList.remove('hidden');
        }
        if (password !== passwordConfirm) {
            errorDiv.textContent = 'As senhas não coincidem.';
            return errorDiv.classList.remove('hidden');
        }
        if (password.length < 6) {
             errorDiv.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            return errorDiv.classList.remove('hidden');
        }
        errorDiv.classList.add('hidden');

        const result = await register(name, email, phone, branch, password);
        if (result.success) {
            document.getElementById('registerSuccess').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
            // O onAuthStateChanged vai lidar com o redirecionamento
        } else {
            errorDiv.textContent = result.error;
            errorDiv.classList.remove('hidden');
        }
    });
}
