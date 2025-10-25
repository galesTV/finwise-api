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
    // Lista de origens permitidas
    const allowedOrigins = [
      "http://localhost:19006", // Expo Web
      "http://localhost:8081", // React Native Debugger
      "capacitor://localhost",
      "ionic://localhost",
      "http://10.0.2.2:3002", // Para Android Emulator
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
      /\.finwiseapp\.com$/.test(origin) ||
      /^http:\/\/192\.168\.\d+\.\d+/.test(origin)
    ) {
      return callback(null, true);
    }

    // Origin não permitida
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
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
