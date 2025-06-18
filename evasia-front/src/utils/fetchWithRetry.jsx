/**
 * Função para criar um delay programável
 * @param {number} ms - Tempo em milissegundos para aguardar
 * @returns {Promise} Promise que resolve após o tempo especificado
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Função para fazer requisições com retry automático
 * @param {string} url - URL da requisição
 * @param {object} options - Opções do fetch
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} baseDelay - Delay base entre tentativas
 * @returns {Promise} Promise com o resultado da requisição
 */
export const fetchWithRetry = async (url, options, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (response.status === 429) {
                const waitTime = baseDelay * Math.pow(2, i);
                console.log(`Rate limit atingido, aguardando ${waitTime}ms...`);
                await delay(waitTime);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const waitTime = baseDelay * Math.pow(2, i);
            console.log(`Tentativa ${i + 1} falhou, aguardando ${waitTime}ms...`);
            await delay(waitTime);
        }
    }
};