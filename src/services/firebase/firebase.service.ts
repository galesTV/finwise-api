import admin from "firebase-admin";

// Variáveis globais que serão inicializadas
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let FieldValue: typeof admin.firestore.FieldValue;

export const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    console.log("🔧 Configurando Firebase Admin...");
    console.log("Project ID:", serviceAccount.projectId);
    console.log("Client Email:", serviceAccount.clientEmail);
    console.log("Private Key present:", !!serviceAccount.privateKey);

    if (
      !serviceAccount.projectId ||
      !serviceAccount.clientEmail ||
      !serviceAccount.privateKey
    ) {
      throw new Error(
        "Firebase Admin SDK configuration is missing. Check your environment variables."
      );
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      // Inicializa as variáveis após a configuração
      db = admin.firestore();
      auth = admin.auth();
      FieldValue = admin.firestore.FieldValue;

      console.log("✅ Firebase Admin initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Firebase Admin:", error);
      throw error;
    }
  }
};

// Exporta as instâncias inicializadas
export { db, auth, FieldValue, admin };

export interface FirebaseAdminError extends Error {
  code?: string;
  message: string;
}

// Função para obter a configuração do Firebase Client
export const getFirebaseClientConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
};
