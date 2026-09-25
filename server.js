const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Configurações do Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve a pasta public (onde fica o index.html)

// Conexão com o Banco de Dados Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Função para formatar o telefone
function formatarTelefone(telefone) {
    const limpo = ('' + telefone).replace(/\D/g, ''); // Remove tudo que não for número
    if (limpo.length === 11) {
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7, 11)}`;
    }
    return telefone;
}

// Função para formatar CPF ou RG e identificar qual é
function formatarDocumento(doc) {
    const limpo = ('' + doc).replace(/\D/g, '');
    if (limpo.length === 9) {
        return { 
            tipo: 'RG', 
            valor: `${limpo.substring(0,2)}.${limpo.substring(2,5)}.${limpo.substring(5,8)}-${limpo.substring(8,9)}` 
        };
    } else if (limpo.length === 11) {
        return { 
            tipo: 'CPF', 
            valor: `${limpo.substring(0,3)}.${limpo.substring(3,6)}.${limpo.substring(6,9)}-${limpo.substring(9,11)}` 
        };
    }
    return null;
}

// Rota para receber os dados do formulário
app.post('/cadastrar', async (req, res) => {
    const { nome, telefone, documento, vinculo, observacao } = req.body;

    // Formatações
    const telFormatado = formatarTelefone(telefone);
    const docData = formatarDocumento(documento);

    if (!docData) {
        return res.status(400).send('<h2>Erro:</h2> O documento deve conter exatamente 9 (RG) ou 11 (CPF) números. <br><a href="/">Voltar</a>');
    }

    try {
        const query = `
            INSERT INTO cadastros (nome, telefone, documento, tipo_documento, vinculo, observacao)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [nome, telFormatado, docData.valor, docData.tipo, vinculo, observacao]);
        res.send('<h2>Cadastro realizado com sucesso!</h2> <a href="/">Fazer novo cadastro</a>');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar no banco de dados Neon.');
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
