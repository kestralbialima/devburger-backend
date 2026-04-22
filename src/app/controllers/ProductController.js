import * as Yup from 'yup';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

class ProductController {
  /**
   * 🚀 MÉTODO STORE: Responsável por criar novos produtos.
   * Ele recebe os dados do formulário e a imagem, valida e salva no banco.
   */
  async store(req, res) {
    // 1. Definição do Schema de Validação (Yup)
    const schema = Yup.object({
      name: Yup.string().transform(v => v.replace(/<[^>]+>/g, '')).required(),
      price: Yup.number().positive().required(),
      category_id: Yup.number().required(),
      description: Yup.string().transform(v => v.replace(/<[^>]+>/g, '')).min(10).required(),
      offer: Yup.boolean(),
      is_bonus: Yup.boolean(), // ✅ Adicionado na validação
    });

    // 2. Executa a validação dos dados recebidos no corpo (body) da requisição
    try {
      schema.validateSync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({ error: err.errors });
    }

    // 3. Desestruturação: Extrai os dados validados do corpo da requisição
    const { name, price, category_id, description, offer, is_bonus } = req.body;

    // 4. Se a imagem é obrigatória no upload:
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }
    const { filename } = req.file;

    // 5. Chamada ao Sequelize: Cria o registro na tabela 'products'
    const newProduct = await Product.create({
      name,
      price,
      category_id,
      description,
      path: filename, // O path salva o nome do arquivo para compor a URL virtual
      offer: offer || false,       // Garante que não vá null
      is_bonus: is_bonus || false, // Garante que não vá null
    });

    return res.status(201).json({ ok: true, product: newProduct });
  }

  /**
   * 🔄 MÉTODO UPDATE: Responsável por editar produtos existentes.
   * Ele identifica o produto pelo ID na URL e atualiza apenas o que foi enviado.
   */
  async update(req, res) {
    const schema = Yup.object({
      name: Yup.string().transform(v => v ? v.replace(/<[^>]+>/g, '') : v),
      price: Yup.number()
        .typeError('O preço deve ser um número válido')
        .positive(),
      category_id: Yup.number(),
      description: Yup.string().transform(v => v ? v.replace(/<[^>]+>/g, '') : v).min(10),
      offer: Yup.boolean().typeError('Offer deve ser um valor booleano'),
      is_bonus: Yup.boolean().typeError('is_bonus deve ser um valor booleano'),
    });

    try {
      schema.validateSync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({ error: err.errors });
    }

    // 1. Identificação: Pega o ID da rota (ex: /products/15) e os dados do corpo
    const { id } = req.params;
    const { name, price, category_id, description, offer, is_bonus } = req.body;

    // 2. Busca no banco para verificar se o produto realmente existe
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 3. Monta o objeto de atualização apenas com os dados fornecidos
    const updateData = {
      name,
      price,
      category_id,
      description,
      offer,
      is_bonus,
    };

    // 4. Lógica da Imagem: Se o usuário enviou uma foto nova, atualiza o path.
    if (req.file) {
      updateData.path = req.file.filename;
    }

    // 5. Executa a atualização no banco de dados utilizando a instância já encontrada.
    //    Após o update(), a instância 'product' já reflete os novos valores em memória,
    //    inclusive o getter virtual 'url' que monta a URL a partir do novo 'path'.
    await product.update(updateData);

    // 6. Recarrega do banco para garantir que o getter virtual 'url' seja
    //    computado com o path definitivamente persistido.
    await product.reload();

    return res.status(200).json({ product });
  }

  /**
   * 📋 MÉTODO INDEX: Lista todos os produtos cadastrados.
   * Ele faz um "JOIN" com a tabela de categorias para trazer o nome da categoria junto.
   */
  async index(_req, res) {
    try {
      const products = await Product.findAll({
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
        order: [['name', 'ASC']], // Opcional: mantém a lista em ordem alfabética
      });

      // Retornamos o array DIRETAMENTE. 
      // Isso evita o erro de ".map is not a function" no React.
      return res.status(200).json(products);

    } catch (err) {
      console.error('❌ Erro ao listar produtos:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * 🗑️ MÉTODO DELETE: Remove um produto permanentemente.
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.destroy(); // Comando do Sequelize para deletar a linha no banco

      return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ProductController();