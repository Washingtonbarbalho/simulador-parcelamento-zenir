// history.js - Funções para o histórico de simulações
import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    deleteDoc, 
    query, 
    orderBy, 
    limit,
    where, 
    updateDoc
} from './config.js';

import { ADMIN_EMAIL } from './config.js';
import { downloadVCard, showToast } from './utilities.js';
import { closeSimulationDetailsModal } from './ui.js';

// Inicialização do histórico
export function initHistory() {
    // Adicionar manipuladores para os botões do histórico
    if (document.getElementById('refreshHistoryBtn')) {
        document.getElementById('refreshHistoryBtn').addEventListener('click', loadSimulationHistory);
    }
    
    if (document.getElementById('deleteAllSimulationsBtn')) {
        document.getElementById('deleteAllSimulationsBtn').addEventListener('click', confirmDeleteAllSimulations);
    }
    
    // Configurar a busca
    setupSearchFunctionality();
}

// Função para obter e incrementar o contador de clientes
export async function getNextClientNumber() {
    try {
        // Referência para o documento de contador
        const counterRef = doc(db, "contadores", "clientes");
        
        // Tentar obter o documento atual
        const counterDoc = await getDoc(counterRef);
        
        let currentCount = 1; // Valor padrão se não existir
        
        if (counterDoc.exists()) {
            currentCount = counterDoc.data().contador + 1;
            
            // Atualizar o contador
            await updateDoc(counterRef, {
                contador: currentCount
            });
        } else {
            // Criar o documento de contador se não existir
            await updateDoc(counterRef, {
                contador: currentCount
            });
        }
        
        return currentCount;
    } catch (error) {
        console.error("Erro ao obter número do cliente:", error);
        // Retornar um timestamp como fallback em caso de erro
        return Math.floor(Date.now() / 1000);
    }
}

// Função para salvar a simulação no Firestore
export async function salvarSimulacao(dadosCliente) {
    try {
        // Obter o próximo número de cliente
        const clientNumber = await getNextClientNumber();
        const clienteZenirId = `CLIENTE ZENIR ${clientNumber}`;
        
        // Preparar dados para o Firestore
        const dadosCompletos = {
            cliente: {
                nome: dadosCliente.clientName.toUpperCase(),
                telefone: dadosCliente.clientPhone,
                produto: dadosCliente.productName.toUpperCase(),
                codigo: clienteZenirId
            },
            simulacao: window.simulationResults,
            dataHora: new Date().toISOString(),
            status: "Pendente", // Status inicial
            userId: window.currentUser.uid, // ID do usuário que criou a simulação
            userName: window.currentUser.userData.displayName || window.currentUser.email, // Nome do usuário que criou
            userBranch: window.currentUser.userData.branch || '' // Filial do usuário
        };
        
        // Salvar no Firestore
        const docRef = await addDoc(collection(db, "simulacoes"), dadosCompletos);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar a simulação:", error);
        return { success: false, error: error.message };
    }
}

