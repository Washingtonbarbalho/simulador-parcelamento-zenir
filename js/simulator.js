// Variáveis globais do simulador
let simulationResults = {
    inputs: {},
    results: {}
};

// Função para calcular o valor da parcela
function calcularParcela(valorTotal, valorGE, numParcela, tipoParcelamento, tipoPreco, usarFator, taxaPrestamista, isMostruario) {
    // Inicializa valores de parcela do produto e GE
    let valorParcelaProduto = 0;
    let valorParcelaGE = 0;
    
    // Índice para acessar o fator de parcelamento (0 para 1x, 1 para 2x, etc.)
    const indice = numParcela - 1;
    
    // Caso especial: peça de mostruário na parcela 12x do carnê (apenas para preço de tabela)
    // Usamos o fator de cartão para o produto, mas mantemos o fator do carnê para a GE
    if (isMostruario && tipoParcelamento === 'carne' && numParcela === 12 && tipoPreco === 'tabela') {
        valorParcelaProduto = valorTotal * window.FATORES['cartao'][11]; // Índice 11 = 12x
        valorParcelaGE = valorGE * window.FATORES['carne'][11];
    }
    // Caso normal
    else if (usarFator) {
        // Usa o fator para ambos produto e GE
        valorParcelaProduto = valorTotal * window.FATORES[tipoParcelamento][indice];
        valorParcelaGE = valorGE * window.FATORES[tipoParcelamento][indice];
    } else {
        // Preços promocionais - sem juros até certo número de parcelas
        if (tipoPreco === 'promocional') {
            if (tipoParcelamento === 'cartao') {
                // Cartão: produto sem juros até 3x, GE sem juros até 6x
                valorParcelaProduto = numParcela <= 3 ? valorTotal / numParcela : valorTotal * window.FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 6 ? valorGE / numParcela : valorGE * window.FATORES[tipoParcelamento][indice];
            } else { // carnê
                // Carnê: produto sem juros até 2x, GE sem juros até 5x
                valorParcelaProduto = numParcela <= 2 ? valorTotal / numParcela : valorTotal * window.FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 5 ? valorGE / numParcela : valorGE * window.FATORES[tipoParcelamento][indice];
            }
        } else { // preço tabela
            if (tipoParcelamento === 'cartao') {
                // Cartão: produto e GE sem juros até 6x
                valorParcelaProduto = numParcela <= 6 ? valorTotal / numParcela : valorTotal * window.FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 6 ? valorGE / numParcela : valorGE * window.FATORES[tipoParcelamento][indice];
            } else { // carnê
                // Carnê: produto e GE sem juros até 5x
                valorParcelaProduto = numParcela <= 5 ? valorTotal / numParcela : valorTotal * window.FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 5 ? valorGE / numParcela : valorGE * window.FATORES[tipoParcelamento][indice];
            }
        }
    }
    
    // Calcula o valor total da parcela
    let valorParcela = valorParcelaProduto + valorParcelaGE;
    
    // Aplica taxa prestamista (6%) se necessário
    let valorTaxaPrestamista = 0;
    if (taxaPrestamista && tipoParcelamento === 'carne') {
        valorTaxaPrestamista = valorParcela * 0.06;
        valorParcela += valorTaxaPrestamista;
    }
    
    // Calcula valores totais (sem a entrada - será adicionada na exibição)
    const totalParcelado = valorParcela * numParcela; // Valor da parcela geral × qtd de parcelas
    const totalProduto = valorParcelaProduto * numParcela; // Valor da parcela do produto × qtd de parcelas
    const totalGE = valorParcelaGE * numParcela;
    const totalPrestamista = valorTaxaPrestamista * numParcela;
    const totalServicos = totalGE + totalPrestamista;
    
    // Indicador especial para peças de mostruário (apenas para preço de tabela)
    const isMostruarioIndicator = (isMostruario && tipoParcelamento === 'carne' && numParcela === 12 && tipoPreco === 'tabela');
    
    return {
        valorParcela,
        valorParcelaProduto,
        valorParcelaGE,
        valorTaxaPrestamista,
        totalParcelado,
        totalProduto,
        totalGE,
        totalPrestamista,
        totalServicos,
        isMostruarioIndicator
    };
}

// Função para calcular o valor inflacionado do desconto especial (para ancoragem)
function calcularDescontoEspecial(valorProduto, valorGE, numParcela, taxaPrestamista) {
    // Calcular valor inflacionado: (valor do produto + 50%) + valor GE
    const valorProdutoInflacionado = valorProduto * 1.5; // Valor + 50%
    const valorBase = valorProdutoInflacionado + valorGE;
    
    // Multiplicar pelo fator de carnê (sempre usado no desconto especial)
    const indice = numParcela - 1;
    let valorParcelaInflacionada = valorBase * window.FATORES.carne[indice];
    
    // Aplicar taxa prestamista se necessário
    if (taxaPrestamista) {
        valorParcelaInflacionada *= 1.06; // +6%
    }
    
    return valorParcelaInflacionada;
}

