import admin from "firebase-admin";

const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
let dbInstance: admin.firestore.Firestore | null = null;

try {
  if (!admin.apps.length) {
    if (serviceAccountVar) {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      dbInstance = admin.firestore();
    } else {
      // Só tenta inicializar se tiver o ID do projeto
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        dbInstance = admin.firestore();
      }
    }
  } else {
    dbInstance = admin.firestore();
  }
} catch (error) {
  console.error("Erro ao inicializar Firebase Admin:", error);
}

export const adminDb = dbInstance;
export { admin };
