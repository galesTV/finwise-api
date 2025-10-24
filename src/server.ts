import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env do diretório raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3002;

console.log('Server starting...');

const requiredEnvVars = ['FIREBASE_API_KEY', 'JWT_SECRET', 'FIREBASE_DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Erro: Variável de ambiente ${envVar} não definida`);
    process.exit(1);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});