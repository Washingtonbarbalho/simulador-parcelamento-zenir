import { db, collection, getDocs, query, orderBy, limit, doc, getDoc, setDoc } from './config.js';

// Função para verificar a conexão com o Firestore e permissões
export async function testFirestoreConnection() {
    console.log("Testando conexão com Firestore...");
    
    try {
        // Tentar listar simulações (leitura)
        const simulationsQuery = query(
            collection(db, "simulacoes"),
            orderBy("dataHora", "desc"),
            limit(1)
        );
        
        const snapshot = await getDocs(simulationsQuery);
        console.log(`Teste de leitura: ${snapshot.empty ? 'Nenhum documento encontrado' : 'Documentos encontrados'}`);
        console.log("Conexão com Firestore OK ✅");
        
        // Verificar se o usuário está autenticado
        console.log(`Usuário autenticado: ${window.currentUser ? 'Sim ✅' : 'Não ❌'}`);
        if (window.currentUser) {
            console.log(`Email: ${window.currentUser.email}`);
            console.log(`UID: ${window.currentUser.uid}`);
            console.log(`Dados adicionais:`, window.currentUser.userData);
        }
        
        // Testar a criação/leitura do contador
        try {
            const counterRef = doc(db, "contadores", "teste_diagnóstico");
            const timestamp = Date.now();
            
            // Tenta criar/atualizar o documento de teste
            await setDoc(counterRef, {
                timestamp,
                testValue: "debug_ok"
            });
            
            // Tenta ler o documento recém criado
            const counterDoc = await getDoc(counterRef);
            if (counterDoc.exists() && counterDoc.data().timestamp === timestamp) {
                console.log("Teste de escrita/leitura: OK ✅");
            } else {
                console.log("Teste de escrita/leitura: Falha ❌");
            }
        } catch (e) {
            console.error("Teste de escrita falhou:", e);
            showDebugMessage("Erro no teste de escrita: " + e.message, 'error');
        }
        
        return true;
    } catch (error) {
        console.error("❌ Erro na conexão com Firestore:", error);
        showDebugMessage("Erro de conexão Firestore: " + error.message, 'error');
        return false;
    }
}

