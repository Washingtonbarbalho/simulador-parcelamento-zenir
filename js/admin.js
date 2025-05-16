// admin.js - Funções para administração e gerenciamento de usuários
import { 
    db, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    getDocs 
} from './config.js';

import { showToast } from './utilities.js';
import { ADMIN_EMAIL } from './config.js';

// Inicialização da administração
export function initAdmin() {
    setupAdminEvents();
}

function setupAdminEvents() {
    // Guias do painel de usuários
    const approvedTabBtn = document.getElementById('approvedUsersTabBtn');
    const pendingTabBtn = document.getElementById('pendingUsersTabBtn');
    
    if (approvedTabBtn && pendingTabBtn) {
        approvedTabBtn.addEventListener('click', () => switchUserTab('approved'));
        pendingTabBtn.addEventListener('click', () => switchUserTab('pending'));
    }
    
    // Botão de atualizar usuários
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', loadUsers);
    }
    
    // Fechar modal de edição
    const closeEditUserModal = document.getElementById('closeEditUserModal');
    if (closeEditUserModal) {
        closeEditUserModal.addEventListener('click', () => {
            document.getElementById('editUserModal').classList.add('hidden');
        });
    }
    
    // Cancelar edição
    const cancelEditUserBtn = document.getElementById('cancelEditUserBtn');
    if (cancelEditUserBtn) {
        cancelEditUserBtn.addEventListener('click', () => {
            document.getElementById('editUserModal').classList.add('hidden');
        });
    }
    
    // Salvar alterações do usuário
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', saveUserChanges);
    }
}

function switchUserTab(tab) {
    // Reset da UI
    document.getElementById('approvedUsersTabBtn').classList.remove('border-primary', 'text-primary');
    document.getElementById('approvedUsersTabBtn').classList.add('border-transparent', 'text-gray-500');
    
    document.getElementById('pendingUsersTabBtn').classList.remove('border-primary', 'text-primary');
    document.getElementById('pendingUsersTabBtn').classList.add('border-transparent', 'text-gray-500');
    
    document.getElementById('approvedUsersList').classList.add('hidden');
    document.getElementById('pendingUsersList').classList.add('hidden');
    document.getElementById('emptyApprovedUsers').classList.add('hidden');
    document.getElementById('emptyPendingUsers').classList.add('hidden');
    
    // Ativar tab selecionada
    if (tab === 'approved') {
        document.getElementById('approvedUsersTabBtn').classList.remove('border-transparent', 'text-gray-500');
        document.getElementById('approvedUsersTabBtn').classList.add('border-primary', 'text-primary');
        
        if (document.querySelectorAll('#approvedUsersList > div').length > 0) {
            document.getElementById('approvedUsersList').classList.remove('hidden');
        } else {
            document.getElementById('emptyApprovedUsers').classList.remove('hidden');
        }
    } else {
        document.getElementById('pendingUsersTabBtn').classList.remove('border-transparent', 'text-gray-500');
        document.getElementById('pendingUsersTabBtn').classList.add('border-primary', 'text-primary');
        
        if (document.querySelectorAll('#pendingUsersList > div').length > 0) {
            document.getElementById('pendingUsersList').classList.remove('hidden');
        } else {
            document.getElementById('emptyPendingUsers').classList.remove('hidden');
        }
    }
}

