import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer.cjs';
import WebhookController from './app/controllers/WebhookController.js';

import ProductController from './app/controllers/ProductController.js';
import SessionController from './app/controllers/SessionController.js';
import UserController from './app/controllers/UserController.js';
import CategoryController from './app/controllers/CategoryController.js';
import OrderController from './app/controllers/OrderController.js';
import CouponController from './app/controllers/CouponController.js';
// 🆕 Importação dos novos Controllers
import ForgotPasswordController from './app/controllers/ForgotPasswordController.js';
import ResetPasswordController from './app/controllers/ResetPasswordController.js';

import authMiddleware from './app/middlewares/auth.js';
import authorize from './app/middlewares/role.js'; 

const routes = new Router();
const upload = multer(multerConfig);

/* --- 🔓 ROTAS PÚBLICAS (Abertas) --- */
routes.post('/sessions', SessionController.store);
routes.post('/user', UserController.store);

// 🔑 NOVAS: Rotas de Recuperação de Senha (Devem estar antes do authMiddleware)
routes.post('/forgot-password', ForgotPasswordController.store); // Solicita o link
routes.post('/reset-password', ResetPasswordController.store);   // Define a nova senha

// Listagem inicial de produtos e categorias para o cardápio
routes.get('/products', ProductController.index);
routes.get('/categories', CategoryController.index);

// Rota que o Mercado Pago vai chamar
routes.post('/orders/webhook', OrderController.handleWebhook);

/* --- 🛡️ BARREIRA DE AUTENTICAÇÃO --- */
// A partir daqui, todas as rotas exigem um Token JWT válido
routes.use(authMiddleware);

/* --- 📦 GESTÃO DE INVENTÁRIO (Master e Manager) --- */
routes.post('/products', authorize(['master', 'manager']), upload.single('file'), ProductController.store);
routes.post('/categories', authorize(['master', 'manager']), upload.single('file'), CategoryController.store);

routes.put('/products/:id', authorize(['master', 'manager']), upload.single('file'), ProductController.update);
routes.put('/categories/:id', authorize(['master', 'manager']), upload.single('file'), CategoryController.update);

routes.delete('/products/:id', authorize(['master', 'manager']), ProductController.delete);
routes.delete('/categories/:id', authorize(['master', 'manager']), CategoryController.delete);

/* --- 🎟️ CUPONS (Master e Manager) --- */
routes.post('/coupons', authorize(['master', 'manager']), CouponController.store);
routes.get('/coupons', authorize(['master', 'manager']), CouponController.index);
routes.delete('/coupons/:id', authorize(['master', 'manager']), CouponController.delete);
routes.post('/coupons/validate', CouponController.validate);

/* --- 🍔 GERENCIAMENTO DE PEDIDOS (Operação) --- */
routes.post('/orders', OrderController.store);
routes.get('/orders', OrderController.index);
routes.get('/orders/:id', OrderController.show);
routes.put('/orders/:id', authorize(['master', 'manager', 'operator']), OrderController.update);

/* --- 👑 GESTÃO DE USUÁRIOS (Somente Master) --- */
routes.get('/users', authorize(['master']), UserController.index);
routes.patch('/admin/users/role', authorize(['master']), UserController.update);

// Esta rota o Mercado Pago vai chamar "por trás das cenas"
//routes.post('/mercadopago/webhook', WebhookController.handle);

export default routes;