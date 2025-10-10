// Módulo de Histórico (history.js)
// Gerencia a exibição, busca e interação com o histórico de simulações.

import { db, firebase } from './firebase-init.js';
import { currentUser } from './auth.js';
import { formatCurrency, showToast } from './utils.js';

let currentSimulations = []; // Cache local para a busca

// --- Funções Principais ---

export async function loadSimulationHistory() {
    const historyList = document.getElementById('historyList');
    const loading = document.getElementById('loadingHistory');
    const empty = document.getElementById('emptyHistory');

    historyList.innerHTML = '';
    loading.classList.remove('hidden');
    empty.classList.add('hidden');

    try {
        const isAdmin = currentUser.email === "washington.wn8@gmail.com";
        const constraints = [firebase.orderBy("dataHora", "desc"), firebase.limit(50)];
        if (!isAdmin) {
            constraints.unshift(firebase.where("userId", "==", currentUser.uid));
        }
        
        const q = firebase.query(firebase.collection(db, "simulacoes"), ...constraints);
        const querySnapshot = await firebase.getDocs(q);
        
        currentSimulations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        loading.classList.add('hidden');
        if (currentSimulations.length === 0) {
            empty.classList.remove('hidden');
        } else {
            renderHistoryList(currentSimulations);
        }
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        loading.classList.add('hidden');
        historyList.innerHTML = `<p class="text-center text-red-500">Erro ao carregar o histórico.</p>`;
    }
}

function renderHistoryList(simulations) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    simulations.forEach(sim => {
        historyList.appendChild(createSimulationCard(sim.id, sim));
    });
}


// --- Criação de Componentes ---

function createSimulationCard(id, data) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-custom p-4 border border-gray-200 dark:border-gray-600';
    
    const { cliente, dataHora, status, userName, userBranch } = data;
    const date = new Date(dataHora);
    
    const statusMap = {
        'Pendente': { color: 'gray', icon: 'clock' },
        'Em Andamento': { color: 'blue', icon: 'spinner' },
        'Concluída': { color: 'green', icon: 'check-circle' },
        'Cancelada': { color: 'red', icon: 'times-circle' },
    };
    const currentStatus = statusMap[status] || statusMap['Pendente'];

    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between">
            <div class="mb-3 sm:mb-0">
                <h3 class="font-medium text-gray-900 dark:text-white">${cliente.nome || ''}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${cliente.produto || ''}</p>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">${cliente.codigo || ''}</p>
                 <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span class="inline-flex items-center"><i class="fas fa-user mr-1"></i>${userName}${userBranch ? ` (${userBranch})` : ''}</span>
                </div>
            </div>
            <div class="flex flex-col items-end">
                <div class="flex items-center">
                    <i class="fas fa-${currentStatus.icon} text-${currentStatus.color}-500 mr-1.5"></i>
                    <span class="text-sm font-medium text-${currentStatus.color}-500">${status}</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                ${cliente.telefone ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${cliente.telefone}</p>` : ''}
            </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap justify-end space-x-2">
            <button class="view-details-btn px-3 py-1 bg-primary hover:bg-secondary text-white text-sm rounded-md"><i class="fas fa-eye mr-1"></i> Ver Detalhes</button>
            ${currentUser.email === "washington.wn8@gmail.com" ? `<button class="delete-simulation-btn px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md"><i class="fas fa-trash-alt mr-1"></i> Excluir</button>` : ''}
        </div>
    `;

    // Event Listeners
    card.querySelector('.view-details-btn').addEventListener('click', () => openDetailsModal(id, data));
    if (currentUser.email === "washington.wn8@gmail.com") {
        card.querySelector('.delete-simulation-btn').addEventListener('click', () => confirmDeleteSimulation(id, cliente.nome));
    }
    
    return card;
}


// --- Funções de Modal e Ações ---

function openDetailsModal(id, data) {
    const modal = document.getElementById('simulationDetailsModal');
    modal.setAttribute('data-simulation-id', id);
    document.getElementById('simulationStatus').value = data.status || 'Pendente';
    
    // Preenche o conteúdo
    const contentDiv = document.getElementById('simulationDetailsContent');
    contentDiv.innerHTML = createDetailsModalContent(data);

    // Mostra o modal
    modal.classList.remove('hidden');
    document.querySelector('.details-modal').classList.add('open');
    document.getElementById('loadingDetails').classList.add('hidden');
    contentDiv.classList.remove('hidden');
}

