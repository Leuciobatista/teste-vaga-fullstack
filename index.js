const fs = require('fs');
const csv = require('csv-parser');
const { cpf, cnpj } = require('cpf-cnpj-validator');

// Função para validar CPF ou CNPJ
function validarCpfCnpj(cpfCnpj) {
  cpfCnpj = cpfCnpj.replace(/[^\d]/g, ''); // Remover caracteres não numericos
  return cpf.isValid(cpfCnpj) || cnpj.isValid(cpfCnpj);
}

// Função para formatar valores monetários para real
function formatarParaBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para validar consistência dos valores das prestações
function validarValorTotal(dados) {
  const valorTotal = parseFloat(dados.vlTotal);
  const numeroPrestacoes = parseInt(dados.qtPrestacoes, 10);
  const valorPrestacao = parseFloat(dados.vlPresta);

  // Verifica se o valor total é aproximadamente igual à soma das prestações
  return Math.round(valorTotal) === Math.round(valorPrestacao * numeroPrestacoes);
}

// Função para verificar inconsistência de pagamentos
function verificarInconsistenciaPagamento(dados) {
  const movimento = parseFloat(dados.vlMovimento || 0);
  const pagamento = parseFloat(dados.vlPag || 0);
  return movimento > pagamento ? 'Pagamento inconsistente' : 'Pagamento consistente';
}

function processarCSV(caminhoArquivo) {
  const resultados = [];

  fs.createReadStream(caminhoArquivo)
    .pipe(csv())
    .on('data', (dados) => {
      try {
        // Valida CPF ou CNPJ
        if (validarCpfCnpj(dados.nrCpfCnpj)) {
          // Convertendo e validando valores numéricos
          dados.vlTotal = parseFloat(dados.vlTotal);
          dados.vlPresta = parseFloat(dados.vlPresta);
          dados.vlMora = parseFloat(dados.vlMora);
          dados.vlMulta = parseFloat(dados.vlMulta);
          dados.vlOutAcr = parseFloat(dados.vlOutAcr);
          dados.vlIof = parseFloat(dados.vlIof);
          dados.vlDescon = parseFloat(dados.vlDescon);
          dados.vlAtual = parseFloat(dados.vlAtual);
          dados.vlMovimento = parseFloat(dados.vlMovimento || 0);
          dados.vlPag = parseFloat(dados.vlPag || 0);

          // Formatar valores monetários para real
          dados.vlTotalBRL = formatarParaBRL(dados.vlTotal);
          dados.vlPrestaBRL = formatarParaBRL(dados.vlPresta);
          dados.vlMoraBRL = formatarParaBRL(dados.vlMora);
          dados.vlMultaBRL = formatarParaBRL(dados.vlMulta);
          dados.vlOutAcrBRL = formatarParaBRL(dados.vlOutAcr);
          dados.vlIofBRL = formatarParaBRL(dados.vlIof);
          dados.vlDesconBRL = formatarParaBRL(dados.vlDescon);
          dados.vlAtualBRL = formatarParaBRL(dados.vlAtual);

          // Validar consistência dos valores
          dados.valorTotalValido = validarValorTotal(dados);
          dados.consistenciaPagamento = verificarInconsistenciaPagamento(dados);

          resultados.push(dados);
        }
      } catch (erro) {
        console.error(`Erro ao processar dados: ${erro.message}`);
      }
    })
    .on('end', () => {
      console.log('Arquivo CSV processado com sucesso');
      console.log('Contratos Validos:');
      console.log(JSON.stringify(resultados, null, 2));
    })
    .on('error', (erro) => {
      console.error(`Erro ao ler arquivo CSV: ${erro.message}`);
    });
}

// Caminho para o arquivo CSV
const caminhoArquivo = 'data.csv'; 
processarCSV(caminhoArquivo);