// Função para carregar o histórico de simulações
export async function loadSimulationHistory() {
    const historyList = document.getElementById('historyList');
    const loadingElement = document.getElementById('loadingHistory');
    const emptyElement = document.getElementById('emptyHistory');
    
    // Mostrar loading
    historyList.innerHTML = '';
    loadingElement.classList.remove('hidden');
    emptyElement.classList.add('hidden');
    
    try {
        // Criar query ordenada por data/hora (mais recentes primeiro)
        // Com filtro dependendo do usuário (admin vê tudo, outros veem apenas suas simulações)
        let simulationsQuery;
        
        if (window.currentUser.email === ADMIN_EMAIL) {
            // Admin vê todas as simulações
            simulationsQuery = query(
                collection(db, "simulacoes"),
                orderBy("dataHora", "desc"),
                limit(50)
            );
        } else {
            // Usuário comum vê apenas suas simulações
            simulationsQuery = query(
                collection(db, "simulacoes"),
                where("userId", "==", window.currentUser.uid),
                orderBy("dataHora", "desc"),
                limit(50)
            );
        }
        
        // Buscar documentos
        const querySnapshot = await getDocs(simulationsQuery);
        
        // Ocultar loading
        loadingElement.classList.add('hidden');
        
        // Verificar se há resultados
        if (querySnapshot.empty) {
            emptyElement.classList.remove('hidden');
            return;
        }
        
        // Processar resultados
        querySnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            
            // Criar o cartão para cada simulação
            const card = createSimulationCard(docSnapshot.id, data);
            historyList.appendChild(card);
        });
        
        // Adicionar manipulador de eventos para a busca
        setupSearchFunctionality();
        
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        loadingElement.classList.add('hidden');
        
        // Mostrar mensagem de erro
        historyList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                <p class="text-red-500">Erro ao carregar o histórico de simulações.</p>
                <button id="retryLoadBtn" class="mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary">Tentar novamente</button>
            </div>
        `;
        
        document.getElementById('retryLoadBtn').addEventListener('click', loadSimulationHistory);
    }
}

// Função para criar cartão de simulação para o histórico
function createSimulationCard(id, data) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-custom p-4 border border-gray-200 dark:border-gray-600';
    card.setAttribute('data-simulation-id', id);
    
    // Verificar permissões do usuário atual
    const isAdmin = window.currentUser && window.currentUser.email === ADMIN_EMAIL;
    const isOwner = window.currentUser && data.userId === window.currentUser.uid;
    
    // Extrair dados da simulação
    const cliente = data.cliente || {};
    const dataHora = data.dataHora ? new Date(data.dataHora) : new Date();
    const status = data.status || 'Pendente';
    const userName = data.userName || 'Usuário desconhecido';
    const userBranch = data.userBranch || '';
    
    // Formatar data e hora
    const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Definir cores e ícones baseados no status
    let statusColor = 'gray';
    let statusIcon = 'clock';
    
    if (status === 'Concluída') {
        statusColor = 'green';
        statusIcon = 'check-circle';
    } else if (status === 'Cancelada') {
        statusColor = 'red';
        statusIcon = 'times-circle';
    } else if (status === 'Em Andamento') {
        statusColor = 'blue';
        statusIcon = 'spinner';
    }
    
    // Preparar botões adicionais apenas se tiver telefone
    let contactButtons = '';
    if (cliente.telefone) {
        // Limpar o número de telefone (apenas números)
        const phoneClean = cliente.telefone.replace(/\D/g, '');
        
        contactButtons = `
            <button type="button" class="contact-whatsapp-btn px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md" 
                    title="Contato via WhatsApp">
                <i class="fab fa-whatsapp mr-1"></i> WhatsApp
            </button>
            <button type="button" class="save-contact-btn px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md"
                    title="Salvar contato">
                <i class="fas fa-address-card mr-1"></i> Contato
            </button>
        `;
    }
    
    // Estrutura do cartão
    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between">
            <div class="mb-3 sm:mb-0">
                <h3 class="font-medium text-gray-900 dark:text-white">${cliente.nome || 'Cliente não informado'}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${cliente.produto || 'Produto não informado'}</p>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">${cliente.codigo || ''}</p>
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span class="inline-flex items-center">
                        <i class="fas fa-user mr-1"></i>
                        ${userName}${userBranch ? ` (${userBranch})` : ''}
                    </span>
                </div>
            </div>
            <div class="flex flex-col items-end">
                <div class="flex items-center">
                    <i class="fas fa-${statusIcon} text-${statusColor}-500 mr-1.5"></i>
                    <span class="text-sm font-medium text-${statusColor}-500">${status}</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${dataFormatada} às ${horaFormatada}</p>
                ${cliente.telefone ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${cliente.telefone}</p>` : ''}
            </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap justify-end space-x-2">
            ${contactButtons}
            <button type="button" class="view-details-btn px-3 py-1 bg-primary hover:bg-secondary text-white text-sm rounded-md">
                <i class="fas fa-eye mr-1"></i> Ver Detalhes
            </button>
            ${isAdmin ? `
            <button type="button" class="delete-simulation-btn px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md">
                <i class="fas fa-trash-alt mr-1"></i> Excluir
            </button>
            ` : ''}
        </div>
    `;
    
    // Adicionar event listeners aos botões
    card.querySelector('.view-details-btn').addEventListener('click', () => {
        viewSimulationDetails(id, data);
    });
    
    // Botão de exclusão só é adicionado para o administrador
    if (isAdmin) {
        card.querySelector('.delete-simulation-btn').addEventListener('click', () => {
            confirmDeleteSimulation(id, cliente.nome);
        });
    }
    
    // Adicionar event listeners para os botões de contato (apenas se tiver telefone)
    if (cliente.telefone) {
        const phoneClean = cliente.telefone.replace(/\D/g, '');
        
        // Botão de WhatsApp
        card.querySelector('.contact-whatsapp-btn').addEventListener('click', () => {
            // Criar mensagem personalizada para ajudar a fechar a venda
            const mensagem = `Olá ${cliente.nome}! 👋 Tudo bem? Vi que você fez uma simulação para o *${cliente.produto}* e gostaria de conversar sobre condições especiais para este produto. Podemos agendar uma visita à loja? Ou gostaria de tirar alguma dúvida por aqui mesmo? 😊`;
            
            // Codificar a mensagem para URL
            const mensagemCodificada = encodeURIComponent(mensagem);
            
            // Criar URL do WhatsApp com a mensagem
            const whatsappUrl = `https://wa.me/55${phoneClean}?text=${mensagemCodificada}`;
            window.open(whatsappUrl, '_blank');
        });
        
        // Botão de salvar contato
        card.querySelector('.save-contact-btn').addEventListener('click', () => {
            downloadVCard(cliente.nome, cliente.telefone, cliente.codigo);
        });
    }
    
    return card;
}

