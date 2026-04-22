import * as Yup from 'yup';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Order from '../schemas/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';

// 🛡️ Configuração do Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

class OrderController {
    /**
     * 1️⃣ CRIAR PEDIDO E PREFERÊNCIA
     * Objetivo: Salvar no Mongo (status pendente) e gerar link do Mercado Pago.
     */
    async store(req, res) {
        const schema = Yup.object({
            products: Yup.array()
                .required()
                .of(
                    Yup.object({
                        id: Yup.number().required(),
                        quantity: Yup.number().required(),
                    }),
                ),
            coupon_code: Yup.string().nullable(),
        });

        try {
            schema.validateSync(req.body, { abortEarly: false });
        } catch (err) {
            return res.status(400).json({ error: err.errors });
        }

        try {
            const productsIds = req.body.products.map((product) => product.id);

            // 🔍 Buscamos os produtos no PostgreSQL para evitar fraude de preço no Front
            const findProducts = await Product.findAll({
                where: { id: productsIds },
                include: [{ model: Category, as: 'category', attributes: ['name'] }],
            });

            // 🎟️ Lógica de Cupom
            let discount_percentage = 0;
            const { coupon_code } = req.body;

            if (coupon_code) {
                const coupon = await Coupon.findOne({ where: { code: coupon_code.toUpperCase() } });
                if (coupon && coupon.is_active) {
                    discount_percentage = coupon.discount_percentage;
                }
            }

            // 📦 Formatação para o MongoDB e para o Mercado Pago
            const formattedProducts = findProducts.map((product) => {
                const productIndex = req.body.products.findIndex((item) => item.id === product.id);
                const quantity = req.body.products[productIndex].quantity;
                
                const finalPrice = discount_percentage > 0 
                    ? product.price * (1 - discount_percentage / 100) 
                    : product.price;

                return {
                    id: product.id,
                    name: product.name,
                    price: Number(finalPrice.toFixed(2)),
                    category: product.category.name,
                    quantity: Number(quantity),
                    url: product.url // Garantimos que a URL da imagem vá para o Mongo
                };
            });

            /**
             * 💾 PASSO 1: Salvar o Pedido no MongoDB
             * Criamos o registro antes do pagamento para você saber que existe uma intenção de compra.
             */
            const newOrder = await Order.create({
                user: {
                    id: req.userId, // Vem do seu Middleware de Auth
                    name: req.userName,
                },
                products: formattedProducts,
                status: 'AGUARDANDO PAGAMENTO',
                coupon_code: coupon_code || null,
                discount_percentage: discount_percentage,
            });

            // 📦 PASSO 2: Formatar itens para o Mercado Pago
            const mpItems = formattedProducts.map(p => ({
                id: String(p.id),
                title: p.name,
                unit_price: p.price,
                quantity: p.quantity,
                currency_id: 'BRL',
            }));

            // 💳 PASSO 3: Criar Preferência no Mercado Pago
            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: mpItems, 
                    external_reference: String(newOrder._id), // 🔗 Vínculo crucial: ID do Mongo no MP
                    back_urls: {
                        success: `http://localhost:5173/confirmacao?order_id=${newOrder._id}`,
                        failure: 'http://localhost:5173/carrinho',
                        pending: `http://localhost:5173/confirmacao?order_id=${newOrder._id}`
                    },
                    auto_return: 'approved',
                }
            });

            // Retornamos a URL de pagamento e o ID do pedido criado
            return res.status(201).json({ 
                url: result.init_point,
                orderId: newOrder._id 
            });

        } catch (err) {
            console.error("❌ Erro no Fluxo de Pedido:", err);
            return res.status(500).json({ error: "Falha ao forjar o pedido." });
        }
    }

    // 📋 LISTAR TODOS OS PEDIDOS (PAINEL ADMIN)
    async index(req, res) {
        try {
            const orders = await Order.find().sort({ createdAt: -1 });
            return res.status(200).json(orders);
        } catch (err) {
            return res.status(500).json({ error: "Erro ao buscar pedidos." });
        }
    }

    // 🔍 BUSCAR UM PEDIDO ÚNICO
    async show(req, res) {
        try {
            const { id } = req.params;
            const order = await Order.findById(id);
            if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
            return res.status(200).json(order);
        } catch (err) {
            return res.status(400).json({ error: 'ID inválido' });
        }
    }

    // 🔄 ATUALIZAR STATUS (LOGÍSTICA)
    async update(req, res) {
        const schema = Yup.object({ status: Yup.string().required() });
        try {
            schema.validateSync(req.body);
        } catch (err) {
            return res.status(400).json({ error: err.errors });
        }
        
        const { status } = req.body;
        const { id } = req.params;

        try {
            await Order.updateOne({ _id: id }, { status });
            return response.status(200).json({ message: "Status atualizado!" });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    // 5️⃣ WEBHOOK: O Mercado Pago chama esta rota sozinho quando o status muda.
async handleWebhook(req, res) {
    const { query } = req;
    
    try {
        // O Mercado Pago envia o ID do pagamento via query string (ex: ?topic=payment&id=123)
        if (query.topic === 'payment' || query.type === 'payment') {
            const paymentId = query.id || query['data.id'];

            // 🔍 Buscamos os detalhes desse pagamento lá no Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const paymentData = await response.json();

            // Se o pagamento foi aprovado, localizamos o pedido pelo 'external_reference'
            if (paymentData.status === 'approved') {
                const orderId = paymentData.external_reference;

                // 🔄 Atualizamos o status no MongoDB para "PAGO / EM PREPARO"
                await Order.updateOne({ _id: orderId }, { status: 'PAGO - EM PREPARO' });
                
                console.log(`✅ Pedido ${orderId} aprovado e atualizado!`);
            }
        }

        // O Mercado Pago exige que você responda 200 (OK) bem rápido
        return res.status(200).send('OK');

    } catch (err) {
        console.error("❌ Erro no Webhook:", err);
        // Mesmo com erro, retornamos 200 para o MP não ficar tentando reenviar infinitamente
        return res.status(200).send('Webhook Received with Error');
    }
}
}

export default new OrderController();