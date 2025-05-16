// Funções utilitárias

// Fatores de parcelamento
const FATORES = {
    cartao: [1.0292, 0.5220, 0.3530, 0.2685, 0.2179, 0.1841, 0.1600, 0.1420, 0.1280, 0.1168, 0.1076, 0.1000],
    carne: [1.0690, 0.5523, 0.3804, 0.2946, 0.2432, 0.2091, 0.1849, 0.1668, 0.1528, 0.1417, 0.1327, 0.1252]
};

// Função para formatar valores monetários
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Função para converter string monetária para número
function currencyToNumber(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
}

// Função para mostrar notificações toast
function showToast(message, type = 'success') {
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

// Gerar e baixar um vCard para contato
function downloadVCard(name, phone, code) {
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

export { 
    FATORES, 
    formatCurrency, 
    currencyToNumber, 
    showToast, 
    downloadVCard 
};
