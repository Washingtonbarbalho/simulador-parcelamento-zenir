// Variável global para controle da seção atual
let currentSection = 'simulator';

// Função para configurar eventos da interface
function setupUIEvents() {
    // Configurar abas de autenticação
    setupAuthTabs();
    
    // Configurar eventos de formulários
    setupAuthFormEvents();
    
    // Configurar eventos de visualização de senha
    setupPasswordToggle();
    
    // Configurar formatação de telefone
    setupPhoneFormatting();
    
    // Configurar os campos de entrada monetária
    setupCurrencyInputs();
    
    // Gerar opções para o select múltiplo de parcelas
    setupParcelas();
    
    // Configurar menu lateral
    setupSidebar();
    
    // Configurar navegação entre seções
    setupNavigation();

    // Configurar eventos de administração
    setupAdminEvents();
    
    // Configurar botões para fechar os modais de detalhes
    setupModalCloseButtons();
    
    // Configurar eventos do simulador
    setupSimulatorEvents();
}

// Função para configurar eventos de formulários de autenticação
function setupAuthFormEvents() {
    // Configurar formulário de login
    document.getElementById('loginBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validação básica
        if (!email || !password) {
            document.getElementById('loginError').textContent = 'Preencha todos os campos.';
            document.getElementById('loginError').classList.remove('hidden');
            return;
        }
        
        // Tenta fazer login
        const result = await login(email, password);
        
        if (!result.success) {
            document.getElementById('loginError').textContent = result.error;
            document.getElementById('loginError').classList.remove('hidden');
        }
    });
    
    // Configurar formulário de cadastro
    document.getElementById('registerBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const branch = document.getElementById('registerBranch').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        
        // Validação
        if (!name || !email || !phone || !branch || !password || !passwordConfirm) {
            document.getElementById('registerError').textContent = 'Preencha todos os campos.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        if (password !== passwordConfirm) {
            document.getElementById('registerError').textContent = 'As senhas não coincidem.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('registerError').textContent = 'A senha deve ter pelo menos 6 caracteres.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        // Validar formato do telefone
        if (!phone.match(/^\(\d{2}\)\s*\d{5}-\d{4}$/)) {
            document.getElementById('registerError').textContent = 'Formato de telefone inválido.';
            document.getElementById('registerError').classList.remove('hidden');
            return;
        }
        
        // Tenta cadastrar
        const result = await register(name, email, phone, branch, password);
        
        if (result.success) {
            // Mostrar mensagem de sucesso
            document.getElementById('registerSuccess').classList.remove('hidden');
            
            // Esconder o formulário
            document.getElementById('registerForm').classList.add('hidden');
            
            // Redirecionar para login após 3 segundos
            setTimeout(() => {
                showPendingApproval();
            }, 3000);
        } else {
            document.getElementById('registerError').textContent = result.error;
            document.getElementById('registerError').classList.remove('hidden');
        }
    });

    // Configurar logout pendente
    document.getElementById('logoutBtnPending').addEventListener('click', logout);
    
    // Configurar logout do app
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Função para configurar eventos de visualização de senha
function setupPasswordToggle() {
    // Login password toggle
    document.getElementById('toggleLoginPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('loginPassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    // Register password toggle
    document.getElementById('toggleRegisterPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('registerPassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    // Register password confirm toggle
    document.getElementById('toggleRegisterPasswordConfirm').addEventListener('click', function() {
        const passwordInput = document.getElementById('registerPasswordConfirm');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

// Função para configurar formatação de telefone
function setupPhoneFormatting() {
    // Função para formatar telefone
    function formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length <= 2) {
            input.value = value.length > 0 ? `(${value}` : '';
        } else if (value.length <= 7) {
            input.value = `(${value.substring(0, 2)})${value.substring(2)}`;
        } else {
            input.value = `(${value.substring(0, 2)})${value.substring(2, 7)}-${value.substring(7, 11)}`;
        }
    }
    
    // Função para converter texto para maiúsculas em tempo real
    function toUpperCaseInput(input) {
        input.value = input.value.toUpperCase();
    }
    
    // Aplicar formatação no cadastro
    document.getElementById('registerPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    // Aplicar formatação no editar usuário
    document.getElementById('editUserPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    // Aplicar formatação no telefone do cliente
    document.getElementById('clientPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    // Adicionar função toUpperCase para campos de texto - Cadastro
    document.getElementById('registerName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    document.getElementById('registerBranch').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    // Adicionar função toUpperCase para campos de texto - Edição de usuário
    document.getElementById('editUserName').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
    
    document.getElementById('editUserBranch').addEventListener('input', function() {
        toUpperCaseInput(this);
    });
}

// Função para configurar o menu lateral
function setupSidebar() {
    // Manipuladores para o menu lateral
    document.getElementById('openSidebar').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('open');
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
        }, 10);
    });
    
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.remove('open');
        overlay.classList.add('opacity-0');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
    }
    
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);
    
    window.closeSidebar = closeSidebar;
}

// Função para configurar navegação entre seções
function setupNavigation() {
    // Trocar entre seções
    document.getElementById('showSimulator').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentSection !== 'simulator') {
            showSection('simulator');
            closeSidebar();
        }
    });
    
    document.getElementById('showHistory').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentSection !== 'history') {
            showSection('history');
            loadSimulationHistory();
            closeSidebar();
        }
    });
    
    document.getElementById('showUsers').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentSection !== 'users') {
            showSection('users');
            loadUsers();
            closeSidebar();
        }
    });
}