// Função para abrir o modal de detalhes da simulação
function viewSimulationDetails(id, data) {
    // Mostrar o modal
    const modal = document.getElementById('simulationDetailsModal');
    modal.classList.remove('hidden');
    
    // Armazenar o ID da simulação no modal para uso posterior
    modal.setAttribute('data-simulation-id', id);
    
    // Mostrar loading
    document.getElementById('loadingDetails').classList.remove('hidden');
    document.getElementById('simulationDetailsContent').classList.add('hidden');
    
    // Definir o valor do select com o status atual
    const statusSelect = document.getElementById('simulationStatus');
    statusSelect.value = data.status || 'Pendente';
    
    // Resetar o botão de salvar status para seu estado original
    const saveBtn = document.getElementById('saveStatusBtn');
    saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Salvar Status';
    saveBtn.disabled = false;
    
    // Adicionar classe para animação
    setTimeout(() => {
        document.querySelector('.details-modal').classList.add('open');
        
        // Preencher conteúdo (simular carregamento)
        setTimeout(() => {
            fillSimulationDetails(id, data);
            
            // Esconder loading, mostrar conteúdo
            document.getElementById('loadingDetails').classList.add('hidden');
            document.getElementById('simulationDetailsContent').classList.remove('hidden');
        }, 500);
    }, 10);
}

// Função para preencher os detalhes da simulação no modal
function fillSimulationDetails(id, data) {
    const detailsContent = document.getElementById('simulationDetailsContent');
    
    // Verificar permissões do usuário atual
    const isAdmin = window.currentUser && window.currentUser.email === ADMIN_EMAIL;
    const isOwner = window.currentUser && data.userId === window.currentUser.uid;
    
    // Permitir edição de status apenas para o administrador ou o dono da simulação
    const canEditStatus = isAdmin || isOwner;
    document.getElementById('saveStatusBtn').style.display = canEditStatus ? 'inline-flex' : 'none';
    document.getElementById('simulationStatus').disabled = !canEditStatus;
    
    // Extrair dados
    const cliente = data.cliente || {};
    const simulacao = data.simulacao || { inputs: {}, results: {} };
    const dataHora = data.dataHora ? new Date(data.dataHora) : new Date();
    const status = data.status || 'Pendente';
    const userName = data.userName || 'Usuário desconhecido';
    const userBranch = data.userBranch || '';
    
    // Formatar data e hora
    const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construir HTML de detalhes (conteúdo completo da simulação)
    let html = `
        <div class="space-y-6">
            <!-- Header com informações do cliente -->
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <!-- ... (conteúdo completo do cabeçalho) ... -->
            </div>
            
            <!-- Detalhes da simulação -->
            <div>
                <!-- ... (conteúdo completo dos detalhes) ... -->
            </div>
            
            <!-- Tabelas de resultados -->
            <!-- ... (tabelas de resultados para Carnê e/ou Cartão) ... -->
        </div>
    `;
    
    // Inserir o HTML no conteúdo do modal
    detailsContent.innerHTML = html;
}

// Função para salvar o status da simulação
async function saveSimulationStatus(id, newStatus) {
    try {
        // Atualizar status no Firestore
        const simulationRef = doc(db, "simulacoes", id);
        await updateDoc(simulationRef, {
            status: newStatus
        });
        
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { success: false, error: error.message };
    }
}

