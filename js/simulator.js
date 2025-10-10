// Módulo do Simulador (simulator.js)
// Contém toda a lógica de cálculo e interação do formulário de simulação.

import { db, firebase } from './firebase-init.js';
import { FATORES } from './config.js';
import { currentUser } from './auth.js';
import { formatCurrency, currencyToNumber, showToast } from './utils.js';
import { atualizarEstadoMostruario } from './ui.js';

let simulationResults = { inputs: {}, results: {} };

// --- Lógica de Cálculo ---

function calcularParcela(valorTotal, valorGE, numParcela, tipoParcelamento, tipoPreco, usarFator, taxaPrestamista, isMostruario) {
    let valorParcelaProduto = 0;
    let valorParcelaGE = 0;
    const indice = numParcela - 1;

    // Caso especial: peça de mostruário
    if (isMostruario && tipoParcelamento === 'carne' && numParcela === 12 && tipoPreco === 'tabela') {
        valorParcelaProduto = valorTotal * FATORES.cartao[11];
        valorParcelaGE = valorGE * FATORES.carne[11];
    } else if (usarFator) {
        valorParcelaProduto = valorTotal * FATORES[tipoParcelamento][indice];
        valorParcelaGE = valorGE * FATORES[tipoParcelamento][indice];
    } else {
        if (tipoPreco === 'promocional') {
            if (tipoParcelamento === 'cartao') {
                valorParcelaProduto = numParcela <= 3 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 6 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            } else { // carnê
                valorParcelaProduto = numParcela <= 2 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 5 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            }
        } else { // tabela
            if (tipoParcelamento === 'cartao') {
                valorParcelaProduto = numParcela <= 6 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 6 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            } else { // carnê
                valorParcelaProduto = numParcela <= 5 ? valorTotal / numParcela : valorTotal * FATORES[tipoParcelamento][indice];
                valorParcelaGE = numParcela <= 5 ? valorGE / numParcela : valorGE * FATORES[tipoParcelamento][indice];
            }
        }
    }

    let valorParcela = valorParcelaProduto + valorParcelaGE;
    let valorTaxaPrestamista = 0;
    if (taxaPrestamista && tipoParcelamento === 'carne') {
        valorTaxaPrestamista = valorParcela * 0.06;
        valorParcela += valorTaxaPrestamista;
    }

    return {
        valorParcela, valorParcelaProduto, valorParcelaGE, valorTaxaPrestamista,
        totalParcelado: valorParcela * numParcela,
        totalProduto: valorParcelaProduto * numParcela,
        totalGE: valorParcelaGE * numParcela,
        totalPrestamista: valorTaxaPrestamista * numParcela,
        totalServicos: (valorParcelaGE + valorTaxaPrestamista) * numParcela,
        isMostruarioIndicator: isMostruario && tipoParcelamento === 'carne' && numParcela === 12 && tipoPreco === 'tabela'
    };
}

function calcularDescontoEspecial(valorProduto, valorGE, numParcela, taxaPrestamista) {
    const valorProdutoInflacionado = valorProduto * 1.5;
    const valorBase = valorProdutoInflacionado + valorGE;
    let valorParcelaInflacionada = valorBase * FATORES.carne[numParcela - 1];
    if (taxaPrestamista) {
        valorParcelaInflacionada *= 1.06;
    }
    return valorParcelaInflacionada;
}

// --- Manipulação do DOM do Simulador ---

