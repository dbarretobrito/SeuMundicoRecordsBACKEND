require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3001;
const myCache = new NodeCache({ stdTTL: 600 }); // TTL de 600 segundos (10 minutos)

app.use(cors());
app.use(express.json());

// // Middleware para adicionar o cabeçalho Content-Language
// app.use((req, res, next) => {
//     res.header('Content-Language', 'pt-BR');
//     res.header('Content-Type', 'text/html; charset=utf-8'); // Adicionando o cabeçalho Content-Type
//     next();
// });

app.post('/calculate-shipping', async (req, res) => {
    const { from, to, package: pkg } = req.body;

    if (!from || !to || !pkg) {
        return res.status(400).json({ error: 'Dados de requisição ausentes' });
    }

    // Gera uma chave única para o cache com base nos dados da requisição
    const cacheKey = `${from}-${to}-${JSON.stringify(pkg)}`;
    
    // Verifica se o resultado já está no cache
    const cachedResult = myCache.get(cacheKey);
    if (cachedResult) {
        console.log('Retornando resultado do cache');
        return res.json({ pacPrice: cachedResult });
    }
    
    console.log('Chamando a API do Melhor Envio'); // Log quando a API for chamada

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

        if (Array.isArray(response.data)) {
            const pacPriceObject = response.data.find(service => service.name === 'PAC');
            if (pacPriceObject) {
                myCache.set(cacheKey, pacPriceObject.price); // Armazena no cache
                return res.json({ pacPrice: pacPriceObject.price });
            } else {
                return res.status(404).json({ error: 'Serviço PAC não encontrado' });
            }
        } else {
            return res.status(500).json({ error: 'Formato de resposta inválido' });
        }
    } catch (error) {
        console.error('Erro no backend:', error.message || error);
        return res.status(500).json({ error: 'Erro ao calcular o frete' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
