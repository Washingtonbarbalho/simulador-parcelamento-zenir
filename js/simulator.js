// simulator.js - Lógica do simulador de parcelamento
import { FATORES } from './config.js';
import { formatCurrency, currencyToNumber, formatCurrencyInput, toUpperCaseInput } from './utilities.js';
import { ADMIN_EMAIL } from './config.js';

// Inicialização do simulador
export function initSimulator() {
    setupCurrencyInputs();
    setupParcelas();
    setupSimulationForm();
    setupSaveSimulation();
    
    // Adicionar manipulador para o botão Limpar Simulação
    if (document.getElementById('clearSimulationBtn')) {
        document.getElementById('clearSimulationBtn').addEventListener('click', reiniciarSimulacao);
    }
    
    // Adicionar manipuladores para os radio buttons de tipo de preço
    document.querySelectorAll('input[name="priceType"]').forEach(radio => {
        radio.addEventListener('change', atualizarEstadoMostruario);
    });
    
    // Inicializar o estado da caixa de mostruário
    atualizarEstadoMostruario();
}

// Configurar campos de entrada monetária
function setupCurrencyInputs() {
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
                const numericValue = currencyToNumber(input.value);
                input.value = numericValue.toString().replace('.', ',');
            }
        });
    });
    
    // Configurar campos de texto para maiúsculas
    document.getElementById('clientName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    document.getElementById('productName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
}

