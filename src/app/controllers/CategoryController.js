import * as Yup from 'yup';
import Category from '../models/Category.js';

class CategoryController {
  async store(req, res) {
    // 💡 OBSERVAÇÃO 1: Adicionamos essa verificação para evitar o erro 500 no terminal.
    // Se o Multer falhar ao ler o formulário, o req.body fica indefinido.
    if (!req.body) {
      return res.status(400).json({ error: 'Erro ao processar o formulário. Verifique os campos.' });
    }

    const { name } = req.body;
    const path = req.file ? req.file.filename : null;

    const schema = Yup.object({
      name: Yup.string().required(),
      path: Yup.string().required('A imagem é obrigatória'), 
    });

    try {
      // 💡 OBSERVAÇÃO 2: Validamos diretamente as constantes que extraímos acima.
      // Isso ignora a ordem em que os campos chegam no Insomnia.
      await schema.validate({ name, path }, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({ error: err.errors });
    }

    const categoryExists = await Category.findOne({
      where: { name },
    });

    if (categoryExists) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const { id } = await Category.create({
      name,
      path,
    });

    return res.status(201).json({ id, name });
  }

  async update(req, res) {
    const schema = Yup.object({
      name: Yup.string(),
    });

    try {
      // 💡 OBSERVAÇÃO 3: No update, usamos validateSync porque o req.body costuma estar preenchido.
      schema.validateSync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({ error: err.errors });
    }

    const { id } = req.params;
    const categoryExists = await Category.findByPk(id);

    if (!categoryExists) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let path;
    if (req.file) {
      path = req.file.filename;
    }

    const { name } = req.body;

    await Category.update(
      { name, path },
      { where: { id } }
    );

    return res.status(200).json({ message: 'Category updated successfully' });
  }

  async index(_req, res) {
    const categories = await Category.findAll();
    return res.status(200).json({ categories });
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      await category.destroy();
      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CategoryController();