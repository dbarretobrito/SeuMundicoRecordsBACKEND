require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint para calcular o frete
app.post('/calculate-shipping', async (req, res) => {
    const { from, to, package: pkg } = req.body;

    // Verificação básica de dados
    if (!from || !to || !pkg) {
        return res.status(400).json({ error: 'Dados de requisição ausentes' });
    }

    try {
        const response = await axios.post(
            'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
            {
                from,
                to,
                package: pkg,
                options: {
                    services: '1' // PAC
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.MELHOR_ENVIO_API_KEY}`,
                    'User-Agent': 'Aplicação dbarretobrito@gmail.com'
                }
            }
        );

        console.log('Resposta da API:', response.data); // Adicionado para debug

        // Verificar se a resposta contém a propriedade esperada
        if (Array.isArray(response.data)) {
            // Encontrar o preço do PAC
            const pacPriceObject = response.data.find(service => service.name === 'PAC');

            if (pacPriceObject) {
                res.json({ pacPrice: pacPriceObject.price });
            } else {
                res.status(404).json({ error: 'Serviço PAC não encontrado' });
            }
        } else {
            res.status(500).json({ error: 'Formato de resposta inválido' });
        }
    } catch (error) {
        console.error('Erro no backend:', error.message || error); // Adicionado para debug
        res.status(500).json({ error: 'Erro ao calcular o frete' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
