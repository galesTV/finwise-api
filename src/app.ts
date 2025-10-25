import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

import "./services/firebase/firebase.service";

const app = express();

// Configuração detalhada do CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Lista de origens permitidas - ADICIONE SUAS URLs AQUI
    const allowedOrigins = [
      "http://localhost:19006", // Expo Web (JÁ EXISTE)
      "http://localhost:8081", // React Native Debugger
      "http://localhost:3000", // React dev server
      "http://localhost:3001", // Outra porta comum
      "capacitor://localhost",
      "ionic://localhost",
      "http://10.0.2.2:3002", // Para Android Emulator
      "http://clouds.opsmkt.com.br:3002",
      "exp://192.168.*.*:19000", // Expo no dispositivo físico
    ];

    // Adiciona domínio de produção se existir
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Permite requisições sem origin (mobile apps, postman, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Verifica se a origin está na lista de permitidas
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Verifica match com regex para IPs locais e domínios
    if (
      /\.opsmkt\.com\.br$/.test(origin) || // SEU DOMÍNIO
      /^http:\/\/192\.168\.\d+\.\d+/.test(origin) || // IPs locais
      /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin) || // Outros IPs locais
      /^http:\/\/172\.\d+\.\d+\.\d+/.test(origin) || // Docker networks
      /^exp:\/\//.test(origin) // URLs do Expo
    ) {
      return callback(null, true);
    }

    console.log("🚫 Origin bloqueada pelo CORS:", origin);
    console.log("✅ Origens permitidas:", allowedOrigins);

    // Origin não permitida
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.options("*", cors(corsOptions)); // Habilita preflight para todas as rotas

// Routes
app.use("/backend", routes);

// Error handling
app.use(errorHandler);

export default app;
