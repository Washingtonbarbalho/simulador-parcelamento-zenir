// main.js - Arquivo central para coordenar inicialização e exportações
import { 
    db, 
    auth, 
    ADMIN_EMAIL, 
    FATORES, 
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
    updateDoc,
    setDoc
} from './config.js';

// Função para obter e incrementar o contador de clientes
export async function getNextClientNumber() {
    try {
        console.log("Obtendo próximo número de cliente...");
        
        // Referência para o documento de contador
        const counterRef = doc(db, "contadores", "clientes");
        
        // Tentar obter o documento atual
        const counterDoc = await getDoc(counterRef);
        
        let currentCount = 1; // Valor padrão se não existir
        
        if (counterDoc.exists()) {
            currentCount = counterDoc.data().contador + 1;
            console.log("Contador atual:", currentCount - 1, "-> Próximo:", currentCount);
            
            // Atualizar o contador
            await updateDoc(counterRef, {
                contador: currentCount
            });
        } else {
            console.log("Documento contador não existe, criando com valor inicial 1");
            // Criar o documento de contador se não existir
            await setDoc(counterRef, {
                contador: currentCount
            });
        }
        
        return currentCount;
    } catch (error) {
        console.error("Erro ao obter número do cliente:", error);
        if (window.debug && typeof window.debug.showDebugMessage === 'function') {
            window.debug.showDebugMessage(`Erro no contador: ${error.message}`, 'error');
        }
        // Retornar um timestamp como fallback em caso de erro
        return Math.floor(Date.now() / 1000);
    }
}

// Função para salvar a simulação no Firestore
export async function salvarSimulacao(dadosCliente) {
    try {
        console.log("Iniciando salvamento de simulação...");
        
        // Obter o próximo número de cliente
        const clientNumber = await getNextClientNumber();
        const clienteZenirId = `CLIENTE ZENIR ${clientNumber}`;
        
        console.log("Código de cliente gerado:", clienteZenirId);
        
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
            userName: window.currentUser.userData?.displayName || window.currentUser.email, // Nome do usuário que criou
            userBranch: window.currentUser.userData?.branch || '' // Filial do usuário
        };
        
        console.log("Dados preparados para salvamento:", dadosCompletos);
        
        // Salvar no Firestore
        const docRef = await addDoc(collection(db, "simulacoes"), dadosCompletos);
        console.log("Simulação salva com sucesso. ID:", docRef.id);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar a simulação:", error);
        if (window.debug && typeof window.debug.showDebugMessage === 'function') {
            window.debug.showDebugMessage(`Erro ao salvar: ${error.message}`, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Função para carregar o histórico de simulações
export async function loadSimulationHistory() {
    console.log("Função loadSimulationHistory chamada do main.js");
    
    const historyList = document.getElementById('historyList');
    const loadingElement = document.getElementById('loadingHistory');
    const emptyElement = document.getElementById('emptyHistory');
    
    // Mostrar loading
    historyList.innerHTML = '';
    loadingElement.classList.remove('hidden');
    emptyElement.classList.add('hidden');
    
    try {
        // Log para debug
        console.log("Iniciando carregamento do histórico...");
        
        // Verificar se o usuário está autenticado
        if (!window.currentUser) {
            console.error("Usuário não está autenticado!");
            loadingElement.classList.add('hidden');
            historyList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                    <p class="text-red-500">Erro: Usuário não está autenticado.</p>
                </div>
            `;
            return;
        }
        
        // Log do usuário atual para debug
        console.log("Usuário atual:", window.currentUser.email, window.currentUser.uid);
        
        // Criar query ordenada por data/hora (mais recentes primeiro)
        // Com filtro dependendo do usuário (admin vê tudo, outros veem apenas suas simulações)
        let simulationsQuery;
        
        if (window.currentUser.email === window.ADMIN_EMAIL) {
            // Admin vê todas as simulações
            console.log("Buscando simulações como ADMIN");
            simulationsQuery = query(
                collection(db, "simulacoes"),
                orderBy("dataHora", "desc"),
                limit(50)
            );
        } else {
            // Usuário comum vê apenas suas simulações
            console.log("Buscando simulações do usuário:", window.currentUser.uid);
            simulationsQuery = query(
                collection(db, "simulacoes"),
                where("userId", "==", window.currentUser.uid),
                orderBy("dataHora", "desc"),
                limit(50)
            );
        }
        
        // Buscar documentos
        console.log("Executando consulta...");
        const querySnapshot = await getDocs(simulationsQuery);
        
        console.log("Consulta concluída. Resultados:", querySnapshot.size);
        
        // Ocultar loading
        loadingElement.classList.add('hidden');
        
        // Verificar se há resultados
        if (querySnapshot.empty) {
            console.log("Nenhuma simulação encontrada");
            emptyElement.classList.remove('hidden');
            return;
        }
        
        // Processar resultados
        querySnapshot.forEach(docSnapshot => {
            console.log("Processando documento:", docSnapshot.id);
            const data = docSnapshot.data();
            
            // Criar o cartão para cada simulação
            const card = createSimulationCard(docSnapshot.id, data);
            historyList.appendChild(card);
        });
        
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        if (window.debug && typeof window.debug.showDebugMessage === 'function') {
            window.debug.showDebugMessage(`Erro no histórico: ${error.message}`, 'error');
        }
        
        loadingElement.classList.add('hidden');
        
        // Mostrar mensagem de erro
        historyList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                <p class="text-red-500">Erro ao carregar o histórico de simulações: ${error.message}</p>
                <button id="retryLoadBtn" class="mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary">Tentar novamente</button>
            </div>
        `;
        
        document.getElementById('retryLoadBtn').addEventListener('click', loadSimulationHistory);
    }
}

// Função para criar cartão de simulação
function createSimulationCard(id, data) {
    console.log("Criando cartão para simulação:", id);
    
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-custom p-4 border border-gray-200 dark:border-gray-600';
    card.setAttribute('data-simulation-id', id);
    
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
    
    // Verificar permissões do usuário atual
    const isAdmin = window.currentUser && window.currentUser.email === window.ADMIN_EMAIL;
    
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
    
    // Adicionar manipuladores de eventos
    setupCardEventHandlers(card, id, data, cliente);
    
    return card;
}

// Configurar handlers de eventos para cartões de simulação
function setupCardEventHandlers(card, id, data, cliente) {
    // Botão "Ver Detalhes"
    card.querySelector('.view-details-btn').addEventListener('click', () => {
        // Aqui você deve chamar sua função para exibir detalhes
        console.log("Ver detalhes da simulação:", id);
        // viewSimulationDetails(id, data); // Implementar esta função
    });
    
    // Botão "Excluir" (apenas para admin)
    const deleteBtn = card.querySelector('.delete-simulation-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log("Excluir simulação:", id);
            // confirmDeleteSimulation(id, cliente.nome); // Implementar esta função
        });
    }
    
    // Botões de contato
    if (cliente.telefone) {
        const phoneClean = cliente.telefone.replace(/\D/g, '');
        
        // Botão WhatsApp
        const whatsappBtn = card.querySelector('.contact-whatsapp-btn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => {
                const mensagem = `Olá ${cliente.nome}! 👋 Tudo bem? Vi que você fez uma simulação para o *${cliente.produto}* e gostaria de conversar sobre condições especiais para este produto. Podemos agendar uma visita à loja? Ou gostaria de tirar alguma dúvida por aqui mesmo? 😊`;
                const mensagemCodificada = encodeURIComponent(mensagem);
                const whatsappUrl = `https://wa.me/55${phoneClean}?text=${mensagemCodificada}`;
                window.open(whatsappUrl, '_blank');
            });
        }
        
        // Botão salvar contato
        const contactBtn = card.querySelector('.save-contact-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                if (window.utils && typeof window.utils.downloadVCard === 'function') {
                    window.utils.downloadVCard(cliente.nome, cliente.telefone, cliente.codigo);
                } else {
                    console.error("Função downloadVCard não encontrada");
                }
            });
        }
    }
}

