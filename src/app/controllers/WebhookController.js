class WebhookController {
    async handle(req, res) {
        const { query } = req;

        // O Mercado Pago envia um ID de pagamento via query (ex: ?id=12345)
        if (query.type === 'payment') {
            const paymentId = query['data.id'];
            console.log(`✅ Notificação de pagamento recebida! ID: ${paymentId}`);
            
            // Aqui futuramente você buscaria o status do pagamento 
            // no Mercado Pago e atualizaria o pedido no MongoDB.
        }

        // É OBRIGATÓRIO responder 200 para o Mercado Pago não ficar reenviando
        return res.status(200).send('OK');
    }
}

export default new WebhookController();