// Exibir mensagem de debug na página
export function showDebugMessage(message, type = 'info') {
    // Verificar se o elemento de debug já existe
    let debugElement = document.getElementById('debug-overlay');
    
    if (!debugElement) {
        // Criar elemento de debug se não existir
        debugElement = document.createElement('div');
        debugElement.id = 'debug-overlay';
        debugElement.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            border-radius: 4px;
            font-family: monospace;
            z-index: 9999;
            max-width: 80%;
            max-height: 30%;
            overflow: auto;
        `;
        document.body.appendChild(debugElement);
    }
    
    // Criar elemento para a mensagem
    const msgElement = document.createElement('div');
    msgElement.className = `debug-msg ${type}`;
    msgElement.style.marginBottom = '5px';
    msgElement.style.color = type === 'error' ? '#ff6b6b' : 
                            type === 'success' ? '#51cf66' : 
                            type === 'warning' ? '#fcc419' : '#74c0fc';
    msgElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    // Adicionar no início para que as mensagens mais recentes fiquem em cima
    debugElement.insertBefore(msgElement, debugElement.firstChild);
    
    // Limite de mensagens
    if (debugElement.children.length > 10) {
        debugElement.removeChild(debugElement.lastChild);
    }
    
    // Também registrar no console
    const consoleMethod = type === 'error' ? console.error : 
                         type === 'warning' ? console.warn : 
                         type === 'success' ? console.info : console.log;
    
    consoleMethod(`[Debug] ${message}`);
}

// Testar o contador de clientes (função específica para diagnóstico)
export async function testClientCounter() {
    try {
        showDebugMessage("Testando contador de clientes...", 'info');
        
        // Testar se podemos acessar a função getNextClientNumber
        if (window.history && typeof window.history.getNextClientNumber === 'function') {
            showDebugMessage("Função getNextClientNumber encontrada ✅", 'success');
            
            // Tentar obter o próximo número
            try {
                const nextNumber = await window.history.getNextClientNumber();
                showDebugMessage(`Próximo número de cliente: ${nextNumber} ✅`, 'success');
                return true;
            } catch (e) {
                showDebugMessage(`Erro ao obter próximo número: ${e.message} ❌`, 'error');
                console.error(e);
                return false;
            }
        } else {
            showDebugMessage("Função getNextClientNumber NÃO encontrada ❌", 'error');
            
            // Tentar acessar diretamente o documento de contador
            try {
                const counterRef = doc(db, "contadores", "clientes");
                const counterDoc = await getDoc(counterRef);
                
                if (counterDoc.exists()) {
                    const currentCount = counterDoc.data().contador;
                    showDebugMessage(`Contador atual: ${currentCount} (acesso direto) ✅`, 'success');
                } else {
                    showDebugMessage("Documento contador não existe, tentando criar", 'warning');
                    
                    // Tentar criar o documento
                    await setDoc(counterRef, { contador: 1 });
                    showDebugMessage("Documento contador criado com sucesso ✅", 'success');
                }
                
                return true;
            } catch (e) {
                showDebugMessage(`Erro ao acessar contador: ${e.message} ❌`, 'error');
                console.error(e);
                return false;
            }
        }
    } catch (error) {
        showDebugMessage(`Erro geral no teste: ${error.message} ❌`, 'error');
        console.error(error);
        return false;
    }
}

// Testar salvamento de simulação (dummy test)
export async function testSaveSimulation() {
    try {
        showDebugMessage("Testando salvamento de simulação...", 'info');
        
        // Verificar se o usuário está autenticado
        if (!window.currentUser) {
            showDebugMessage("Usuário não autenticado ❌", 'error');
            return false;
        }
        
        // Criar dados de teste
        const testData = {
            clientName: "CLIENTE TESTE DIAGNÓSTICO",
            clientPhone: "(99)99999-9999",
            productName: "PRODUTO TESTE"
        };
        
        // Testar se podemos acessar a função salvarSimulacao
        if (window.history && typeof window.history.salvarSimulacao === 'function') {
            showDebugMessage("Função salvarSimulacao encontrada ✅", 'success');
            
            // Tentar salvar uma simulação de teste
            try {
                // Fazer backup dos resultados atuais da simulação
                const backupResults = window.simulationResults;
                
                // Definir resultados de teste para simulação
                window.simulationResults = {
                    inputs: {
                        valorProdutoOriginal: 1000,
                        valorGE: 100,
                        valorEntrada: 0,
                        tipoParcelamento: 'carne',
                        tipoPreco: 'promocional'
                    },
                    results: {
                        carne: [
                            {
                                numParcela: 1,
                                valorParcela: 1169,
                                totalParcelado: 1169
                            }
                        ]
                    }
                };
                
                const result = await window.history.salvarSimulacao(testData);
                
                // Restaurar resultados originais
                window.simulationResults = backupResults;
                
                if (result.success) {
                    showDebugMessage(`Simulação de teste salva com ID: ${result.id} ✅`, 'success');
                    
                    // Tentar excluir a simulação de teste
                    try {
                        await window.history.deleteSimulation(result.id);
                        showDebugMessage("Simulação de teste excluída com sucesso ✅", 'success');
                    } catch (e) {
                        showDebugMessage(`Aviso: Não foi possível excluir a simulação de teste: ${e.message}`, 'warning');
                    }
                    
                    return true;
                } else {
                    showDebugMessage(`Erro ao salvar simulação de teste: ${result.error} ❌`, 'error');
                    return false;
                }
            } catch (e) {
                showDebugMessage(`Erro ao salvar simulação: ${e.message} ❌`, 'error');
                console.error(e);
                return false;
            }
        } else {
            showDebugMessage("Função salvarSimulacao NÃO encontrada ❌", 'error');
            return false;
        }
    } catch (error) {
        showDebugMessage(`Erro geral no teste: ${error.message} ❌`, 'error');
        console.error(error);
        return false;
    }
}

// Inicializar diagnóstico ao carregar
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar botão de diagnóstico
    const btn = document.createElement('button');
    btn.textContent = '🔍 Diagnóstico';
    btn.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        padding: 5px 10px;
        background: #5D5CDE;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9998;
        cursor: pointer;
    `;
    
    btn.addEventListener('click', async function() {
        showDebugMessage('Iniciando diagnóstico completo...', 'info');
        
        // Testar conexão com Firestore
        const firestoreOk = await testFirestoreConnection();
        showDebugMessage(`Conexão Firestore: ${firestoreOk ? 'OK' : 'Falha'}`, firestoreOk ? 'success' : 'error');
        
        // Verificar estado da autenticação
        if (window.currentUser) {
            showDebugMessage(`Autenticado como: ${window.currentUser.email}`, 'success');
        } else {
            showDebugMessage('Usuário não autenticado', 'warning');
        }
        
        // Verificar acesso ao histórico
        try {
            if (window.history && typeof window.history.loadSimulationHistory === 'function') {
                showDebugMessage('Função de histórico disponível', 'success');
            } else {
                showDebugMessage('Função de histórico NÃO disponível', 'error');
            }
        } catch (e) {
            showDebugMessage(`Erro ao acessar histórico: ${e.message}`, 'error');
        }
        
        // Testar contador de clientes
        await testClientCounter();
        
        // Testar salvamento se o usuário estiver autenticado
        if (window.currentUser) {
            await testSaveSimulation();
        }
        
        showDebugMessage('Diagnóstico completo!', 'info');
    });
    
    document.body.appendChild(btn);
});

// Exportar funções para uso global
window.debug = {
    testFirestoreConnection,
    showDebugMessage,
    testClientCounter,
    testSaveSimulation
};
