// Variável para armazenar dados do usuário atual
let currentUser = null;

// Função para lidar com mudanças no estado de autenticação
async function handleAuthStateChanged(user) {
    // Mostrar a tela de carregamento
    document.getElementById('loadingScreen').style.display = 'flex';
    
    if (user) {
        // Usuário está autenticado
        currentUser = user;
        
        // Buscar informações adicionais do usuário no Firestore
        try {
            const userDoc = await window.firebase.getDoc(window.firebase.doc(window.db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Atualizar informações do usuário atual
                currentUser.userData = userData;
                
                // Verificar status de aprovação
                if (user.email === window.ADMIN_EMAIL) {
                    // Administrador tem acesso total
                    showApp();
                    updateUIForAdminAccess();
                } else if (userData.status === 'approved') {
                    // Usuário aprovado
                    showApp();
                    updateUIForUserAccess(userData.accessLevel);
                } else {
                    // Usuário pendente de aprovação
                    showPendingApproval();
                }
                
                // Exibir nome na sidebar
                document.getElementById('userDisplayName').textContent = userData.displayName;
                
                // Mostrar papel no sistema
                let roleText = "";
                if (user.email === window.ADMIN_EMAIL) {
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
                    status: user.email === window.ADMIN_EMAIL ? 'approved' : 'pending',
                    accessLevel: user.email === window.ADMIN_EMAIL ? 'full' : 'none',
                    createdAt: new Date().toISOString(),
                    phone: '',
                    branch: ''
                };
                
                await window.firebase.setDoc(window.firebase.doc(window.db, 'users', user.uid), newUserData);
                
                // Atualizar informações do usuário atual
                currentUser.userData = newUserData;
                
                if (user.email === window.ADMIN_EMAIL) {
                    showApp();
                    updateUIForAdminAccess();
                } else {
                    showPendingApproval();
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            logout();
        }
    } else {
        // Usuário não está autenticado
        currentUser = null;
        showLoginForm();
    }
    
    // Ocultar a tela de carregamento após a inicialização
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1000); // Adicionamos um pequeno delay para suavizar a transição
}

// Função para fazer login
async function login(email, password) {
    try {
        const loginError = document.getElementById('loginError');
        loginError.classList.add('hidden');
        
        const credential = await window.firebase.signInWithEmailAndPassword(
            window.auth, 
            email, 
            password
        );
        
        return { success: true };
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
        
        return { success: false, error: errorMessage };
    }
}

// Função para cadastrar um novo usuário
async function register(name, email, phone, branch, password) {
    try {
        const registerError = document.getElementById('registerError');
        registerError.classList.add('hidden');
        
        // Converter nome e filial para maiúsculas
        const nameUpper = name.toUpperCase();
        const branchUpper = branch.toUpperCase();
        
        // Criar usuário na autenticação do Firebase
        const userCredential = await window.firebase.createUserWithEmailAndPassword(
            window.auth, 
            email, 
            password
        );
        
        const user = userCredential.user;
        
        // Atualizar o nome de exibição no Auth
        await window.firebase.updateProfile(user, { displayName: nameUpper });
        
        // Criar documento do usuário no Firestore
        await window.firebase.setDoc(window.firebase.doc(window.db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            displayName: nameUpper,
            phone: phone,
            branch: branchUpper,
            status: email === window.ADMIN_EMAIL ? 'approved' : 'pending',
            accessLevel: email === window.ADMIN_EMAIL ? 'full' : 'none',
            createdAt: new Date().toISOString()
        });
        
        return { success: true };
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
        
        return { success: false, error: errorMessage };
    }
}

// Função para fazer logout
async function logout() {
    try {
        await window.firebase.signOut(window.auth);
        currentUser = null;
        
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
}

// === Funções para atualizar a UI com base nas permissões ===
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
    showSection('simulator');
}

function updateUIForAdminAccess() {
    // Mostrar seção de administração
    document.getElementById('adminSection').classList.remove('hidden');
    
    // Habilitar acesso ao histórico e funcionalidade de salvar
    document.querySelectorAll('.history-access-item').forEach(item => {
        item.classList.remove('hidden');
    });
    
    document.querySelectorAll('.save-access-item').forEach(item => {
        item.classList.remove('hidden');
    });
    
    // Mostrar botão "Excluir Todas" (apenas admin pode ver esse botão)
    const deleteAllBtn = document.getElementById('deleteAllSimulationsBtn');
    if (deleteAllBtn) {
        deleteAllBtn.classList.remove('hidden');
    }
    
    // Administrador sempre tem acesso a todas as funcionalidades
    const specialDiscountContainer = document.getElementById('useSpecialDiscount').parentElement.parentElement;
    const mostruarioContainer = document.getElementById('isMostruario').parentElement.parentElement;
    
    specialDiscountContainer.classList.remove('hidden');
    mostruarioContainer.classList.remove('hidden');
    
    // Ainda verificamos o tipo de preço para mostruário
    atualizarEstadoMostruario();
}

function updateUIForUserAccess(accessLevel) {
    // Ocultar seção de administração
    document.getElementById('adminSection').classList.add('hidden');
    
    // Ocultar botão "Excluir Todas" (apenas admin pode ver)
    const deleteAllBtn = document.getElementById('deleteAllSimulationsBtn');
    if (deleteAllBtn) {
        deleteAllBtn.classList.add('hidden');
    }
    
    // Verificar permissões especiais do usuário
    const canUseSpecialDiscount = currentUser.userData.canUseSpecialDiscount === true;
    const canUseMostruario = currentUser.userData.canUseMostruario === true;
    
    // Atualizar elementos baseados nas permissões
    const specialDiscountContainer = document.getElementById('useSpecialDiscount').parentElement.parentElement;
    const mostruarioContainer = document.getElementById('isMostruario').parentElement.parentElement;
    
    if (!canUseSpecialDiscount) {
        specialDiscountContainer.classList.add('hidden');
        document.getElementById('useSpecialDiscount').checked = false;
    } else {
        specialDiscountContainer.classList.remove('hidden');
    }
    
    if (!canUseMostruario) {
        mostruarioContainer.classList.add('hidden');
        document.getElementById('isMostruario').checked = false;
    } else {
        mostruarioContainer.classList.remove('hidden');
        // Ainda verificamos o tipo de preço para habilitar/desabilitar
        atualizarEstadoMostruario();
    }
    
    if (accessLevel === 'full') {
        // Acesso total - pode visualizar histórico e salvar simulações
        document.querySelectorAll('.history-access-item').forEach(item => {
            item.classList.remove('hidden');
        });
        
        document.querySelectorAll('.save-access-item').forEach(item => {
            item.classList.remove('hidden');
        });
    } else {
        // Acesso parcial - apenas simulador
        document.querySelectorAll('.history-access-item').forEach(item => {
            item.classList.add('hidden');
        });
        
        document.querySelectorAll('.save-access-item').forEach(item => {
            item.classList.add('hidden');
        });
    }
}

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

// Exportar funções e variáveis para uso global
window.handleAuthStateChanged = handleAuthStateChanged;
window.login = login;
window.register = register;
window.logout = logout;
window.showLoginForm = showLoginForm;
window.showPendingApproval = showPendingApproval;
window.showApp = showApp;
window.updateUIForAdminAccess = updateUIForAdminAccess;
window.updateUIForUserAccess = updateUIForUserAccess;
window.switchAuthTab = switchAuthTab;
window.currentUser = currentUser;
