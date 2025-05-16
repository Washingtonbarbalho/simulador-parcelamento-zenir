// ui.js - Gerenciamento da interface do usuário
import { formatPhoneNumber, toUpperCaseInput } from './utilities.js';
import { ADMIN_EMAIL } from './config.js';

// Inicialização da UI
export function initUI() {
    setupSidebar();
    setupNavigation();
    setupPhoneFormatting();
    setupModalCloseButtons();
}

// Função para configurar o menu lateral
function setupSidebar() {
    // Manipuladores para o menu lateral
    document.getElementById('openSidebar').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('open');
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
        }, 10);
    });
    
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);
    
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.remove('open');
        overlay.classList.add('opacity-0');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
    }
}

// Função para configurar navegação entre seções
function setupNavigation() {
    // Trocar entre seções
    document.getElementById('showSimulator').addEventListener('click', function(e) {
        e.preventDefault();
        if (window.currentSection !== 'simulator') {
            window.auth.showSection('simulator');
            closeSidebar();
        }
    });
    
    document.getElementById('showHistory').addEventListener('click', function(e) {
        e.preventDefault();
        if (window.currentSection !== 'history') {
            window.auth.showSection('history');
            window.history.loadSimulationHistory();
            closeSidebar();
        }
    });
    
    document.getElementById('showUsers').addEventListener('click', function(e) {
        e.preventDefault();
        if (window.currentSection !== 'users') {
            window.auth.showSection('users');
            window.admin.loadUsers();
            closeSidebar();
        }
    });
}

// Função para fechar o menu lateral
export function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.remove('open');
    overlay.classList.add('opacity-0');
    
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

// Configurar formatação de telefone
function setupPhoneFormatting() {
    // Aplicar formatação no cadastro
    document.getElementById('registerPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    // Aplicar formatação no editar usuário
    if (document.getElementById('editUserPhone')) {
        document.getElementById('editUserPhone').addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
    
    // Aplicar formatação no telefone do cliente
    if (document.getElementById('clientPhone')) {
        document.getElementById('clientPhone').addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
    
    // Adicionar função toUpperCase para campos de texto - Cadastro
    document.getElementById('registerName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    document.getElementById('registerBranch').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    // Adicionar função toUpperCase para campos de texto - Edição de usuário
    if (document.getElementById('editUserName')) {
        document.getElementById('editUserName').addEventListener('input', function() {
            toUpperCaseInput(this);
        });
    }
    
    if (document.getElementById('editUserBranch')) {
        document.getElementById('editUserBranch').addEventListener('input', function() {
            toUpperCaseInput(this);
        });
    }
}

// Configurar botões para fechar modais
function setupModalCloseButtons() {
    // Modal de detalhes da simulação
    if (document.getElementById('closeDetailsModal')) {
        document.getElementById('closeDetailsModal').addEventListener('click', closeSimulationDetailsModal);
    }
    
    if (document.getElementById('closeDetailsBtn')) {
        document.getElementById('closeDetailsBtn').addEventListener('click', closeSimulationDetailsModal);
    }
    
    // Modal de edição de usuários
    if (document.getElementById('closeEditUserModal')) {
        document.getElementById('closeEditUserModal').addEventListener('click', function() {
            document.getElementById('editUserModal').classList.add('hidden');
        });
    }
    
    if (document.getElementById('cancelEditUserBtn')) {
        document.getElementById('cancelEditUserBtn').addEventListener('click', function() {
            document.getElementById('editUserModal').classList.add('hidden');
        });
    }
}

// Fechar modal de detalhes da simulação
export function closeSimulationDetailsModal() {
    const modal = document.getElementById('simulationDetailsModal');
    const detailsModal = document.querySelector('.details-modal');
    
    if (detailsModal) {
        detailsModal.classList.remove('open');
    }
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Funções para atualizar a UI com base nas permissões
export function updateUIForAdminAccess() {
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
    
    if (specialDiscountContainer) specialDiscountContainer.classList.remove('hidden');
    if (mostruarioContainer) mostruarioContainer.classList.remove('hidden');
    
    // Ainda verificamos o tipo de preço para mostruário
    window.simulator.atualizarEstadoMostruario();
}

export function updateUIForUserAccess(accessLevel) {
    // Ocultar seção de administração
    document.getElementById('adminSection').classList.add('hidden');
    
    // Ocultar botão "Excluir Todas" (apenas admin pode ver)
    const deleteAllBtn = document.getElementById('deleteAllSimulationsBtn');
    if (deleteAllBtn) {
        deleteAllBtn.classList.add('hidden');
    }
    
    // Verificar permissões especiais do usuário
    const canUseSpecialDiscount = window.currentUser.userData.canUseSpecialDiscount === true;
    const canUseMostruario = window.currentUser.userData.canUseMostruario === true;
    
    // Atualizar elementos baseados nas permissões
    const specialDiscountContainer = document.getElementById('useSpecialDiscount').parentElement.parentElement;
    const mostruarioContainer = document.getElementById('isMostruario').parentElement.parentElement;
    
    if (specialDiscountContainer) {
        if (!canUseSpecialDiscount) {
            specialDiscountContainer.classList.add('hidden');
            document.getElementById('useSpecialDiscount').checked = false;
        } else {
            specialDiscountContainer.classList.remove('hidden');
        }
    }
    
    if (mostruarioContainer) {
        if (!canUseMostruario) {
            mostruarioContainer.classList.add('hidden');
            document.getElementById('isMostruario').checked = false;
        } else {
            mostruarioContainer.classList.remove('hidden');
            // Ainda verificamos o tipo de preço para habilitar/desabilitar
            window.simulator.atualizarEstadoMostruario();
        }
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

// Exportar funções para uso global
window.ui = {
    closeSidebar,
    closeSimulationDetailsModal,
    updateUIForAdminAccess,
    updateUIForUserAccess
};

// Inicializar UI ao carregar o módulo
document.addEventListener('DOMContentLoaded', initUI);