// Função para limpar o formulário e reiniciar a simulação
function reiniciarSimulacao() {
    // Limpar campos de entrada
    document.getElementById('productValue').value = '';
    document.getElementById('geValue').value = '';
    document.getElementById('entryValue').value = '';
    document.getElementById('isMostruario').checked = false;
    document.getElementById('useSpecialDiscount').checked = false;
    
    // Resetar campos do modal
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('productName').value = '';
    
    // Resetar rádios para valores padrão
    document.querySelector('input[name="paymentType"][value="carne"]').checked = true;
    document.querySelector('input[name="priceType"][value="promocional"]').checked = true;
    document.querySelector('input[name="useFactor"][value="nao"]').checked = true;
    document.querySelector('input[name="applyTaxaPrestamista"][value="sim"]').checked = true;
    
    // Limpar resultados
    document.getElementById('resultSectionCarne').classList.add('hidden');
    document.getElementById('resultSectionCartao').classList.add('hidden');
    document.getElementById('saveButtonContainer').classList.add('hidden');
    
    // Fechar modais
    document.getElementById('confirmModal').classList.add('hidden');
    document.getElementById('saveModal').classList.add('hidden');
    
    // Resetar parcelas
    document.getElementById('deselectAllBtn').click();
    
    // Rolar para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Redefinir resultados da simulação
    simulationResults = {
        inputs: {},
        results: {}
    };
    
    // Verificar o estado do mostruário
    atualizarEstadoMostruario();
}

// Função para atualizar o estado da caixa de mostruário com base no tipo de preço
function atualizarEstadoMostruario() {
    const tipoPreco = document.querySelector('input[name="priceType"]:checked').value;
    const checkboxMostruario = document.getElementById('isMostruario');
    const msgMostruario = document.getElementById('mostruarioDisabledMsg');
    
    if (tipoPreco === 'tabela') {
        // Habilitar quando for preço de tabela
        checkboxMostruario.disabled = false;
        msgMostruario.style.display = 'none';
    } else {
        // Desabilitar e desmarcar quando for preço promocional
        checkboxMostruario.disabled = true;
        checkboxMostruario.checked = false;
        msgMostruario.style.display = 'block';
    }
}

// Configurar formatação de campos com input monetário
function setupCurrencyInputs() {
    // Função para formatar campos de entrada monetária
    function formatCurrencyInput(input) {
        let value = input.value.replace(/\D/g, '');
        value = (parseInt(value) || 0) / 100;
        
        if (value === 0) {
            input.value = '';
        } else {
            // Formatar como moeda brasileira: R$ X.XXX,XX
            input.value = 'R$ ' + value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }
    
    // Configurar campos de entrada monetária
    document.querySelectorAll('#productValue, #geValue, #entryValue').forEach(input => {
        input.addEventListener('input', () => formatCurrencyInput(input));
        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                input.value = '';
            }
        });
        input.addEventListener('focus', function() {
            // Remove formatação para facilitar edição
            if (input.value) {
                const numericValue = window.currencyToNumber(input.value);
                input.value = numericValue.toString().replace('.', ',');
            }
        });
    });
    
    // Função para converter texto para maiúsculas em tempo real
    function toUpperCaseInput(input) {
        input.value = input.value.toUpperCase();
    }
    
    // Configurar campos de texto para maiúsculas
    document.getElementById('clientName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    document.getElementById('productName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
}

// Função para obter e incrementar o contador de clientes
async function getNextClientNumber() {
    try {
        // Referência para o documento de contador
        const counterRef = window.firebase.doc(window.db, "contadores", "clientes");
        
        // Tentar obter o documento atual
        const counterDoc = await window.firebase.getDoc(counterRef);
        
        let currentCount = 1; // Valor padrão se não existir
        
        if (counterDoc.exists()) {
            currentCount = counterDoc.data().contador + 1;
            
            // Atualizar o contador
            await window.firebase.updateDoc(counterRef, {
                contador: currentCount
            });
        } else {
            // Criar o documento de contador se não existir
            await window.firebase.setDoc(counterRef, {
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
async function salvarSimulacao(dadosCliente) {
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
            simulacao: simulationResults,
            dataHora: new Date().toISOString(),
            status: "Pendente", // Status inicial
            userId: currentUser.uid, // ID do usuário que criou a simulação
            userName: currentUser.userData.displayName || currentUser.email, // Nome do usuário que criou
            userBranch: currentUser.userData.branch || '' // Filial do usuário
        };
        
        // Salvar no Firestore
        const docRef = await window.firebase.addDoc(window.firebase.collection(window.db, "simulacoes"), dadosCompletos);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar a simulação:", error);
        return { success: false, error: error.message };
    }
}

// Exportar funções e variáveis para uso global
window.calcularParcela = calcularParcela;
window.calcularDescontoEspecial = calcularDescontoEspecial;
window.reiniciarSimulacao = reiniciarSimulacao;
window.atualizarEstadoMostruario = atualizarEstadoMostruario;
window.setupCurrencyInputs = setupCurrencyInputs;
window.getNextClientNumber = getNextClientNumber;
window.salvarSimulacao = salvarSimulacao;
window.simulationResults = simulationResults;