// Função para mostrar uma seção específica
function showSection(sectionName) {
    currentSection = sectionName;
    
    // Esconder todas as seções
    document.getElementById('simulatorSection').classList.add('hidden');
    document.getElementById('historySection').classList.add('hidden');
    document.getElementById('usersSection').classList.add('hidden');
    
    // Mostrar a seção selecionada
    if (sectionName === 'simulator') {
        document.getElementById('simulatorSection').classList.remove('hidden');
    } else if (sectionName === 'history') {
        document.getElementById('historySection').classList.remove('hidden');
    } else if (sectionName === 'users') {
        document.getElementById('usersSection').classList.remove('hidden');
    }
}

// Função para configurar eventos de administração
function setupAdminEvents() {
    // Configurar guias do painel de gerenciamento de usuários
    document.getElementById('approvedUsersTabBtn').addEventListener('click', () => switchUserTab('approved'));
    document.getElementById('pendingUsersTabBtn').addEventListener('click', () => switchUserTab('pending'));
    
    // Atualizar lista de usuários
    document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);
    
    // Configurar modal de edição de usuário
    document.getElementById('closeEditUserModal').addEventListener('click', closeEditUserModal);
    document.getElementById('cancelEditUserBtn').addEventListener('click', closeEditUserModal);
    
    // Configurar formulário de edição de usuário
    document.getElementById('editUserForm').addEventListener('submit', saveUserChanges);
}

