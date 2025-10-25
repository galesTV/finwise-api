import app from "./app";
import dotenv from "dotenv";
import path from "path";

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("Server starting...");
console.log("Environment:", process.env.NODE_ENV || "development");

// Verificação de variáveis de ambiente ANTES de importar o Firebase
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_DATABASE_URL",
  "JWT_SECRET",
];

const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error("❌ Variáveis de ambiente ausentes:", missingVars);
  console.error("Por favor, verifique seu arquivo .env");
  process.exit(1);
}

console.log("✅ Todas as variáveis de ambiente estão configuradas");

import { initializeFirebase } from "./services/firebase/firebase.service";

// Inicializa o Firebase
initializeFirebase();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
