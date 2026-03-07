// src/config/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialise Firebase Admin SDK
// Assurez-vous que le fichier serviceAccountKey.json est bien dans src/config/
// et que GOOGLE_APPLICATION_CREDENTIALS est défini dans .env
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  console.log('Firebase Admin SDK initialisé.');
} catch (error) {
  console.error('Erreur d\'initialisation de Firebase Admin SDK:', error);
}


export default admin;
