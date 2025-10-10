// Módulo de Utilitários (utils.js)
// Contém funções de ajuda genéricas usadas em várias partes do aplicativo.

/**
 * Formata um número para uma string de moeda BRL (R$).
 * @param {number} value O valor a ser formatado.
 * @returns {string} A string formatada.
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Converte uma string de moeda formatada para um número.
 * @param {string} value A string de moeda.
 * @returns {number} O valor numérico.
 */
export function currencyToNumber(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
}

/**
 * Exibe uma notificação toast na tela.
 * @param {string} message A mensagem a ser exibida.
 * @param {'success' | 'error'} type O tipo de notificação.
 */
export function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
        <div class="toast-content"><div class="toast-message">${message}</div></div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Formata um campo de input para o padrão de telefone (XX) XXXXX-XXXX.
 * @param {HTMLInputElement} input O elemento de input.
 */
export function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    let formattedValue = '';
    if (value.length > 0) {
        formattedValue = `(${value.substring(0, 2)}`;
    }
    if (value.length > 2) {
        formattedValue += `) ${value.substring(2, 7)}`;
    }
    if (value.length > 7) {
        formattedValue += `-${value.substring(7)}`;
    }
    input.value = formattedValue.trim();
}


/**
 * Converte o valor de um input para maiúsculas.
 * @param {HTMLInputElement} input O elemento de input.
 */
export function toUpperCaseInput(input) {
    input.value = input.value.toUpperCase();
}
