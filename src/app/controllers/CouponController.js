import * as Yup from 'yup';
import { Op } from 'sequelize';
import Coupon from '../models/Coupon.js';
import UserCoupon from '../models/UserCoupon.js';

class CouponController {
  // ─── CRIAR CUPOM ────────────────────────────────────────────────────────────
  async store(req, res) {
    const schema = Yup.object({
      code: Yup.string().required('O código do cupom é obrigatório.'),
      // O Model usa camelCase (underscored:true converte para snake_case no banco)
      discountPercentage: Yup.number()
        .typeError('discountPercentage deve ser um número.')
        .required('O percentual de desconto é obrigatório.')
        .min(1, 'O desconto mínimo é 1%.')
        .max(100, 'O desconto máximo é 100%.'),
      isActive: Yup.boolean(),
      expirationDate: Yup.date().nullable(),
      limitPerUser: Yup.number().integer().min(1).default(1),
    });

    try {
      await schema.validate(req.body, { abortEarly: true });
    } catch (err) {
      // Formato padronizado: { error: 'Mensagem aqui' }
      return res.status(400).json({ error: err.message });
    }

    const { code, discountPercentage, isActive, expirationDate, limitPerUser } =
      req.body;

    const couponExists = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });

    if (couponExists) {
      return res.status(400).json({ error: 'Este cupom já existe.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercentage,
      isActive: isActive !== undefined ? isActive : true,
      expirationDate: expirationDate || null,
      limitPerUser: limitPerUser || 1,
    });

    return res.status(201).json(coupon);
  }

  // ─── LISTAR CUPONS ──────────────────────────────────────────────────────────
  async index(req, res) {
    const coupons = await Coupon.findAll({
      order: [['id', 'ASC']],
    });
    return res.json(coupons);
  }

  // ─── VALIDAR CUPOM ──────────────────────────────────────────────────────────
  async validate(req, res) {
    const { code } = req.body;
    const userId = req.userId; // Vem do AuthMiddleware

    if (!code) {
      return res.status(400).json({ error: 'O código do cupom é obrigatório.' });
    }

    // 1️⃣ Cupom existe?
    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.status(400).json({ error: 'Este cupom não existe.' });
    }

    // 2️⃣ Cupom está ativo?
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Este cupom está inativo.' });
    }

    // 3️⃣ Cupom expirou?
    if (coupon.expirationDate && new Date() > new Date(coupon.expirationDate)) {
      return res.status(400).json({ error: 'Este cupom já expirou.' });
    }

    // 4️⃣ 🛡️ TRAVA DE SEGURANÇA — verifica quantas vezes o usuário já usou
    const usageCount = await UserCoupon.count({
      where: { user_id: userId, coupon_id: coupon.id },
    });

    if (usageCount >= coupon.limitPerUser) {
      return res.status(400).json({
        error: 'Este loot já foi resgatado por você! 🛡️',
      });
    }

    // Serialização explícita: garante que o frontend sempre receba camelCase,
    // independente do comportamento interno do Sequelize com underscored:true.
    const { dataValues } = coupon;
    return res.json({
      discountPercentage: dataValues.discount_percentage ?? coupon.discountPercentage,
      code: dataValues.code,
    });
  }

  // ─── DELETAR CUPOM ──────────────────────────────────────────────────────────
  async delete(req, res) {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(400).json({ error: 'Cupom não encontrado.' });
    }

    await coupon.destroy();
    return res.json({ message: 'Cupom deletado com sucesso.' });
  }
}

export default new CouponController();