// Função para confirmar exclusão de simulação
function confirmDeleteSimulation(id, clientName) {
    // Configurar a mensagem de confirmação
    const message = `Tem certeza que deseja excluir a simulação de "${clientName || 'cliente sem nome'}"?`;
    document.getElementById('deleteConfirmMessage').textContent = message;
    
    // Mostrar o modal de confirmação
    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.remove('hidden');
    
    // Configurar o botão de confirmação
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = async () => {
        try {
            // Excluir a simulação
            await deleteSimulation(id);
            
            // Fechar o modal
            modal.classList.add('hidden');
            
            // Mostrar toast de sucesso
            showToast('Simulação excluída com sucesso!', 'success');
            
            // Recarregar o histórico
            loadSimulationHistory();
        } catch (error) {
            console.error('Erro ao excluir simulação:', error);
            showToast('Erro ao excluir simulação. Tente novamente.', 'error');
            
            // Fechar o modal
            modal.classList.add('hidden');
        }
    };
    
    // Configurar o botão de cancelar
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    cancelBtn.onclick = () => {
        modal.classList.add('hidden');
    };
}

// Função para excluir a simulação
async function deleteSimulation(id) {
    const simulationRef = doc(db, "simulacoes", id);
    await deleteDoc(simulationRef);
}

// Função para confirmar exclusão de todas as simulações (apenas admin)
function confirmDeleteAllSimulations() {
    // Verificar se o usuário é admin
    if (window.currentUser && window.currentUser.email === ADMIN_EMAIL) {
        // Configurar a mensagem de confirmação
        const message = "ATENÇÃO: Você está prestes a excluir TODAS as simulações do sistema. Esta ação é irreversível. Deseja continuar?";
        document.getElementById('deleteConfirmMessage').textContent = message;
        
        // Mostrar o modal de confirmação
        const modal = document.getElementById('deleteConfirmModal');
        modal.classList.remove('hidden');
        
        // Configurar o botão de confirmação
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.onclick = async () => {
            try {
                // Excluir todas as simulações
                await deleteAllSimulations();
                
                // Fechar o modal
                modal.classList.add('hidden');
                
                // Mostrar toast de sucesso
                showToast('Todas as simulações foram excluídas com sucesso', 'success');
                
                // Recarregar o histórico
                loadSimulationHistory();
            } catch (error) {
                console.error('Erro ao excluir todas as simulações:', error);
                
                // Mostrar toast de erro
                showToast('Erro ao excluir as simulações. Tente novamente.', 'error');
                
                // Fechar o modal
                modal.classList.add('hidden');
            }
        };
        
        // Configurar o botão de cancelar
        const cancelBtn = document.getElementById('cancelDeleteBtn');
        cancelBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
}

// Função para excluir todas as simulações (apenas admin)
async function deleteAllSimulations() {
    // Buscar todas as simulações
    const simulationsRef = collection(db, "simulacoes");
    const querySnapshot = await getDocs(simulationsRef);
    
    // Criar um array de promessas para excluir cada documento
    const deletePromises = [];
    querySnapshot.forEach(doc => {
        deletePromises.push(deleteDoc(doc(db, "simulacoes", doc.id)));
    });
    
    // Executar todas as exclusões em paralelo
    await Promise.all(deletePromises);
}

// Configurar funcionalidade de busca
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchHistory');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = document.querySelectorAll('#historyList > div');
        
        cards.forEach(card => {
            // Procurar no nome do cliente, produto e código
            let clientName = '';
            let productName = '';
            let clientCode = '';
            
            const clientNameElement = card.querySelector('h3');
            if (clientNameElement) {
                clientName = clientNameElement.textContent.toLowerCase();
            }
            
            const productNameElement = card.querySelector('div > p');
            if (productNameElement) {
                productName = productNameElement.textContent.toLowerCase();
            }
            
            const clientCodeElement = card.querySelector('.text-xs.font-medium.text-gray-500');
            if (clientCodeElement) {
                clientCode = clientCodeElement.textContent.toLowerCase();
            }
            
            if (clientName.includes(searchTerm) || 
                productName.includes(searchTerm) || 
                clientCode.includes(searchTerm)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
        
        // Verificar se há resultados visíveis
        const hasVisibleResults = Array.from(cards).some(card => !card.classList.contains('hidden'));
        
        if (!hasVisibleResults) {
            const emptyElement = document.getElementById('emptyHistory');
            emptyElement.classList.remove('hidden');
        } else {
            const emptyElement = document.getElementById('emptyHistory');
            emptyElement.classList.add('hidden');
        }
    });
}

// Exportar funções para uso global
window.history = {
    loadSimulationHistory,
    salvarSimulacao,
    getNextClientNumber,
    viewSimulationDetails,
    saveSimulationStatus,
    deleteSimulation,
    confirmDeleteSimulation,
    confirmDeleteAllSimulations
};

// Inicializar histórico ao carregar o módulo
document.addEventListener('DOMContentLoaded', initHistory);