// Configurar seleção de parcelas
function setupParcelas() {
    // Gerar opções para o select múltiplo de parcelas
    const parcelasSelect = document.getElementById('parcelasSelect');
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x`;
        parcelasSelect.appendChild(option);
    }
    
    // Botões para selecionar/desmarcar todas as parcelas
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        const select = document.getElementById('parcelasSelect');
        for (let i = 0; i < select.options.length; i++) {
            select.options[i].selected = true;
        }
    });
    
    document.getElementById('deselectAllBtn').addEventListener('click', () => {
        const select = document.getElementById('parcelasSelect');
        for (let i = 0; i < select.options.length; i++) {
            select.options[i].selected = false;
        }
    });
    
    // Por padrão, desmarcar todas as parcelas
    document.getElementById('deselectAllBtn').click();
}

// Configurar formulário de simulação
function setupSimulationForm() {
    document.getElementById('simulationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obter valores do formulário
        const valorProdutoOriginal = currencyToNumber(document.getElementById('productValue').value);
        const valorGE = currencyToNumber(document.getElementById('geValue').value);
        const valorEntrada = currencyToNumber(document.getElementById('entryValue').value);
        const isMostruario = document.getElementById('isMostruario').checked;
        const useSpecialDiscount = document.getElementById('useSpecialDiscount').checked;
        
        // Valor do produto após subtrair entrada (se houver)
        const valorProduto = Math.max(0, valorProdutoOriginal - valorEntrada);
        
        // Obter opções selecionadas
        const tipoParcelamento = document.querySelector('input[name="paymentType"]:checked').value;
        const tipoPreco = document.querySelector('input[name="priceType"]:checked').value;
        const usarFator = document.querySelector('input[name="useFactor"]:checked').value === 'sim';
        const taxaPrestamista = document.querySelector('input[name="applyTaxaPrestamista"]:checked').value === 'sim';
        
        // Obter parcelas selecionadas do dropdown
        const parcelasSelect = document.getElementById('parcelasSelect');
        const parcelasSelecionadas = Array.from(parcelasSelect.selectedOptions)
            .map(option => parseInt(option.value))
            .sort((a, b) => a - b);
        
        // Verificar se há pelo menos uma parcela selecionada
        if (parcelasSelecionadas.length === 0) {
            alert('Selecione pelo menos uma opção de parcelamento.');
            return;
        }
        
        // Verificar se os valores são maiores que zero
        if (valorProdutoOriginal <= 0) {
            alert('Digite um valor válido para o produto.');
            return;
        }
        
        // Salvar entradas para uso posterior
        window.simulationResults = {
            inputs: {
                valorProdutoOriginal,
                valorGE,
                valorEntrada,
                valorProduto,
                isMostruario,
                useSpecialDiscount,
                tipoParcelamento,
                tipoPreco,
                usarFator,
                taxaPrestamista,
                parcelasSelecionadas
            },
            results: {
                carne: {},
                cartao: {}
            }
        };
        
        // Ocultar todas as seções de resultados
        document.getElementById('resultSectionCarne').classList.add('hidden');
        document.getElementById('resultSectionCartao').classList.add('hidden');
        
        // Limpar tabelas de resultados
        document.getElementById('resultTableBodyCarne').innerHTML = '';
        document.getElementById('resultTableBodyCartao').innerHTML = '';
        
        // Processar conforme o tipo de parcelamento selecionado
        if (tipoParcelamento === 'ambos') {
            processarTipoParcelamento('cartao');
            processarTipoParcelamento('carne');
        } else {
            processarTipoParcelamento(tipoParcelamento);
        }
        
        // Adicionar event listeners para os botões "Ver mais"
        document.querySelectorAll('.verMaisBtn').forEach(btn => {
            btn.addEventListener('click', function() {
                const parcela = this.getAttribute('data-parcela');
                const tipo = this.getAttribute('data-tipo');
                
                // Encontrar a linha de detalhes correspondente
                const detailRow = document.querySelector(`.detailRow[data-parcela="${parcela}"][data-tipo="${tipo}"]`);
                
                // Alternar visibilidade da linha de detalhes
                if (detailRow.classList.contains('hidden')) {
                    detailRow.classList.remove('hidden');
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    this.title = "Ocultar detalhes";
                } else {
                    detailRow.classList.add('hidden');
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                    this.title = "Ver detalhes";
                }
            });
        });
        
        // Mostrar botões de ação
        document.getElementById('saveButtonContainer').classList.remove('hidden');
        
        // Mostrar apenas o botão de salvar simulação se o usuário tiver permissão completa
        if (window.currentUser && 
            (window.currentUser.email === ADMIN_EMAIL || 
             (window.currentUser.userData && window.currentUser.userData.accessLevel === 'full'))) {
            document.querySelector('#saveSimulationBtn').classList.remove('hidden');
        } else {
            document.querySelector('#saveSimulationBtn').classList.add('hidden');
        }
        
        // Melhorar a rolagem para os resultados
        setTimeout(() => {
            // Determinar qual seção de resultados está visível
            const resultadoVisivel = document.querySelector('#resultSectionCarne:not(.hidden), #resultSectionCartao:not(.hidden)');
            if (resultadoVisivel) {
                // Rolar até a seção de resultados
                resultadoVisivel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    });
}

// Função para processar um tipo de parcelamento
function processarTipoParcelamento(tipo) {
    // Selecionar a tabela correta
    const tableBody = document.getElementById(`resultTableBody${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    
    // Inicializar array de resultados para este tipo
    window.simulationResults.results[tipo] = [];
    
    const { valorProduto, valorGE, valorEntrada, isMostruario, useSpecialDiscount, tipoPreco, usarFator, taxaPrestamista, parcelasSelecionadas } = window.simulationResults.inputs;
    
    for (const numParcela of parcelasSelecionadas) {
        const resultado = calcularParcela(
            valorProduto, 
            valorGE, 
            numParcela, 
            tipo, 
            tipoPreco, 
            usarFator, 
            taxaPrestamista,
            isMostruario
        );
        
        // Salvar resultado para uso posterior
        window.simulationResults.results[tipo].push({
            numParcela,
            ...resultado
        });
        
        // Criar linha da tabela
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-100 dark:hover:bg-gray-700';
        
        // Calcular o total da compra (parcelas + entrada)
        const totalCompra = resultado.totalParcelado + valorEntrada;
        
        // Calcular o valor inflacionado para desconto especial (apenas para carnê)
        let valorParcelaInflacionada = 0;
        let totalInflacionado = 0;
        let descontoParcela = 0;
        let descontoTotal = 0;
        
        if (useSpecialDiscount && tipo === 'carne') {
            valorParcelaInflacionada = calcularDescontoEspecial(valorProduto, valorGE, numParcela, taxaPrestamista);
            totalInflacionado = valorParcelaInflacionada * numParcela + valorEntrada;
            descontoParcela = valorParcelaInflacionada - resultado.valorParcela;
            descontoTotal = totalInflacionado - totalCompra;
        }
        
        // Estilo especial para linha de mostruário
        const mostruarioClass = resultado.isMostruarioIndicator ? 'text-yellow-600 dark:text-yellow-400 font-bold' : '';
        
        // Adicionar células
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="text-sm font-medium ${tipo === 'cartao' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'} ${mostruarioClass}">
                        ${numParcela}x${resultado.isMostruarioIndicator ? ' (Mostruário)' : ''}
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium ${mostruarioClass}">
                ${useSpecialDiscount && tipo === 'carne' ? 
                    `<div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400">Fora da promoção:</span>
                        <span class="line-through text-gray-400">${formatCurrency(valorParcelaInflacionada)}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">Na promoção:</span>
                        <span class="font-semibold">${formatCurrency(resultado.valorParcela)}</span>
                        <span class="text-red-500 text-xs font-medium">Economia: ${formatCurrency(descontoParcela)}</span>
                    </div>` 
                    : formatCurrency(resultado.valorParcela)
                }
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <button type="button" class="text-primary hover:text-secondary focus:outline-none verMaisBtn h-8 w-8 inline-flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20"
                    data-parcela="${numParcela}"
                    data-tipo="${tipo}"
                    title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        // Adicionar linha oculta para detalhes expandidos
        const detailRow = document.createElement('tr');
        detailRow.className = 'bg-gray-50 dark:bg-gray-800 hidden detailRow';
        detailRow.setAttribute('data-parcela', numParcela);
        detailRow.setAttribute('data-tipo', tipo);
        
        // Células da linha de detalhes
        let detailHTML = `
            <td colspan="3" class="px-4 py-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">`;
        
        // Adicionar seção de desconto especial para carnê
        if (useSpecialDiscount && tipo === 'carne') {
            detailHTML += `
                    <div class="md:col-span-3 mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                        <p class="text-gray-500 dark:text-gray-400">Fora da promoção:</p>
                        <p class="font-medium line-through text-gray-500">${formatCurrency(totalInflacionado)}</p>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">Na promoção:</p>
                        <p class="font-medium">${formatCurrency(totalCompra)}</p>
                        <p class="text-red-500 font-medium">Economia total: ${formatCurrency(descontoTotal)}</p>
                    </div>`;
        }
        
        detailHTML += `
                    <div>
                        <p class="text-gray-500 dark:text-gray-400">Total da compra:</p>
                        <p class="font-medium">${formatCurrency(totalCompra)}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 dark:text-gray-400">Total do produto${valorEntrada > 0 ? ' + entrada' : ''}:</p>
                        <p class="font-medium">${formatCurrency(resultado.totalProduto + valorEntrada)}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 dark:text-gray-400">Total GE:</p>
                        <p class="font-medium">${formatCurrency(resultado.totalGE)}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 dark:text-gray-400">Total prestamista:</p>
                        <p class="font-medium">${formatCurrency(resultado.totalPrestamista)}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 dark:text-gray-400">Total de serviços:</p>
                        <p class="font-medium">${formatCurrency(resultado.totalServicos)}</p>
                    </div>`;
        
        // Adicionar explicação do mostruário se aplicável
        if (resultado.isMostruarioIndicator) {
            detailHTML += `
                    <div class="md:col-span-3 mt-2 border-t border-gray-300 dark:border-gray-600 pt-2">
                        <p class="text-yellow-600 dark:text-yellow-400 font-medium">
                            Peça de mostruário: O produto está usando o fator de 12x do cartão (${FATORES.cartao[11]}) em vez do fator de carnê (${FATORES.carne[11]})
                        </p>
                    </div>`;
        }
        
        detailHTML += `
                </div>
            </td>`;
        
        detailRow.innerHTML = detailHTML;
        tableBody.appendChild(detailRow);
    }
    
    // Mostrar a seção de resultados correspondente
    document.getElementById(`resultSection${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.remove('hidden');
}

// Função para calcular o valor da parcela
export function calcularParcela(valorTotal, valorGE, numParcela, tipoParcelamento, tipoPreco, usarFator, taxaPrestamista, isMostruario) {
    // Inicializa valores de parcela do produto e GE
    let valorParcelaProduto = 0;
    let valorParcelaGE = 0;
    
    // Índice para acessar o fator de parcelamento (0 para 1x, 1 para 2x, etc.)
    const indice = numParcela - 1;
    
    // Caso especial: peça de mostruário na parcela 12x do carnê (apenas para preço de tabela)
    // Usamos o fator de cartão para o produto, mas mantemos o fator do carnê para a GE
    if (isMostruario && tipoParcelamento === 'carne' && numParcela === 12 && tipoPreco === 'tabela') {
        valorParcelaProduto = valorTotal * FATORES['cartao'][11]; // Índice 11 = 12x
        valorParcelaGE = valorGE * FATORES['carne'][11];
    }
    // Caso normal
    else if (usarFator) {
        // Usa o fator para ambos produto e GE
        valorParcelaProduto = valorTotal * FATORES[tipoParcelamento][indice];
        valorParcelaGE = valorGE * FATORES[tipoParcelamento][indice];
    } else {
        // Preços promocionais - sem juros até certo número de parcelas
        if (tipoPreco === 'promocional') {
            if (tipoParcelamento === 'cartao') {
                // Cartão: produto sem juros até 3x, GE sem juros até 6x
                valorParcelaProduto = numParcela <= 3 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 6 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            } else { // carnê
                // Carnê: produto sem juros até 2x, GE sem juros até 5x
                valorParcelaProduto = numParcela <= 2 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 5 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            }
        } else { // preço tabela
            if (tipoParcelamento === 'cartao') {
                // Cartão: produto e GE sem juros até 6x
                valorParcelaProduto = numParcela <= 6 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 6 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            } else { // carnê
                // Carnê: produto e GE sem juros até 5x
                valorParcelaProduto = numParcela <= 5 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 5 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
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
export function calcularDescontoEspecial(valorProduto, valorGE, numParcela, taxaPrestamista) {
    // Calcular valor inflacionado: (valor do produto + 50%) + valor GE
    const valorProdutoInflacionado = valorProduto * 1.5; // Valor + 50%
    const valorBase = valorProdutoInflacionado + valorGE;
    
    // Multiplicar pelo fator de carnê (sempre usado no desconto especial)
    const indice = numParcela - 1;
    let valorParcelaInflacionada = valorBase * FATORES.carne[indice];
    
    // Aplicar taxa prestamista se necessário
    if (taxaPrestamista) {
        valorParcelaInflacionada *= 1.06; // +6%
    }
    
    return valorParcelaInflacionada;
}

// Função para limpar o formulário e reiniciar a simulação
export function reiniciarSimulacao() {
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
    window.simulationResults = {
        inputs: {},
        results: {}
    };
    
    // Verificar o estado do mostruário
    atualizarEstadoMostruario();
}

// Função para atualizar o estado da caixa de mostruário com base no tipo de preço
export function atualizarEstadoMostruario() {
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

// Configuração para salvar simulação
function setupSaveSimulation() {
    // Manipulador do botão Salvar Simulação
    document.getElementById('saveSimulationBtn').addEventListener('click', function() {
        // Mostrar o modal de confirmação
        document.getElementById('confirmModal').classList.remove('hidden');
    });
    
    // Manipulador do botão "Não" do modal de confirmação
    document.getElementById('noSaveBtn').addEventListener('click', function() {
        // Fechar o modal de confirmação
        document.getElementById('confirmModal').classList.add('hidden');
        
        // Limpar formulário e reiniciar simulação
        reiniciarSimulacao();
    });
    
    // Manipulador do botão "Sim" do modal de confirmação
    document.getElementById('yesSaveBtn').addEventListener('click', function() {
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
    
    // Manipulador do botão Cancelar no modal
    document.getElementById('cancelSaveBtn').addEventListener('click', function() {
        document.getElementById('saveModal').classList.add('hidden');
    });
    
    // Manipulador para o botão Nova Simulação
    document.getElementById('newSimulationBtn').addEventListener('click', function() {
        document.getElementById('saveModal').classList.add('hidden');
        reiniciarSimulacao();
    });
    
    // Manipulador para o botão Tentar Novamente
    document.getElementById('tryAgainBtn').addEventListener('click', function() {
        document.getElementById('saveErrorMessage').classList.add('hidden');
        document.getElementById('saveSimulationForm').classList.remove('hidden');
    });
    
    // Manipulador do formulário de salvar
    document.getElementById('saveSimulationForm').addEventListener('submit', async function(event) {
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
    });
}

// Exportar funções para uso global
window.simulator = {
    calcularParcela,
    calcularDescontoEspecial,
    reiniciarSimulacao,
    atualizarEstadoMostruario
};

// Inicializar simulador ao carregar o módulo
document.addEventListener('DOMContentLoaded', initSimulator);
