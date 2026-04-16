import * as Yup from 'yup';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Order from '../schemas/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';

// 🛡️ Configuração do Mercado Pago: O 'client' é o nosso passaporte para a API deles.
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

class OrderController {
    // 1️⃣ CRIAR PREFERÊNCIA DE PAGAMENTO
    // Objetivo: Receber o carrinho e devolver o link do Mercado Pago.
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

        // Validação dos dados que chegam do Front
        try {
            schema.validateSync(req.body, { abortEarly: false });
        } catch (err) {
            return res.status(400).json({ error: err.errors });
        }

        try {
            const productsIds = req.body.products.map((product) => product.id);

            // 🔍 Segurança: Buscamos os preços direto do nosso banco PostgreSQL.
            const findProducts = await Product.findAll({
                where: { id: productsIds },
                include: [{ model: Category, as: 'category', attributes: ['name'] }],
            });

            // 🎟️ Lógica de Cupom: Verificamos se o cupom existe e está ativo.
            let discount_percentage = 0;
            const { coupon_code } = req.body;

            if (coupon_code) {
                const coupon = await Coupon.findOne({ where: { code: coupon_code.toUpperCase() } });
                if (coupon && coupon.is_active) {
                    discount_percentage = coupon.discount_percentage;
                }
            }

            // 📦 Formatação: Transformamos nossos produtos no padrão que o Mercado Pago exige.
            const items = findProducts.map((product) => {
                const productIndex = req.body.products.findIndex((item) => item.id === product.id);
                const quantity = req.body.products[productIndex].quantity;
                
                // Aplicamos o desconto no preço unitário, se houver.
                const finalPrice = discount_percentage > 0 
                    ? product.price * (1 - discount_percentage / 100) 
                    : product.price;

                return {
                    id: String(product.id),
                    title: product.name,
                    unit_price: Number(finalPrice.toFixed(2)), // Forçamos Number para o SDK não dar erro
                    quantity: Number(quantity),
                    currency_id: 'BRL',
                };
            });

            // 💳 Chamada ao SDK: Aqui pedimos para o Mercado Pago criar o link.
            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: items, 
                    back_urls: {
                        success: 'http://localhost:5173/confirmacao',
                        failure: 'http://localhost:5173/carrinho',
                        pending: 'http://localhost:5173/confirmacao'
                    },
                    auto_return: 'approved', // Faz o cliente voltar pro seu site sozinho após pagar
                }
            });

            // 🔥 O RETORNO: Enviamos o 'init_point' que é a URL do checkout.
            return res.status(201).json({ url: result.init_point });

        } catch (err) {
            console.error("❌ Erro no Mercado Pago:", err);
            return res.status(500).json({ error: "Falha ao gerar o portal de pagamento." });
        }
    }

    // 2️⃣ LISTAR TODOS OS PEDIDOS (PAINEL ADMIN)
    // Busca no MongoDB todos os registros de vendas realizadas.
    async index(req, res) {
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.status(200).json(orders);
    }

    // 3️⃣ BUSCAR UM PEDIDO ÚNICO
    // Usado na tela de 'Acompanhar Pedido' do cliente.
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

    // 4️⃣ ATUALIZAR STATUS (LOGÍSTICA)
    // Quando o admin muda de 'Realizado' para 'Em preparo' ou 'Entregue'.
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
            return res.status(200).json({ message: "Status atualizado!" });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new OrderController();