const express = require('express');
const cors = require('cors');
const { calcularPrecoPrazo } = require('correios-brasil');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/calculate-shipping-correios', async (req, res) => {
    const { to, package: pkg } = req.body;

    if (!to || !pkg) {
        return res.status(400).json({ error: 'Dados de requisição ausentes' });
    }

    const args = {
        sCepOrigem: '90035121',  // CEP de origem
        sCepDestino: to.postal_code,  // CEP de destino
        nVlPeso: pkg.weight.toString(),  // Peso do pacote
        nCdFormato: '1',  // Formato da encomenda (caixa/pacote)
        nVlComprimento: pkg.length.toString(),
        nVlAltura: pkg.height.toString(),
        nVlLargura: pkg.width.toString(),
        nCdServico: ['04510'],  // Código do serviço PAC
        nVlDiametro: '0',
        nVlValorDeclarado: '0',  // Sem valor declarado
        sCdMaoPropria: 'N',
        sCdAvisoRecebimento: 'N',
    };

    try {
        const result = await calcularPrecoPrazo(args);
        console.log('Resultado da API dos Correios:', result);
        
        if (result && result[0] && result[0].Valor) {
            res.json({ pacPrice: result[0].Valor });
        } else {
            res.status(500).json({ error: 'Erro ao calcular o frete' });
        }
    } catch (error) {
        console.error('Erro ao calcular o frete:', error.message || error);
        res.status(500).json({ error: 'Erro ao calcular o frete pelos Correios' });
    }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
