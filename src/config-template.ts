export const config = {
  firebase: {
    client: {
      apiKey: "SUA_API_KEY_AQUI",
      authDomain: "seu-projeto.firebaseapp.com",
      projectId: "seu-projeto",
      storageBucket: "seu-projeto.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcd1234efgh5678",
    },
    admin: {
      projectId: "seu-projeto",
      clientEmail: "firebase-adminsdk@seu-projeto.iam.gserviceaccount.com",
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY || "",
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "7d",
  },
};
