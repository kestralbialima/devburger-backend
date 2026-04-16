import 'dotenv/config'; // 👈 Adicione isso na LINHA 1
import app from './app.js';
import './database/index.js';

app.listen(3001, () => console.log('Application running on port 3001 🚀'));