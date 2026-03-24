// src/config/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let isFirebaseEnabled = false;

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

try {
  if (serviceAccountJson && serviceAccountJson.trim().length > 0) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    isFirebaseEnabled = true;
    console.log('Firebase Admin SDK initialise.');
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    isFirebaseEnabled = true;
    console.log('Firebase Admin SDK initialise.');
  } else {
    console.warn('Firebase desactive: FIREBASE_SERVICE_ACCOUNT_PATH manquant ou fichier introuvable.');
  }
} catch (error) {
  console.error("Erreur d'initialisation de Firebase Admin SDK:", error);
}

export { admin, isFirebaseEnabled };