function renderResults() {
    // Limpa resultados antigos
    document.getElementById('resultSectionCarne').classList.add('hidden');
    document.getElementById('resultSectionCartao').classList.add('hidden');
    document.getElementById('resultTableBodyCarne').innerHTML = '';
    document.getElementById('resultTableBodyCartao').innerHTML = '';

    const { tipoParcelamento } = simulationResults.inputs;

    if (tipoParcelamento === 'ambos' || tipoParcelamento === 'carne') {
        renderResultTable('carne');
    }
    if (tipoParcelamento === 'ambos' || tipoParcelamento === 'cartao') {
        renderResultTable('cartao');
    }

    // Adiciona eventos aos botões "Ver mais"
    document.querySelectorAll('.verMaisBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parcela = this.dataset.parcela;
            const tipo = this.dataset.tipo;
            const detailRow = document.querySelector(`.detailRow[data-parcela="${parcela}"][data-tipo="${tipo}"]`);
            detailRow.classList.toggle('hidden');
            this.innerHTML = detailRow.classList.contains('hidden') ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    });

    document.getElementById('saveButtonContainer').classList.remove('hidden');
    const primeiraSecao = document.querySelector('#resultSectionCarne:not(.hidden), #resultSectionCartao:not(.hidden)');
    if (primeiraSecao) {
        primeiraSecao.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderResultTable(tipo) {
    const tableBody = document.getElementById(`resultTableBody${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    const { useSpecialDiscount, valorEntrada } = simulationResults.inputs;

    simulationResults.results[tipo].forEach(resultado => {
        const totalCompra = resultado.totalParcelado + valorEntrada;
        
        let valorParcelaInflacionada = 0, totalInflacionado = 0, descontoParcela = 0, descontoTotal = 0;
        if (useSpecialDiscount && tipo === 'carne') {
            valorParcelaInflacionada = calcularDescontoEspecial(simulationResults.inputs.valorProduto, simulationResults.inputs.valorGE, resultado.numParcela, simulationResults.inputs.taxaPrestamista);
            totalInflacionado = valorParcelaInflacionada * resultado.numParcela + valorEntrada;
            descontoParcela = valorParcelaInflacionada - resultado.valorParcela;
            descontoTotal = totalInflacionado - totalCompra;
        }

        const mostruarioClass = resultado.isMostruarioIndicator ? 'text-yellow-600 dark:text-yellow-400 font-bold' : '';
        const tipoClass = tipo === 'cartao' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-100 dark:hover:bg-gray-700';
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap"><div class="text-sm font-medium ${tipoClass} ${mostruarioClass}">${resultado.numParcela}x${resultado.isMostruarioIndicator ? ' (Mostruário)' : ''}</div></td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium ${mostruarioClass}">
                ${useSpecialDiscount && tipo === 'carne' ? `
                    <div class="flex flex-col">
                        <span class="line-through text-gray-400">${formatCurrency(valorParcelaInflacionada)}</span>
                        <span class="font-semibold">${formatCurrency(resultado.valorParcela)}</span>
                        <span class="text-red-500 text-xs font-medium">Economia: ${formatCurrency(descontoParcela)}</span>
                    </div>` : formatCurrency(resultado.valorParcela)
                }
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <button type="button" class="text-primary hover:text-secondary focus:outline-none verMaisBtn h-8 w-8 inline-flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20" data-parcela="${resultado.numParcela}" data-tipo="${tipo}" title="Ver detalhes"><i class="fas fa-eye"></i></button>
            </td>
        `;

        const detailRow = document.createElement('tr');
        detailRow.className = 'bg-gray-50 dark:bg-gray-800 hidden detailRow';
        detailRow.setAttribute('data-parcela', resultado.numParcela);
        detailRow.setAttribute('data-tipo', tipo);
        detailRow.innerHTML = `
            <td colspan="3" class="px-4 py-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    ${useSpecialDiscount && tipo === 'carne' ? `
                        <div class="md:col-span-3 mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                            <p class="font-medium line-through text-gray-500">${formatCurrency(totalInflacionado)}</p>
                            <p class="font-medium">${formatCurrency(totalCompra)}</p>
                            <p class="text-red-500 font-medium">Economia total: ${formatCurrency(descontoTotal)}</p>
                        </div>` : ''
                    }
                    <div><p class="text-gray-500 dark:text-gray-400">Total da compra:</p><p class="font-medium">${formatCurrency(totalCompra)}</p></div>
                    <div><p class="text-gray-500 dark:text-gray-400">Total produto${valorEntrada > 0 ? ' + entrada' : ''}:</p><p class="font-medium">${formatCurrency(resultado.totalProduto + valorEntrada)}</p></div>
                    <div><p class="text-gray-500 dark:text-gray-400">Total GE:</p><p class="font-medium">${formatCurrency(resultado.totalGE)}</p></div>
                    <div><p class="text-gray-500 dark:text-gray-400">Total prestamista:</p><p class="font-medium">${formatCurrency(resultado.totalPrestamista)}</p></div>
                    <div><p class="text-gray-500 dark:text-gray-400">Total serviços:</p><p class="font-medium">${formatCurrency(resultado.totalServicos)}</p></div>
                    ${resultado.isMostruarioIndicator ? `
                        <div class="md:col-span-3 mt-2 border-t border-gray-300 dark:border-gray-600 pt-2"><p class="text-yellow-600 dark:text-yellow-400 font-medium">Peça de mostruário: Fator de 12x do cartão (${FATORES.cartao[11]}) aplicado no produto.</p></div>` : ''
                    }
                </div>
            </td>
        `;

        tableBody.appendChild(row);
        tableBody.appendChild(detailRow);
    });

    document.getElementById(`resultSection${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.remove('hidden');
}


// --- Funções para Salvar Simulação ---

async function getNextClientNumber() {
    try {
        const counterRef = firebase.doc(db, "contadores", "clientes");
        const counterDoc = await firebase.getDoc(counterRef);
        let currentCount = 1;
        if (counterDoc.exists()) {
            currentCount = counterDoc.data().contador + 1;
            await firebase.updateDoc(counterRef, { contador: currentCount });
        } else {
            await firebase.setDoc(counterRef, { contador: currentCount });
        }
        return currentCount;
    } catch (error) {
        console.error("Erro ao obter número do cliente:", error);
        return Math.floor(Date.now() / 1000); // Fallback
    }
}

async function saveSimulation(clientData) {
    try {
        const clientNumber = await getNextClientNumber();
        const fullData = {
            cliente: {
                nome: clientData.clientName.toUpperCase(),
                telefone: clientData.clientPhone,
                produto: clientData.productName.toUpperCase(),
                codigo: `CLIENTE ZENIR ${clientNumber}`
            },
            simulacao: simulationResults,
            dataHora: new Date().toISOString(),
            status: "Pendente",
            userId: currentUser.uid,
            userName: currentUser.userData.displayName,
            userBranch: currentUser.userData.branch || ''
        };
        const docRef = await firebase.addDoc(firebase.collection(db, "simulacoes"), fullData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar simulação:", error);
        return { success: false, error: error.message };
    }
}


// --- Configuração de Eventos ---

export function setupSimulatorEventListeners() {
    // Gerar opções de parcelas
    const parcelasSelect = document.getElementById('parcelasSelect');
    for (let i = 1; i <= 12; i++) {
        parcelasSelect.add(new Option(`${i}x`, i));
    }

    // Botões de selecionar/desmarcar parcelas
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        Array.from(parcelasSelect.options).forEach(opt => opt.selected = true);
    });
    document.getElementById('deselectAllBtn').addEventListener('click', () => {
        Array.from(parcelasSelect.options).forEach(opt => opt.selected = false);
    });

    // Resetar estado do checkbox 'mostruário' ao mudar tipo de preço
    document.querySelectorAll('input[name="priceType"]').forEach(radio => {
        radio.addEventListener('change', atualizarEstadoMostruario);
    });

    // Evento de submit do formulário
    document.getElementById('simulationForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const valorProdutoOriginal = currencyToNumber(document.getElementById('productValue').value);
        const parcelasSelecionadas = Array.from(parcelasSelect.selectedOptions).map(opt => parseInt(opt.value));
        
        if (valorProdutoOriginal <= 0) return alert('Digite um valor válido para o produto.');
        if (parcelasSelecionadas.length === 0) return alert('Selecione pelo menos uma opção de parcelamento.');

        const valorEntrada = currencyToNumber(document.getElementById('entryValue').value);
        simulationResults.inputs = {
            valorProdutoOriginal,
            valorGE: currencyToNumber(document.getElementById('geValue').value),
            valorEntrada,
            valorProduto: Math.max(0, valorProdutoOriginal - valorEntrada),
            isMostruario: document.getElementById('isMostruario').checked,
            useSpecialDiscount: document.getElementById('useSpecialDiscount').checked,
            tipoParcelamento: document.querySelector('input[name="paymentType"]:checked').value,
            tipoPreco: document.querySelector('input[name="priceType"]:checked').value,
            usarFator: document.querySelector('input[name="useFactor"]:checked').value === 'sim',
            taxaPrestamista: document.querySelector('input[name="applyTaxaPrestamista"]:checked').value === 'sim',
            parcelasSelecionadas
        };

        simulationResults.results = { carne: [], cartao: [] };

        for (const numParcela of parcelasSelecionadas) {
            ['carne', 'cartao'].forEach(tipo => {
                const resultado = calcularParcela(
                    simulationResults.inputs.valorProduto,
                    simulationResults.inputs.valorGE,
                    numParcela, tipo,
                    simulationResults.inputs.tipoPreco,
                    simulationResults.inputs.usarFator,
                    simulationResults.inputs.taxaPrestamista,
                    simulationResults.inputs.isMostruario
                );
                simulationResults.results[tipo].push({ numParcela, ...resultado });
            });
        }
        renderResults();
    });

    // Botões de ação pós-cálculo
    document.getElementById('clearSimulationBtn').addEventListener('click', () => {
        document.getElementById('simulationForm').reset();
        document.getElementById('productValue').value = '';
        document.getElementById('geValue').value = '';
        document.getElementById('entryValue').value = '';
        document.getElementById('resultSectionCarne').classList.add('hidden');
        document.getElementById('resultSectionCartao').classList.add('hidden');
        document.getElementById('saveButtonContainer').classList.add('hidden');
        document.getElementById('deselectAllBtn').click();
        atualizarEstadoMostruario();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Modal de salvamento
    const confirmModal = document.getElementById('confirmModal');
    const saveModal = document.getElementById('saveModal');
    
    document.getElementById('saveSimulationBtn').addEventListener('click', () => confirmModal.classList.remove('hidden'));
    document.getElementById('noSaveBtn').addEventListener('click', () => confirmModal.classList.add('hidden'));
    document.getElementById('yesSaveBtn').addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        saveModal.classList.remove('hidden');
    });
    document.getElementById('cancelSaveBtn').addEventListener('click', () => saveModal.classList.add('hidden'));

    document.getElementById('saveSimulationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const clientName = document.getElementById('clientName').value.trim();
        const clientPhone = document.getElementById('clientPhone').value.trim();
        const productName = document.getElementById('productName').value.trim();

        if (!clientName || !clientPhone || !productName) {
            return showToast('Preencha todos os campos do cliente.', 'error');
        }

        const result = await saveSimulation({ clientName, clientPhone, productName });
        if (result.success) {
            showToast('Simulação salva com sucesso!', 'success');
            saveModal.classList.add('hidden');
            document.getElementById('clearSimulationBtn').click();
        } else {
            showToast(`Erro ao salvar: ${result.error}`, 'error');
        }
    });
                                                  }