function createDetailsModalContent(data) {
    const { cliente, simulacao, dataHora, status, userName, userBranch } = data;
    const date = new Date(dataHora);
    const { inputs, results } = simulacao;

    const createTable = (title, data) => {
        if (!data || data.length === 0) return '';
        return `
            <div class="mt-6">
                <h4 class="text-md font-medium mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Resultado - ${title}</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Parcelas</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor da Parcela</th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${data.map(r => `
                                <tr>
                                    <td class="px-4 py-3 text-sm font-medium">${r.numParcela}x ${r.isMostruarioIndicator ? '(Mostruário)' : ''}</td>
                                    <td class="px-4 py-3 text-sm">${formatCurrency(r.valorParcela)}</td>
                                    <td class="px-4 py-3 text-sm text-right">${formatCurrency(r.totalParcelado)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    };
    
    return `
        <div class="space-y-6">
            <!-- Cabeçalho -->
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">${cliente.nome}</h3>
                <p class="text-sm">${cliente.produto}</p>
                <p class="text-sm text-gray-500">${cliente.telefone || ''}</p>
            </div>
            <!-- Detalhes -->
            <div>
                <h4 class="text-md font-medium mb-3 border-b pb-2">Detalhes da Simulação</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <p><strong>Produto:</strong> ${formatCurrency(inputs.valorProdutoOriginal)}</p>
                    <p><strong>GE:</strong> ${formatCurrency(inputs.valorGE)}</p>
                    ${inputs.valorEntrada > 0 ? `<p><strong>Entrada:</strong> ${formatCurrency(inputs.valorEntrada)}</p>` : ''}
                    <p><strong>Preço:</strong> ${inputs.tipoPreco}</p>
                </div>
            </div>
            ${createTable('Carnê', results.carne)}
            ${createTable('Cartão', results.cartao)}
        </div>
    `;
}

function confirmDeleteSimulation(id, clientName) {
    const modal = document.getElementById('deleteConfirmModal');
    document.getElementById('deleteConfirmMessage').textContent = `Tem certeza que deseja excluir a simulação de "${clientName || 'cliente'}"?`;
    modal.classList.remove('hidden');
    
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        try {
            await firebase.deleteDoc(firebase.doc(db, "simulacoes", id));
            showToast('Simulação excluída!', 'success');
            loadSimulationHistory();
        } catch (error) {
            showToast('Erro ao excluir simulação.', 'error');
        } finally {
            modal.classList.add('hidden');
        }
    };
}

async function updateSimulationStatus(id, newStatus) {
    try {
        await firebase.updateDoc(firebase.doc(db, "simulacoes", id), { status: newStatus });
        showToast('Status atualizado com sucesso!', 'success');
        loadSimulationHistory();
        return true;
    } catch (error) {
        showToast('Erro ao atualizar status.', 'error');
        return false;
    }
}


// --- Configuração de Eventos ---

export function setupHistoryEventListeners() {
    // Busca
    document.getElementById('searchHistory').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = currentSimulations.filter(sim =>
            sim.cliente.nome?.toLowerCase().includes(searchTerm) ||
            sim.cliente.produto?.toLowerCase().includes(searchTerm) ||
            sim.cliente.codigo?.toLowerCase().includes(searchTerm)
        );
        renderHistoryList(filtered);
        document.getElementById('emptyHistory').classList.toggle('hidden', filtered.length > 0);
    });

    // Botões de Refresh e Excluir Todos
    document.getElementById('refreshHistoryBtn').addEventListener('click', loadSimulationHistory);
    // (A lógica de exclusão de todos é mais complexa e mantida no admin para segurança)

    // Modal de Detalhes
    const detailsModal = document.getElementById('simulationDetailsModal');
    document.getElementById('closeDetailsModal').addEventListener('click', () => detailsModal.classList.add('hidden'));
    document.getElementById('closeDetailsBtn').addEventListener('click', () => detailsModal.classList.add('hidden'));
    
    document.getElementById('saveStatusBtn').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...`;
        btn.disabled = true;

        const id = detailsModal.getAttribute('data-simulation-id');
        const newStatus = document.getElementById('simulationStatus').value;
        const success = await updateSimulationStatus(id, newStatus);
        
        if (success) {
            detailsModal.classList.add('hidden');
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    });

    // Modal de Exclusão
    const deleteModal = document.getElementById('deleteConfirmModal');
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => deleteModal.classList.add('hidden'));
}
