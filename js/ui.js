// Módulo de Interface (ui.js)
// Gerencia todas as interações e manipulações diretas do DOM.

import { formatPhoneNumber, toUpperCaseInput, currencyToNumber } from './utils.js';

let currentUserData = null;

export function setCurrentUserData(user) {
    currentUserData = user;
}

// --- Funções de Visibilidade de Seções ---

export function showLoginForm() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('pendingApprovalSection').classList.add('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

export function showPendingApproval() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('pendingApprovalSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

export function showApp() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('pendingApprovalSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    showSection('simulator');
}

export function showSection(sectionName) {
    document.getElementById('simulatorSection').classList.add('hidden');
    document.getElementById('historySection').classList.add('hidden');
    document.getElementById('usersSection').classList.add('hidden');

    const sectionElement = document.getElementById(`${sectionName}Section`);
    if (sectionElement) {
        sectionElement.classList.remove('hidden');
    }
}

// --- Funções de Atualização da UI baseadas em Permissões ---

export function updateUIForAdminAccess() {
    document.getElementById('adminSection').classList.remove('hidden');
    document.querySelectorAll('.history-access-item, .save-access-item').forEach(el => el.classList.remove('hidden'));
    document.getElementById('deleteAllSimulationsBtn')?.classList.remove('hidden');
    document.getElementById('useSpecialDiscount').parentElement.parentElement.classList.remove('hidden');
    document.getElementById('isMostruario').parentElement.parentElement.classList.remove('hidden');
    atualizarEstadoMostruario();
}

export function updateUIForUserAccess(userData) {
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('deleteAllSimulationsBtn')?.classList.add('hidden');

    const canUseSpecialDiscount = userData.canUseSpecialDiscount === true;
    const canUseMostruario = userData.canUseMostruario === true;

    const specialDiscountContainer = document.getElementById('useSpecialDiscount').parentElement.parentElement;
    const mostruarioContainer = document.getElementById('isMostruario').parentElement.parentElement;

    specialDiscountContainer.classList.toggle('hidden', !canUseSpecialDiscount);
    if (!canUseSpecialDiscount) document.getElementById('useSpecialDiscount').checked = false;

    mostruarioContainer.classList.toggle('hidden', !canUseMostruario);
    if (!canUseMostruario) document.getElementById('isMostruario').checked = false;
    
    atualizarEstadoMostruario();

    const hasFullAccess = userData.accessLevel === 'full';
    document.querySelectorAll('.history-access-item, .save-access-item').forEach(el => {
        el.classList.toggle('hidden', !hasFullAccess);
    });
}


// --- Funções de Configuração de Componentes da UI ---

export function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    const openSidebar = () => {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    };

    document.getElementById('openSidebar').addEventListener('click', openSidebar);
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Fechar ao clicar em um item de navegação
    document.querySelectorAll('#sidebar nav a').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
}

export function switchAuthTab(tab) {
    ['login', 'register', 'forgotPassword'].forEach(t => {
        document.getElementById(`${t}Form`).classList.add('hidden');
        document.getElementById(`${t}TabBtn`).classList.remove('border-primary', 'text-primary');
        document.getElementById(`${t}TabBtn`).classList.add('border-transparent', 'text-gray-500');
    });

    document.getElementById(`${tab}Form`).classList.remove('hidden');
    document.getElementById(`${tab}TabBtn`).classList.add('border-primary', 'text-primary');
    document.getElementById(`${tab}TabBtn`).classList.remove('border-transparent', 'text-gray-500');
}

function togglePasswordVisibility(inputId, buttonId) {
    const passwordInput = document.getElementById(inputId);
    const icon = document.getElementById(buttonId).querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

export function setupPasswordToggle() {
    document.getElementById('toggleLoginPassword').addEventListener('click', () => togglePasswordVisibility('loginPassword', 'toggleLoginPassword'));
    document.getElementById('toggleRegisterPassword').addEventListener('click', () => togglePasswordVisibility('registerPassword', 'toggleRegisterPassword'));
    document.getElementById('toggleRegisterPasswordConfirm').addEventListener('click', () => togglePasswordVisibility('registerPasswordConfirm', 'toggleRegisterPasswordConfirm'));
}

export function setupInputFormatting() {
    document.getElementById('registerPhone').addEventListener('input', (e) => formatPhoneNumber(e.target));
    document.getElementById('editUserPhone').addEventListener('input', (e) => formatPhoneNumber(e.target));
    document.getElementById('clientPhone').addEventListener('input', (e) => formatPhoneNumber(e.target));

    document.getElementById('registerName').addEventListener('input', (e) => toUpperCaseInput(e.target));
    document.getElementById('registerBranch').addEventListener('input', (e) => toUpperCaseInput(e.target));
    document.getElementById('editUserName').addEventListener('input', (e) => toUpperCaseInput(e.target));
    document.getElementById('editUserBranch').addEventListener('input', (e) => toUpperCaseInput(e.target));
    document.getElementById('clientName').addEventListener('input', (e) => toUpperCaseInput(e.target));
    document.getElementById('productName').addEventListener('input', (e) => toUpperCaseInput(e.target));

    document.querySelectorAll('#productValue, #geValue, #entryValue').forEach(input => {
        input.addEventListener('input', () => {
            let value = input.value.replace(/\D/g, '');
            if (!value) {
                input.value = '';
                return;
            }
            value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            input.value = `R$ ${value}`;
        });
        input.addEventListener('focus', function() {
            if (this.value) {
                const numericValue = currencyToNumber(this.value);
                this.value = numericValue.toString().replace('.', ',');
            }
        });
        input.addEventListener('blur', function() {
            if (this.value) {
                const numericValue = parseFloat(this.value.replace(',', '.')) || 0;
                 if (numericValue > 0) {
                    this.value = `R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                 } else {
                    this.value = '';
                 }
            }
        });
    });
}


export function atualizarEstadoMostruario() {
    const tipoPreco = document.querySelector('input[name="priceType"]:checked').value;
    const checkboxMostruario = document.getElementById('isMostruario');
    const msgMostruario = document.getElementById('mostruarioDisabledMsg');

    if (tipoPreco === 'tabela') {
        checkboxMostruario.disabled = false;
        msgMostruario.style.display = 'none';
    } else {
        checkboxMostruario.disabled = true;
        checkboxMostruario.checked = false;
        msgMostruario.style.display = 'block';
    }
}
