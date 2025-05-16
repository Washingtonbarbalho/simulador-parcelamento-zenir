// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    query, 
    orderBy, 
    limit,
    Timestamp,
    updateDoc,
    setDoc,
    where
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQlkGBnifmKmuVO_F1zDQoMClGvidvS8M",
  authDomain: "simulador-parcelameto-zenir.firebaseapp.com",
  projectId: "simulador-parcelameto-zenir",
  storageBucket: "simulador-parcelameto-zenir.firebasestorage.app",
  messagingSenderId: "1033254543995",
  appId: "1:1033254543995:web:415e32c9070e5e40a038de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Email do administrador
const ADMIN_EMAIL = "washington.wn8@gmail.com";

// Fatores de parcelamento
const FATORES = {
    cartao: [1.0292, 0.5220, 0.3530, 0.2685, 0.2179, 0.1841, 0.1600, 0.1420, 0.1280, 0.1168, 0.1076, 0.1000],
    carne: [1.0690, 0.5523, 0.3804, 0.2946, 0.2432, 0.2091, 0.1849, 0.1668, 0.1528, 0.1417, 0.1327, 0.1252]
};

// Variáveis globais
let currentUser = null;
let currentSection = 'simulator';
let simulationResults = {
    inputs: {},
    results: {}
};

// Exportar para a janela global
window.db = db;
window.auth = auth;
window.ADMIN_EMAIL = ADMIN_EMAIL;
window.FATORES = FATORES;
window.currentUser = currentUser;
window.currentSection = currentSection;
window.simulationResults = simulationResults;

// Exportar funções do Firebase
window.firebase = { 
    collection, 
    addDoc,
    getDoc,
    doc,
    deleteDoc,
    getDocs, 
    query, 
    orderBy, 
    limit,
    Timestamp,
    updateDoc,
    setDoc,
    where,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile
};

// Inicializar autenticação
window.firebase.onAuthStateChanged(auth, handleAuthStateChanged);

// Função para lidar com mudanças no estado de autenticação
async function handleAuthStateChanged(user) {
    // Mostrar a tela de carregamento
    document.getElementById('loadingScreen').style.display = 'flex';
    
    if (user) {
        // Usuário está autenticado
        window.currentUser = user;
        
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Atualizar informações do usuário atual
                window.currentUser.userData = userData;
                
                // Verificar status de aprovação
                if (user.email === ADMIN_EMAIL) {
                    showApp();
                    if (window.ui && typeof window.ui.updateUIForAdminAccess === 'function') {
                        window.ui.updateUIForAdminAccess();
                    }
                } else if (userData.status === 'approved') {
                    showApp();
                    if (window.ui && typeof window.ui.updateUIForUserAccess === 'function') {
                        window.ui.updateUIForUserAccess(userData.accessLevel);
                    }
                } else {
                    showPendingApproval();
                }
                
                // Exibir nome na sidebar
                document.getElementById('userDisplayName').textContent = userData.displayName;
                
                // Mostrar papel no sistema
                let roleText = "";
                if (user.email === ADMIN_EMAIL) {
                    roleText = "Administrador";
                } else if (userData.status === 'approved') {
                    roleText = userData.accessLevel === 'full' ? "Acesso Total" : "Acesso Parcial";
                } else {
                    roleText = "Pendente de Aprovação";
                }
                document.getElementById('userRole').textContent = roleText;
            } else {
                // Documento do usuário não existe, criar um novo
                const newUserData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    status: user.email === ADMIN_EMAIL ? 'approved' : 'pending',
                    accessLevel: user.email === ADMIN_EMAIL ? 'full' : 'none',
                    createdAt: new Date().toISOString(),
                    phone: '',
                    branch: ''
                };
                
                await setDoc(doc(db, 'users', user.uid), newUserData);
                
                // Atualizar informações do usuário atual
                window.currentUser.userData = newUserData;
                
                if (user.email === ADMIN_EMAIL) {
                    showApp();
                    if (window.ui && typeof window.ui.updateUIForAdminAccess === 'function') {
                        window.ui.updateUIForAdminAccess();
                    }
                } else {
                    showPendingApproval();
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            if (window.auth && typeof window.auth.logout === 'function') {
                window.auth.logout();
            } else {
                // Fallback se window.auth.logout não estiver disponível
                signOut(auth);
                window.currentUser = null;
                showLoginForm();
            }
        }
    } else {
        // Usuário não está autenticado
        window.currentUser = null;
        showLoginForm();
    }
    
    // Ocultar a tela de carregamento após a inicialização
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1000);
}

