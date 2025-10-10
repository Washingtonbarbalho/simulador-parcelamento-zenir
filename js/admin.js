// Módulo de Administração (admin.js)
// Gerencia o painel de usuários (aprovação, edição, exclusão).

import { db, firebase } from './firebase-init.js';
import { showToast, formatPhoneNumber, toUpperCaseInput } from './utils.js';

let allUsers = []; // Cache local para usuários

// --- Funções de Carregamento e Renderização ---

export async function loadUsers() {
    const loading = document.getElementById('loadingUsers');
    const approvedList = document.getElementById('approvedUsersList');
    const pendingList = document.getElementById('pendingUsersList');
    
    loading.classList.remove('hidden');
    approvedList.classList.add('hidden');
    pendingList.classList.add('hidden');
    approvedList.innerHTML = '';
    pendingList.innerHTML = '';

    try {
        const usersSnapshot = await firebase.getDocs(firebase.collection(db, 'users'));
        allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const approvedUsers = allUsers.filter(u => u.status === 'approved');
        const pendingUsers = allUsers.filter(u => u.status === 'pending');

        approvedUsers.forEach(user => approvedList.appendChild(createUserCard(user)));
        pendingUsers.forEach(user => pendingList.appendChild(createUserCard(user)));
        
        switchUserTab(document.querySelector('#pendingUsersTabBtn.border-primary') ? 'pending' : 'approved');

    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        showToast('Erro ao carregar usuários.', 'error');
    } finally {
        loading.classList.add('hidden');
    }
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-custom p-4 border border-gray-200 dark:border-gray-600';
    
    const isAdmin = user.email === "washington.wn8@gmail.com";
    const isPending = user.status === 'pending';

    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between">
            <div>
                <h3 class="font-medium">${user.displayName}</h3>
                <p class="text-sm text-gray-500">${user.email}</p>
                <p class="text-sm text-gray-500">${user.branch || 'Sem filial'}</p>
            </div>
            <div class="flex items-start space-x-2 mt-2 sm:mt-0">
                ${isPending ? `
                    <button class="approve-user-btn px-3 py-1 bg-green-500 text-white text-sm rounded-md"><i class="fas fa-check mr-1"></i>Aprovar</button>
                    <button class="reject-user-btn px-3 py-1 bg-red-500 text-white text-sm rounded-md"><i class="fas fa-times mr-1"></i>Rejeitar</button>
                ` : `
                    <button class="edit-user-btn px-3 py-1 bg-primary text-white text-sm rounded-md"><i class="fas fa-edit mr-1"></i>Editar</button>
                    ${!isAdmin ? `<button class="delete-user-btn px-3 py-1 bg-red-500 text-white text-sm rounded-md"><i class="fas fa-trash-alt mr-1"></i>Excluir</button>` : ''}
                `}
            </div>
        </div>`;

    // Event Listeners
    if (isPending) {
        card.querySelector('.approve-user-btn').addEventListener('click', () => approveUser(user.id));
        card.querySelector('.reject-user-btn').addEventListener('click', () => rejectUser(user.id));
    } else {
        card.querySelector('.edit-user-btn').addEventListener('click', () => openEditUserModal(user));
        if (!isAdmin) {
            card.querySelector('.delete-user-btn').addEventListener('click', () => deleteUser(user.id, user.displayName));
        }
    }
    return card;
}


// --- Funções de Ação do Admin ---

async function approveUser(userId) {
    try {
        await firebase.updateDoc(firebase.doc(db, 'users', userId), { status: 'approved', accessLevel: 'full' });
        showToast('Usuário aprovado!', 'success');
        loadUsers();
    } catch (error) {
        showToast('Erro ao aprovar usuário.', 'error');
    }
}

async function rejectUser(userId) {
    if (!confirm('Tem certeza que deseja rejeitar e excluir este usuário?')) return;
    try {
        await firebase.deleteDoc(firebase.doc(db, 'users', userId));
        // Nota: Isso não remove o usuário do Firebase Auth. Requer uma Cloud Function para isso.
        showToast('Usuário rejeitado e excluído.', 'success');
        loadUsers();
    } catch (error) {
        showToast('Erro ao rejeitar usuário.', 'error');
    }
}

async function deleteUser(userId, userName) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) return;
    try {
        await firebase.deleteDoc(firebase.doc(db, 'users', userId));
        showToast('Usuário excluído.', 'success');
        loadUsers();
    } catch (error) {
        showToast('Erro ao excluir usuário.', 'error');
    }
}

async function saveUserChanges(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const data = {
        displayName: document.getElementById('editUserName').value.toUpperCase(),
        phone: document.getElementById('editUserPhone').value,
        branch: document.getElementById('editUserBranch').value.toUpperCase(),
        accessLevel: document.querySelector('input[name="editUserAccess"]:checked').value,
        canUseSpecialDiscount: document.getElementById('canUseSpecialDiscount').checked,
        canUseMostruario: document.getElementById('canUseMostruario').checked
    };

    try {
        await firebase.updateDoc(firebase.doc(db, 'users', userId), data);
        showToast('Usuário atualizado com sucesso!', 'success');
        closeEditUserModal();
        loadUsers();
    } catch (error) {
        showToast('Erro ao salvar alterações.', 'error');
    }
}

// --- Funções de UI do Admin ---

function switchUserTab(tab) {
    const approvedTabBtn = document.getElementById('approvedUsersTabBtn');
    const pendingTabBtn = document.getElementById('pendingUsersTabBtn');
    const approvedList = document.getElementById('approvedUsersList');
    const pendingList = document.getElementById('pendingUsersList');
    const emptyApproved = document.getElementById('emptyApprovedUsers');
    const emptyPending = document.getElementById('emptyPendingUsers');

    const isApprovedTab = tab === 'approved';
    
    approvedTabBtn.classList.toggle('border-primary', isApprovedTab);
    approvedTabBtn.classList.toggle('text-primary', isApprovedTab);
    pendingTabBtn.classList.toggle('border-primary', !isApprovedTab);
    pendingTabBtn.classList.toggle('text-primary', !isApprovedTab);

    const hasApproved = allUsers.some(u => u.status === 'approved');
    const hasPending = allUsers.some(u => u.status === 'pending');

    approvedList.classList.toggle('hidden', !isApprovedTab || !hasApproved);
    emptyApproved.classList.toggle('hidden', !isApprovedTab || hasApproved);
    
    pendingList.classList.toggle('hidden', isApprovedTab || !hasPending);
    emptyPending.classList.toggle('hidden', isApprovedTab || hasPending);
}


function openEditUserModal(user) {
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.displayName;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserBranch').value = user.branch || '';
    document.querySelector(`input[name="editUserAccess"][value="${user.accessLevel || 'partial'}"]`).checked = true;
    document.getElementById('canUseSpecialDiscount').checked = user.canUseSpecialDiscount === true;
    document.getElementById('canUseMostruario').checked = user.canUseMostruario === true;
    document.getElementById('editUserModal').classList.remove('hidden');
}

function closeEditUserModal() {
    document.getElementById('editUserModal').classList.add('hidden');
}


// --- Configuração de Eventos ---

export function setupAdminEventListeners() {
    // Abas
    document.getElementById('approvedUsersTabBtn').addEventListener('click', () => switchUserTab('approved'));
    document.getElementById('pendingUsersTabBtn').addEventListener('click', () => switchUserTab('pending'));
    document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);
    
    // Modal de Edição
    document.getElementById('editUserForm').addEventListener('submit', saveUserChanges);
    document.getElementById('closeEditUserModal').addEventListener('click', closeEditUserModal);
    document.getElementById('cancelEditUserBtn').addEventListener('click', closeEditUserModal);
}