// Função para configurar botões para fechar os modais de detalhes
function setupModalCloseButtons() {
    // Modal de detalhes da simulação
    document.getElementById('closeDetailsModal').addEventListener('click', () => {
        closeSimulationDetailsModal();
    });
    
    document.getElementById('closeDetailsBtn').addEventListener('click', () => {
        closeSimulationDetailsModal();
    });
    
    // Configurar o botão de salvar status
    document.getElementById('saveStatusBtn').addEventListener('click', async () => {
        const simulationId = document.getElementById('simulationDetailsModal').getAttribute('data-simulation-id');
        const newStatus = document.getElementById('simulationStatus').value;
        
        if (simulationId) {
            try {
                // Mostrar loading no botão
                const saveBtn = document.getElementById('saveStatusBtn');
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
                saveBtn.disabled = true;
                
                // Atualizar status no Firestore
                const simulationRef = window.firebase.doc(window.db, "simulacoes", simulationId);
                await window.firebase.updateDoc(simulationRef, {
                    status: newStatus
                });
                
                // Mostrar notificação toast
                window.showToast('Status atualizado com sucesso!', 'success');
                
                // Recarregar o histórico
                loadSimulationHistory();
                
                // Fechar o modal de detalhes após salvamento bem-sucedido
                closeSimulationDetailsModal();
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
                window.showToast('Erro ao atualizar status. Tente novamente.', 'error');
                
                // Restaurar estado original do botão
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        }
    });
}

// Função para configurar parcelas
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

// Função para configurar eventos do simulador
function setupSimulatorEvents() {
    // Adicionar manipulador para o botão Limpar Simulação
    document.getElementById('clearSimulationBtn').addEventListener('click', reiniciarSimulacao);
    
    // Adicionar manipuladores para os botões do histórico
    document.getElementById('refreshHistoryBtn').addEventListener('click', loadSimulationHistory);
    document.getElementById('deleteAllSimulationsBtn').addEventListener('click', confirmDeleteAllSimulations);
    
    // Adicionar manipuladores para os radio buttons de tipo de preço
    document.querySelectorAll('input[name="priceType"]').forEach(radio => {
        radio.addEventListener('change', atualizarEstadoMostruario);
    });
    
    // Inicializar o estado da caixa de mostruário
    atualizarEstadoMostruario();
    
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
    
    // Formulário de simulação
    document.getElementById('simulationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obter valores do formulário
        const valorProdutoOriginal = window.currencyToNumber(document.getElementById('productValue').value);
        const valorGE = window.currencyToNumber(document.getElementById('geValue').value);
        const valorEntrada = window.currencyToNumber(document.getElementById('entryValue').value);
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
        window.simulationResults.inputs = {
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
        };
        
        // Inicializar objeto de resultados
        window.simulationResults.results = {
            carne: {},
            cartao: {}
        };
        
        // Ocultar todas as seções de resultados
        document.getElementById('resultSectionCarne').classList.add('hidden');
        document.getElementById('resultSectionCartao').classList.add('hidden');
        
        // Limpar tabelas de resultados
        document.getElementById('resultTableBodyCarne').innerHTML = '';
        document.getElementById('resultTableBodyCartao').innerHTML = '';
        
        // Função para processar um tipo de parcelamento
        const processarTipoParcelamento = (tipo) => {
            // Selecionar a tabela correta
            const tableBody = document.getElementById(`resultTableBody${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
            
            // Inicializar array de resultados para este tipo
            window.simulationResults.results[tipo] = [];
            
            for (const numParcela of parcelasSelecionadas) {
                const resultado = window.calcularParcela(
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
                    valorParcelaInflacionada = window.calcularDescontoEspecial(valorProduto, valorGE, numParcela, taxaPrestamista);
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
                                <span class="line-through text-gray-400">${window.formatCurrency(valorParcelaInflacionada)}</span>
                                <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">Na promoção:</span>
                                <span class="font-semibold">${window.formatCurrency(resultado.valorParcela)}</span>
                                <span class="text-red-500 text-xs font-medium">Economia: ${window.formatCurrency(descontoParcela)}</span>
                            </div>` 
                            : window.formatCurrency(resultado.valorParcela)
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
                                <p class="font-medium line-through text-gray-500">${window.formatCurrency(totalInflacionado)}</p>
                                <p class="text-gray-500 dark:text-gray-400 mt-1">Na promoção:</p>
                                <p class="font-medium">${window.formatCurrency(totalCompra)}</p>
                                <p class="text-red-500 font-medium">Economia total: ${window.formatCurrency(descontoTotal)}</p>
                            </div>`;
                }
                
                detailHTML += `
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total da compra:</p>
                                <p class="font-medium">${window.formatCurrency(totalCompra)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total do produto${valorEntrada > 0 ? ' + entrada' : ''}:</p>
                                <p class="font-medium">${window.formatCurrency(resultado.totalProduto + valorEntrada)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total GE:</p>
                                <p class="font-medium">${window.formatCurrency(resultado.totalGE)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total prestamista:</p>
                                <p class="font-medium">${window.formatCurrency(resultado.totalPrestamista)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total de serviços:</p>
                                <p class="font-medium">${window.formatCurrency(resultado.totalServicos)}</p>
                            </div>`;
                
                // Adicionar explicação do mostruário se aplicável
                if (resultado.isMostruarioIndicator) {
                    detailHTML += `
                            <div class="md:col-span-3 mt-2 border-t border-gray-300 dark:border-gray-600 pt-2">
                                <p class="text-yellow-600 dark:text-yellow-400 font-medium">
                                    Peça de mostruário: O produto está usando o fator de 12x do cartão (${window.FATORES.cartao[11]}) em vez do fator de carnê (${window.FATORES.carne[11]})
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
        };
        
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
        if (currentUser && 
            (currentUser.email === window.ADMIN_EMAIL || 
            (currentUser.userData && currentUser.userData.accessLevel === 'full'))) {
            document.querySelector('#saveSimulationBtn').classList.remove('hidden');
        } else {
            document.querySelector('#saveSimulationBtn').classList.add('hidden');
        }
        
        // Rolar até os resultados
        const primeiraSecao = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow-md.p-6:not(.hidden)');
        if (primeiraSecao) {
            primeiraSecao.scrollIntoView({ behavior: 'smooth' });
        }
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
        const resultado = await salvarSimulacao({
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

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar estado da autenticação na inicialização
    window.firebase.onAuthStateChanged(window.auth, window.handleAuthStateChanged);
    
    // Configurar eventos da interface
    setupUIEvents();
    
    // Exportar funções e variáveis para uso global
    window.currentSection = currentSection;
    window.showSection = showSection;
    window.setupUIEvents = setupUIEvents;
});