// Carregar lista de usuários
async function loadUsers() {
    // Mostrar loading
    document.getElementById('loadingUsers').classList.remove('hidden');
    document.getElementById('approvedUsersList').classList.add('hidden');
    document.getElementById('pendingUsersList').classList.add('hidden');
    document.getElementById('emptyApprovedUsers').classList.add('hidden');
    document.getElementById('emptyPendingUsers').classList.add('hidden');
    
    // Limpar listas
    document.getElementById('approvedUsersList').innerHTML = '';
    document.getElementById('pendingUsersList').innerHTML = '';
    
    try {
        // Buscar usuários no Firestore
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        const approvedUsers = [];
        const pendingUsers = [];
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            userData.id = doc.id;
            
            if (userData.status === 'approved') {
                approvedUsers.push(userData);
            } else if (userData.status === 'pending') {
                pendingUsers.push(userData);
            }
        });
        
        // Preencher lista de usuários aprovados
        if (approvedUsers.length > 0) {
            approvedUsers.forEach(user => {
                const userCard = createUserCard(user, 'approved');
                document.getElementById('approvedUsersList').appendChild(userCard);
            });
        }
        
        // Preencher lista de usuários pendentes
        if (pendingUsers.length > 0) {
            pendingUsers.forEach(user => {
                const userCard = createUserCard(user, 'pending');
                document.getElementById('pendingUsersList').appendChild(userCard);
            });
        }
        
        // Ocultar loading
        document.getElementById('loadingUsers').classList.add('hidden');
        
        // Mostrar lista ou mensagem "vazio"
        if (approvedUsers.length > 0) {
            document.getElementById('approvedUsersList').classList.remove('hidden');
        } else {
            document.getElementById('emptyApprovedUsers').classList.remove('hidden');
        }
        
        // A lista mostrada depende da aba ativa
        if (document.getElementById('approvedUsersTabBtn').classList.contains('border-primary')) {
            switchUserTab('approved');
        } else {
            switchUserTab('pending');
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        document.getElementById('loadingUsers').classList.add('hidden');
        showToast('Erro ao carregar usuários. Tente novamente.', 'error');
    }
}

// Criar cartão de usuário
function createUserCard(user, type) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-custom p-4 border border-gray-200 dark:border-gray-600';
    card.setAttribute('data-user-id', user.uid);
    
    // Determinamos a tag e cor do status de acesso
    let accessTag = '';
    let accessColor = '';
    
    if (user.email === ADMIN_EMAIL) {
        accessTag = 'Administrador';
        accessColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    } else if (user.accessLevel === 'full') {
        accessTag = 'Acesso Total';
        accessColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    } else if (user.accessLevel === 'partial') {
        accessTag = 'Acesso Parcial';
        accessColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    } else {
        accessTag = 'Sem Acesso';
        accessColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
    
    // Formatando a data
    let createdDate = 'Data não disponível';
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        createdDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between">
            <div class="mb-3 sm:mb-0">
                <h3 class="font-medium text-gray-900 dark:text-white">${user.displayName || user.email}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${user.email}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${accessColor}">
                        ${accessTag}
                    </span>
                    ${user.branch ? `
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                        ${user.branch}
                    </span>
                    ` : ''}
                </div>
            </div>
            <div class="flex flex-col items-end">
                <p class="text-xs text-gray-500 dark:text-gray-400">Cadastro: ${createdDate}</p>
                ${user.phone ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${user.phone}</p>` : ''}
            </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
            ${type === 'pending' ? `
            <button class="approve-user-btn px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md">
                <i class="fas fa-check mr-1"></i> Aprovar
            </button>
            <button class="reject-user-btn px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md">
                <i class="fas fa-times mr-1"></i> Rejeitar
            </button>
            ` : `
            <button class="edit-user-btn px-3 py-1 bg-primary hover:bg-secondary text-white text-sm rounded-md">
                <i class="fas fa-edit mr-1"></i> Editar
            </button>
            ${user.email !== ADMIN_EMAIL ? `
            <button class="delete-user-btn px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md">
                <i class="fas fa-trash-alt mr-1"></i> Excluir
            </button>
            ` : ''}
            `}
        </div>
    `;
    
    // Adicionar event listeners
    if (type === 'pending') {
        // Botão de aprovar usuário
        card.querySelector('.approve-user-btn').addEventListener('click', async () => {
            try {
                await approveUser(user.uid);
                showToast('Usuário aprovado com sucesso', 'success');
                loadUsers(); // Recarregar a lista depois
            } catch (error) {
                console.error('Erro ao aprovar usuário:', error);
                showToast('Erro ao aprovar usuário. Tente novamente.', 'error');
            }
        });
        
        // Botão de rejeitar usuário
        card.querySelector('.reject-user-btn').addEventListener('click', async () => {
            try {
                await rejectUser(user.uid);
                showToast('Usuário rejeitado com sucesso', 'success');
                loadUsers(); // Recarregar a lista depois
            } catch (error) {
                console.error('Erro ao rejeitar usuário:', error);
                showToast('Erro ao rejeitar usuário. Tente novamente.', 'error');
            }
        });
    } else {
        // Botão de editar usuário
        card.querySelector('.edit-user-btn').addEventListener('click', () => {
            openEditUserModal(user);
        });
        
        // Botão de excluir usuário (exceto para o admin)
        if (user.email !== ADMIN_EMAIL) {
            card.querySelector('.delete-user-btn').addEventListener('click', async () => {
                if (confirm(`Tem certeza que deseja excluir o usuário ${user.displayName}?`)) {
                    try {
                        await deleteUser(user.uid);
                        showToast('Usuário excluído com sucesso', 'success');
                        loadUsers(); // Recarregar a lista depois
                    } catch (error) {
                        console.error('Erro ao excluir usuário:', error);
                        showToast('Erro ao excluir usuário. Tente novamente.', 'error');
                    }
                }
            });
        }
    }
    
    return card;
}

// Funções de gerenciamento de usuários
async function approveUser(userId) {
    // Aprovação com acesso total por padrão
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        status: 'approved',
        accessLevel: 'full'
    });
}

