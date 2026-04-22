import 'dotenv/config'; 
import app from './app.js';
import './database/index.js';

// 🚀 O SEGREDO: Ele tenta ler a porta do Render (process.env.PORT). 
// Se não existir (como no seu PC), ele usa a 3001.
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Application running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 API Local: http://localhost:${PORT}`);
  }
});