// Funções básicas de UI para dar suporte à autenticação
function showLoginForm() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('pendingApprovalSection').classList.add('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

function showPendingApproval() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('pendingApprovalSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

function showApp() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('pendingApprovalSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    
    // Por padrão, mostrar o simulador
    document.getElementById('simulatorSection').classList.remove('hidden');
    document.getElementById('historySection').classList.add('hidden');
    document.getElementById('usersSection').classList.add('hidden');
}

// Inicializar os event listeners de autenticação antes de outros módulos serem carregados
document.addEventListener('DOMContentLoaded', function() {
    // Configurar formulário de login
    document.getElementById('loginBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validação básica
        if (!email || !password) {
            document.getElementById('loginError').textContent = 'Preencha todos os campos.';
            document.getElementById('loginError').classList.remove('hidden');
            return;
        }
        
        try {
            document.getElementById('loginError').classList.add('hidden');
            
            await signInWithEmailAndPassword(auth, email, password);
            // O listener onAuthStateChanged irá cuidar da transição da UI
        } catch (error) {
            console.error('Erro no login:', error);
            
            // Traduzir mensagens de erro
            let errorMessage = 'Ocorreu um erro durante o login. Tente novamente.';
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'E-mail ou senha incorretos.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            }
            
            document.getElementById('loginError').textContent = errorMessage;
            document.getElementById('loginError').classList.remove('hidden');
        }
    });
    
    // Configurar formulário de cadastro
    document.getElementById('registerBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const branch = document.getElementById('registerBranch').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        
        // Validação
        if (!name || !email || !phone || !branch || !password || !passwordConfirm) {
            document.getElementById('registerError').textContent = 'Preencha todos os campos.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        if (password !== passwordConfirm) {
            document.getElementById('registerError').textContent = 'As senhas não coincidem.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('registerError').textContent = 'A senha deve ter pelo menos 6 caracteres.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        // Validar formato do telefone
        if (!phone.match(/^\(\d{2}\)\s*\d{5}-\d{4}$/)) {
            document.getElementById('registerError').textContent = 'Formato de telefone inválido.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        try {
            document.getElementById('registerError').classList.add('hidden');
            
            // Converter nome e filial para maiúsculas
            const nameUpper = name.toUpperCase();
            const branchUpper = branch.toUpperCase();
            
            // Criar usuário na autenticação do Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            const user = userCredential.user;
            
            // Atualizar o nome de exibição no Auth
            await updateProfile(user, { displayName: nameUpper });
            
            // Criar documento do usuário no Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                displayName: nameUpper,
                phone: phone,
                branch: branchUpper,
                status: email === ADMIN_EMAIL ? 'approved' : 'pending',
                accessLevel: email === ADMIN_EMAIL ? 'full' : 'none',
                createdAt: new Date().toISOString()
            });
            
            // Mostrar mensagem de sucesso
            document.getElementById('registerSuccess').classList.remove('hidden');
            
            // Esconder o formulário
            document.getElementById('registerForm').classList.add('hidden');
            
            // Redirecionar para login após 3 segundos
            setTimeout(() => {
                showPendingApproval();
            }, 3000);
        } catch (error) {
            console.error('Erro no cadastro:', error);
            
            // Traduzir mensagens de erro
            let errorMessage = 'Ocorreu um erro durante o cadastro. Tente novamente.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está sendo utilizado.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
            }
            
            document.getElementById('registerError').textContent = errorMessage;
            document.getElementById('registerError').classList.remove('hidden');
        }
    });

    // Configurar logout 
    document.getElementById('logoutBtnPending').addEventListener('click', async function() {
        try {
            await signOut(auth);
            window.currentUser = null;
            
            // Limpar campos de login
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            
            // Limpar campos de registro
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPhone').value = '';
            document.getElementById('registerBranch').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerPasswordConfirm').value = '';
            
            // Esconder mensagens de erro
            document.getElementById('loginError').classList.add('hidden');
            document.getElementById('registerError').classList.add('hidden');
            document.getElementById('registerSuccess').classList.add('hidden');
            
            // Voltar para a aba de login
            switchAuthTab('login');
            
            // Exibir tela de login
            showLoginForm();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });
    
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        try {
            await signOut(auth);
            window.currentUser = null;
            
            // Limpar campos de login
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            
            // Limpar campos de registro
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPhone').value = '';
            document.getElementById('registerBranch').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerPasswordConfirm').value = '';
            
            // Esconder mensagens de erro
            document.getElementById('loginError').classList.add('hidden');
            document.getElementById('registerError').classList.add('hidden');
            document.getElementById('registerSuccess').classList.add('hidden');
            
            // Voltar para a aba de login
            switchAuthTab('login');
            
            // Exibir tela de login
            showLoginForm();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });
    
    // Configurar abas de autenticação
    document.getElementById('loginTabBtn').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('forgotPasswordTabBtn').addEventListener('click', () => switchAuthTab('forgotPassword'));
    
    // Toggle de visibilidade de senha
    document.getElementById('toggleLoginPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('loginPassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    document.getElementById('toggleRegisterPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('registerPassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    document.getElementById('toggleRegisterPasswordConfirm').addEventListener('click', function() {
        const passwordInput = document.getElementById('registerPasswordConfirm');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    // Configurar o botão de salvar status no modal de detalhes
    if (document.getElementById('saveStatusBtn')) {
        document.getElementById('saveStatusBtn').addEventListener('click', async () => {
            const simulationId = document.getElementById('simulationDetailsModal').getAttribute('data-simulation-id');
            const newStatus = document.getElementById('simulationStatus').value;
            
            if (simulationId) {
                try {
                    // Mostrar loading no botão
                    const saveBtn = document.getElementById('saveStatusBtn');
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
                    saveBtn.disabled = true;
                    
                    // Atualizar status no Firestore
                    const simulationRef = doc(db, "simulacoes", simulationId);
                    await updateDoc(simulationRef, {
                        status: newStatus
                    });
                    
                    // Mostrar notificação toast
                    if (window.utils && typeof window.utils.showToast === 'function') {
                        window.utils.showToast('Status atualizado com sucesso!', 'success');
                    } else {
                        console.log('Status atualizado com sucesso!');
                    }
                    
                    // Recarregar o histórico se a função estiver disponível
                    if (window.history && typeof window.history.loadSimulationHistory === 'function') {
                        window.history.loadSimulationHistory();
                    }
                    
                    // Fechar o modal de detalhes
                    const modal = document.getElementById('simulationDetailsModal');
                    const detailsModal = document.querySelector('.details-modal');
                    
                    if (detailsModal) {
                        detailsModal.classList.remove('open');
                    }
                    
                    setTimeout(() => {
                        modal.classList.add('hidden');
                    }, 300);
                } catch (error) {
                    console.error('Erro ao atualizar status:', error);
                    if (window.utils && typeof window.utils.showToast === 'function') {
                        window.utils.showToast('Erro ao atualizar status. Tente novamente.', 'error');
                    }
                    
                    // Restaurar estado original do botão
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
            }
        });
    }
    
    // Manipulador para salvar simulação
    if (document.getElementById('saveSimulationForm')) {
        document.getElementById('saveSimulationForm').addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Validar campos
            const clientName = document.getElementById('clientName').value.trim();
            const clientPhone = document.getElementById('clientPhone').value.trim();
            const productName = document.getElementById('productName').value.trim();
            
            if (!clientName || !clientPhone || !productName) {
                document.getElementById('errorText').textContent = 'Preencha todos os campos.';
                document.getElementById('saveErrorMessage').classList.remove('hidden');
                document.getElementById('saveSimulationForm').classList.add('hidden');
                return;
            }
            
            // Validar formato do telefone
            if (!clientPhone.match(/^\(\d{2}\)\d{5}-\d{4}$/)) {
                document.getElementById('errorText').textContent = 'Formato de telefone inválido. Use (00)00000-0000.';
                document.getElementById('saveErrorMessage').classList.remove('hidden');
                document.getElementById('saveSimulationForm').classList.add('hidden');
                return;
            }
            
            // Esconder o formulário durante o processamento
            document.getElementById('saveSimulationForm').classList.add('hidden');
            
            try {
                // Obter o próximo número de cliente
                let clientNumber;
                try {
                    if (window.history && typeof window.history.getNextClientNumber === 'function') {
                        clientNumber = await window.history.getNextClientNumber();
                    } else {
                        clientNumber = Math.floor(Date.now() / 1000); // Fallback
                        console.error("Função getNextClientNumber não está disponível");
                        if (window.debug && typeof window.debug.showDebugMessage === 'function') {
                            window.debug.showDebugMessage("Função getNextClientNumber não está disponível", 'warning');
                        }
                    }
                } catch (e) {
                    console.error("Erro ao obter número de cliente:", e);
                    clientNumber = Math.floor(Date.now() / 1000); // Fallback
                }
                
                const clienteZenirId = `CLIENTE ZENIR ${clientNumber}`;
                
                // Preparar dados para o Firestore
                const dadosCompletos = {
                    cliente: {
                        nome: clientName.toUpperCase(),
                        telefone: clientPhone,
                        produto: productName.toUpperCase(),
                        codigo: clienteZenirId
                    },
                    simulacao: window.simulationResults,
                    dataHora: new Date().toISOString(),
                    status: "Pendente", // Status inicial
                    userId: window.currentUser.uid, // ID do usuário que criou a simulação
                    userName: window.currentUser.userData?.displayName || window.currentUser.email, // Nome do usuário que criou
                    userBranch: window.currentUser.userData?.branch || '' // Filial do usuário
                };
                
                // Salvar no Firestore
                const docRef = await addDoc(collection(db, "simulacoes"), dadosCompletos);
                
                // Mostrar mensagem de sucesso
                document.getElementById('saveSuccessMessage').classList.remove('hidden');
            } catch (error) {
                console.error("Erro ao salvar a simulação:", error);
                if (window.debug && typeof window.debug.showDebugMessage === 'function') {
                    window.debug.showDebugMessage(`Erro ao salvar: ${error.message}`, 'error');
                }
                
                // Mostrar mensagem de erro
                document.getElementById('errorText').textContent = `Erro ao salvar: ${error.message}`;
                document.getElementById('saveErrorMessage').classList.remove('hidden');
            }
        });
    }
});

// Função de alternância das abas de autenticação
function switchAuthTab(tab) {
    // Ocultar todos os formulários e desativar todos os botões
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    
    document.getElementById('loginTabBtn').classList.remove('border-primary', 'text-primary');
    document.getElementById('loginTabBtn').classList.add('border-transparent', 'text-gray-500');
    
    document.getElementById('registerTabBtn').classList.remove('border-primary', 'text-primary');
    document.getElementById('registerTabBtn').classList.add('border-transparent', 'text-gray-500');
    
    document.getElementById('forgotPasswordTabBtn').classList.remove('border-primary', 'text-primary');
    document.getElementById('forgotPasswordTabBtn').classList.add('border-transparent', 'text-gray-500');
    
    // Ativar formulário e botão da aba selecionada
    if (tab === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('loginTabBtn').classList.remove('border-transparent', 'text-gray-500');
        document.getElementById('loginTabBtn').classList.add('border-primary', 'text-primary');
    } else if (tab === 'register') {
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('registerTabBtn').classList.remove('border-transparent', 'text-gray-500');
        document.getElementById('registerTabBtn').classList.add('border-primary', 'text-primary');
    } else if (tab === 'forgotPassword') {
        document.getElementById('forgotPasswordForm').classList.remove('hidden');
        document.getElementById('forgotPasswordTabBtn').classList.remove('border-transparent', 'text-gray-500');
        document.getElementById('forgotPasswordTabBtn').classList.add('border-primary', 'text-primary');
    }
}

// Exportar funções para outros módulos
export { 
    db, 
    auth, 
    ADMIN_EMAIL, 
    FATORES, 
    currentUser, 
    currentSection, 
    simulationResults,
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit,
    where,
    getDoc,
    doc,
    deleteDoc,
    Timestamp,
    updateDoc,
    setDoc,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile
};
