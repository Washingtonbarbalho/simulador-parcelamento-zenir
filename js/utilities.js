// utilities.js - Funções utilitárias reutilizáveis

// Função para formatar valores monetários
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Função para converter string monetária para número
export function currencyToNumber(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
}

// Função para formatar campos de entrada monetária
export function formatCurrencyInput(input) {
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

// Função para formatar telefone
export function formatPhoneNumber(input) {
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
export function toUpperCaseInput(input) {
    input.value = input.value.toUpperCase();
}

// Função para gerar e baixar vCard (contato)
export function downloadVCard(name, phone, code) {
    // Formatação básica de vCard
    const phoneClean = phone.replace(/\D/g, '');
    
    // Formatar o nome como "Nome do cliente + (código do cliente)"
    const formattedName = `${name} (${code || 'cliente'})`;
    
    const vCardData = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${formattedName}`,
        `TEL;TYPE=CELL:+55${phoneClean}`,
        'END:VCARD'
    ].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    
    // Criar elemento de link temporário e disparar o download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_zenir.vcf`;
    document.body.appendChild(a);
    a.click();
    
    // Limpar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Função para mostrar notificações toast
export function showToast(message, type = 'success') {
    // Remover qualquer toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Determinar ícone com base no tipo
    let icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    // Criar conteúdo do toast
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Adicionar o toast ao body
    document.body.appendChild(toast);
    
    // Mostrar o toast com um pequeno atraso para permitir a animação
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remover automaticamente após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Remover da DOM após a animação de saída
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Exportar funções para uso global
window.utils = {
    formatCurrency,
    currencyToNumber,
    formatCurrencyInput,
    formatPhoneNumber,
    toUpperCaseInput,
    downloadVCard,
    showToast
};
