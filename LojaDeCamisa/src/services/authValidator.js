// Arquivo: src/services/authValidator.js

export const authValidator = {
  // 1. Valida se o CPF é real (algoritmo matemático)
  validarCPF(cpf) {
    // Remove tudo que não for número
    cpf = cpf.replace(/[^\d]+/g, '');

    // Verifica tamanho ou se são todos números iguais (ex: 111.111.111-11 é inválido)
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    // Validação do 1º Dígito Verificador
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    // Validação do 2º Dígito Verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  },

  // 2. Valida Email simples
  validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // 3. Valida Telefone (aceita 10 ou 11 dígitos)
  validarTelefone(phone) {
    const limpo = phone.replace(/[^\d]+/g, '');
    return limpo.length >= 10 && limpo.length <= 11;
  },

  // 4. Função Mestre: Checa tudo e retorna erro se houver
  verificarFormulario(dados) {
    // Nome
    if (!dados.name || dados.name.split(' ').length < 2) {
      return "Por favor, digite seu nome e sobrenome.";
    }

    // CPF
    if (!this.validarCPF(dados.cpf)) {
      return "CPF inválido. Verifique os números.";
    }

    // Telefone
    if (!this.validarTelefone(dados.phone)) {
      return "Telefone inválido (deve ter DDD + número).";
    }

    // Email
    if (!this.validarEmail(dados.email)) {
      return "Email inválido.";
    }

    // Senha
    if (dados.password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    return null; // Null significa que não há erros
  }
};