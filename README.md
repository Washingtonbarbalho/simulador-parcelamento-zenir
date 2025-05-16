# Simulador de Parcelamento - Zenir Móveis

Sistema para simulação de parcelamento desenvolvido para a Zenir Móveis, permitindo o cálculo de valores de parcelas em diferentes condições, tanto para carnê quanto cartão.

## Recursos

- **Simulação de Parcelamento**: Cálculo preciso de parcelas para diferentes condições
- **Histórico de Simulações**: Armazenamento e consulta de simulações realizadas
- **Gestão de Usuários**: Controle de acesso e permissões
- **Múltiplos Modos de Pagamento**: Suporte para simulações de carnê e cartão
- **Responsivo**: Interface adaptada para dispositivos móveis e desktop

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript
- TailwindCSS para estilização
- Firebase (Authentication e Firestore) para autenticação e armazenamento
- Responsividade com design mobile-first

## Requisitos

Para executar o projeto localmente:

1. Clone o repositório
2. Configure as credenciais do Firebase no arquivo `js/config.js`
3. Abra o arquivo `index.html` em um navegador ou use um servidor local

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/simulador-parcelamento-zenir.git

# Entre na pasta do projeto
cd simulador-parcelamento-zenir

# Configure seu arquivo de configuração do Firebase
# Copie o modelo e adicione suas credenciais
cp js/config.example.js js/config.js

# Abra o index.html no navegador ou use um servidor local
# Se você tem o Node.js instalado, pode usar http-server:
npx http-server