// Registrar funções no contexto global (window)
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funções globais a partir de main.js");
    
    // Registrar funções do histórico
    window.history = window.history || {};
    window.history.loadSimulationHistory = loadSimulationHistory;
    window.history.getNextClientNumber = getNextClientNumber;
    window.history.salvarSimulacao = salvarSimulacao;
    
    // Log para confirmar registro
    console.log("Funções globais registradas:");
    console.log("- window.history.loadSimulationHistory:", !!window.history.loadSimulationHistory);
    console.log("- window.history.getNextClientNumber:", !!window.history.getNextClientNumber);
    console.log("- window.history.salvarSimulacao:", !!window.history.salvarSimulacao);
    
    // Adicionar botão de salvamento ao modal
    const saveBtn = document.getElementById('yesSaveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Fechar o modal de confirmação
            document.getElementById('confirmModal').classList.add('hidden');
            
            // Mostrar o modal de preenchimento de dados
            document.getElementById('saveModal').classList.remove('hidden');
            
            // Esconder mensagens
            document.getElementById('saveSuccessMessage').classList.add('hidden');
            document.getElementById('saveErrorMessage').classList.add('hidden');
            
            // Mostrar o formulário
            document.getElementById('saveSimulationForm').classList.remove('hidden');
        });
    }
    
    // Manipulador do formulário de salvar
    const saveForm = document.getElementById('saveSimulationForm');
    if (saveForm) {
        saveForm.addEventListener('submit', async function(event) {
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
                // Salvar a simulação
                const resultado = await window.history.salvarSimulacao({
                    clientName,
                    clientPhone,
                    productName
                });
                
                if (resultado.success) {
                    // Mostrar mensagem de sucesso
                    document.getElementById('saveSuccessMessage').classList.remove('hidden');
                } else {
                    // Mostrar mensagem de erro
                    document.getElementById('errorText').textContent = `Erro ao salvar: ${resultado.error}`;
                    document.getElementById('saveErrorMessage').classList.remove('hidden');
                }
            } catch (error) {
                console.error("Erro ao salvar a simulação:", error);
                
                // Mostrar mensagem de erro
                document.getElementById('errorText').textContent = `Erro ao salvar: ${error.message}`;
                document.getElementById('saveErrorMessage').classList.remove('hidden');
            }
        });
    }
});

// Exportar funções para uso em outros módulos
export {
    loadSimulationHistory,
    getNextClientNumber,
    salvarSimulacao
};
