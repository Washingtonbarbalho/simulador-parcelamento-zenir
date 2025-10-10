// Ponto de Entrada Principal (main.js)
// Orquestra a inicialização de todos os módulos da aplicação.

import { auth, firebase } from './firebase-init.js';
import { handleAuthStateChanged, setupAuthEventListeners } from './auth.js';
import { setupSimulatorEventListeners } from './simulator.js';
import { setupHistoryEventListeners, loadSimulationHistory } from './history.js';
import { setupAdminEventListeners, loadUsers } from './admin.js';
import * as UI from './ui.js';

// Função principal que é executada quando o DOM está pronto.
function initializeApp() {
    // 1. Configura o observador de estado de autenticação.
    //    Esta é a função mais importante, pois determina qual tela o usuário vê.
    firebase.onAuthStateChanged(auth, handleAuthStateChanged);

    // 2. Configura todos os ouvintes de eventos da interface.
    UI.setupSidebar();
    UI.setupPasswordToggle();
    UI.setupInputFormatting();
    
    // 3. Configura os ouvintes de eventos para cada módulo.
    setupAuthEventListeners();
    setupSimulatorEventListeners();
    setupHistoryEventListeners();
    setupAdminEventListeners();

    // 4. Configura a navegação entre as seções principais do app.
    setupNavigation();
    
    // 5. Detecta o tema do sistema (claro/escuro) e aplica.
    setupDarkModeToggle();
}

function setupNavigation() {
    document.getElementById('showSimulator').addEventListener('click', (e) => {
        e.preventDefault();
        UI.showSection('simulator');
    });

    document.getElementById('showHistory').addEventListener('click', (e) => {
        e.preventDefault();
        UI.showSection('history');
        loadSimulationHistory(); // Carrega o histórico ao navegar para a seção.
    });

    document.getElementById('showUsers').addEventListener('click', (e) => {
        e.preventDefault();
        UI.showSection('users');
        loadUsers(); // Carrega os usuários ao navegar para a seção.
    });
}

function setupDarkModeToggle() {
    const toggleDarkMode = (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    toggleDarkMode(mediaQuery.matches); // Define o tema inicial
    mediaQuery.addEventListener('change', (e) => toggleDarkMode(e.matches)); // Ouve por mudanças
}


// Inicia a aplicação quando o conteúdo da página for carregado.
document.addEventListener('DOMContentLoaded', initializeApp);