async function rejectUser(userId) {
    // Simplesmente excluir o usuário
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

async function deleteUser(userId) {
    // Excluir o documento do usuário
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

function openEditUserModal(user) {
    // Preencher os campos do formulário
    document.getElementById('editUserId').value = user.uid;
    document.getElementById('editUserName').value = user.displayName || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserBranch').value = user.branch || '';
    
    // Selecionar o nível de acesso apropriado
    if (user.accessLevel === 'full') {
        document.querySelector('input[name="editUserAccess"][value="full"]').checked = true;
    } else {
        document.querySelector('input[name="editUserAccess"][value="partial"]').checked = true;
    }
    
    // Configurar permissões especiais
    document.getElementById('canUseSpecialDiscount').checked = user.canUseSpecialDiscount === true;
    document.getElementById('canUseMostruario').checked = user.canUseMostruario === true;
    
    // Mostrar o modal
    document.getElementById('editUserModal').classList.remove('hidden');
}

async function saveUserChanges(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.toUpperCase();
    const phone = document.getElementById('editUserPhone').value;
    const branch = document.getElementById('editUserBranch').value.toUpperCase();
    const accessLevel = document.querySelector('input[name="editUserAccess"]:checked').value;
    
    // Obter as permissões especiais
    const canUseSpecialDiscount = document.getElementById('canUseSpecialDiscount').checked;
    const canUseMostruario = document.getElementById('canUseMostruario').checked;
    
    try {
        // Atualizar informações do usuário
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            displayName: name,
            phone: phone,
            branch: branch,
            accessLevel: accessLevel,
            canUseSpecialDiscount: canUseSpecialDiscount,
            canUseMostruario: canUseMostruario
        });
        
        // Fechar o modal
        document.getElementById('editUserModal').classList.add('hidden');
        
        // Mostrar toast de sucesso
        showToast('Usuário atualizado com sucesso', 'success');
        
        // Recarregar a lista de usuários
        loadUsers();
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        showToast('Erro ao salvar alterações. Tente novamente.', 'error');
    }
}

// Exportar funções para uso global
window.admin = {
    loadUsers,
    approveUser,
    rejectUser,
    deleteUser,
    openEditUserModal,
    saveUserChanges
};

// Inicializar admin ao carregar o módulo
document.addEventListener('DOMContentLoaded', initAdmin);
