DOCUMENT D AVANCEMENT - MEALFLAVOR
Date: 13/02/2026

========================================
PARTIE A - ETAT D AVANCEMENT (APRES CODE)
========================================

1) Resume executif
- Le projet est fonctionnel sur les parcours principaux (client + commercant).
- Le backend REST est complet sur les domaines critiques.
- Le front Flutter est largement aligne au design cible.
- Le principal chantier restant est la stabilisation du paiement en ligne (Stripe).

2) Ce qui est fait (code)
Backend
- Auth JWT: register/login/me/profile, roles, middleware.
- Merchants: register, update, validation admin, lecture profil.
- Baskets: CRUD, regles d acces, blocage si commercant non approuve.
- Orders: create, history client/commercant, detail, QR, pickup.
- Notifications: enregistrement + envoi FCM (avec gestion d erreur).
- Upload images: Cloudinary via /api/upload.
- Seeds: script de donnees de test (users/merchants/baskets/orders/notifications).

Frontend Flutter
- Auth: splash, onboarding, login, register, forgot password.
- Client: liste paniers, detail, checkout, confirmation, historique, profil.
- Commercant: dashboard, paniers, ventes, detail commande, scan QR, profil.
- Navigation: GoRouter avec redirections par role.
- Modeles: alignement des champs principaux backend.
- Stabilisation tokens: suppression auto sur 401 pour eviter blocage splash.

3) Ce qui est en cours
- Paiement en ligne: migration et stabilisation Stripe (checkout + webhook).
- Recette complete du parcours paiement (statuts, stock, notifications).
- Ajustements UI mineurs apres migration React -> Flutter.

4) Ce qui n est pas encore fait
- Tests automatises (unitaires + integration + e2e).
- Admin UI complet (moderation, stats).
- CI/CD complet.
- Deploiement preprod/prod + monitoring.
- Refresh token (session longue).

5) Risques / blocages
- Paiement: webhook Stripe non encore valide bout en bout.
- Webhooks locaux: besoin d URL publique pour tests.
- Secrets: rotation des cles exposees a faire.

6) Prochaines etapes (priorites)
1. Finaliser Stripe sandbox (creation session + webhook signe).
2. Valider la chaine paiement -> MAJ statut -> stock.
3. Stabiliser les ecrans restants (retours UI).
4. Ajouter une base de tests backend.
5. Preparer deploiement preprod.

7) Planning propose (vision simple, 6 semaines)
Semaine 1
- Paiement Stripe en sandbox (checkout + webhook signe).
- Tunnel public pour webhook (tests reels).

Semaine 2
- Fix geolocalisation (permissions + tests sur appareil reel).
- Valider parcours "scan QR" commercant -> retrait.

Semaine 3
- Recette complete client (liste paniers -> commande -> confirmation).
- Recette complete commercant (paniers -> ventes -> scan QR).

Semaine 4
- Tests backend minimum (auth, paniers, commandes).
- Corrections regressions UI/UX restantes.

Semaine 5
- Admin UI de base (validation commercants).
- Stabilisation notifications (erreurs + retry simple).

Semaine 6
- Preprod + documentation finale + checklist soutenance.

8) Points techniques en attente
- Geolocalisation: actuellement instable ou desactivee selon appareils; a corriger (permissions + fallback).
- QR code: generation et validation sont codees, mais test terrain complet a finaliser.
- Paiement: en cours de migration vers Stripe, pas encore valide de bout en bout.

9) Explication simple de la "partie code" (non technique)
- Backend = le "serveur" qui garde les donnees et applique les regles.
  Il gere les comptes, les paniers, les commandes, le QR code, les paiements.
- Frontend = l application mobile (Flutter) utilisee par les clients et commercants.
  Elle affiche les ecrans, permet d ajouter des paniers et de commander.
- Flux principal client:
  1) se connecter
  2) voir des paniers
  3) reserver un panier
  4) payer
  5) recevoir un QR code
  6) presenter le QR code au commerçant
- Flux principal commercant:
  1) creer le profil commercant
  2) publier des paniers
  3) voir les commandes
  4) scanner le QR code pour valider le retrait

========================================
PARTIE B - BASE DOCUMENTAIRE (AVANT CODE)
========================================

________________________________________
✅ PARTIE II : ANALYSE ET CONCEPTION
________________________________________
6. Analyse des Besoins
6.1 Identification des Acteurs
Le système met en interaction trois types d’acteurs principaux :
Acteur	Description
Client	Utilisateur final souhaitant réserver des paniers alimentaires à prix réduit
Commerçant	Professionnel proposant des invendus sous forme de paniers
Administrateur	Responsable de la modération, validation des comptes commerçants et supervision du système
________________________________________
6.2 Besoins Fonctionnels
Besoins côté Client
•	Créer un compte utilisateur et se connecter
•	Consulter les paniers disponibles à proximité
•	Filtrer les paniers par prix, distance et catégorie
•	Réserver un panier
•	Effectuer un paiement Mobile Money
•	Recevoir un QR code de retrait
•	Consulter l’historique de ses commandes
•	Modifier son profil
Besoins côté Commerçant
•	Créer un compte commerçant après inscription utilisateur
•	Publier des paniers d’invendus
•	Consulter les réservations clients
•	Scanner le QR code pour valider les retraits
•	Visualiser ses ventes
Besoins côté Administrateur
•	Valider ou refuser les comptes commerçants
•	Superviser les transactions
•	Modérer les contenus
•	Accéder aux statistiques globales
________________________________________
7. Spécifications Fonctionnelles
________________________________________
7.1 Authentification et Gestion des Comptes
Fonction	Description
Inscription utilisateur	Création d’un compte avec email et mot de passe
Connexion	Authentification par identifiants
Gestion profil	Modification des informations personnelles
Récupération session	Maintien de session via token JWT
________________________________________
7.2 Gestion des Paniers
Fonction	Description
Création panier	Le commerçant crée un panier d’invendus
Modification panier	Mise à jour d’un panier existant
Suppression panier	Suppression d’un panier
Consultation paniers	Visualisation des paniers disponibles
Filtrage	Filtre par distance, prix, catégorie
________________________________________
7.3 Commandes et Paiement
Fonction	Description
Réservation panier	Blocage d’un panier par un client
Paiement	Paiement via Mobile Money
Génération QR	Génération automatique du QR code
Validation retrait	Scan du QR code par le commerçant
Historique commandes	Liste des commandes utilisateur
________________________________________
7.4 Gestion des Commerçants
Fonction	Description
Inscription commerçant	Soumission du commerce
Validation admin	Approbation ou rejet
Gestion commerce	Modification informations commerce
Consultation ventes	Accès à l’historique des ventes
________________________________________
8. Spécifications Techniques
________________________________________
8.2 Stack Technique
Couche	Technologie
Frontend	Flutter
Backend	Node.js, Express.js
Base de données	PostgreSQL
ORM	Prisma
Authentification	JWT, bcrypt
Paiement	Flutterwave API
Upload médias	Cloudinary
Versionning	GitHub

Services externes :
•	Flutterwave → Paiement
•	Cloudinary → Images
•	Firebase → Notifications
________________________________________
9. Architecture du Système
________________________________________
9.1 Architecture Générale
Le système repose sur une architecture client–serveur en trois couches :
1.	Frontend mobile (Flutter)
→ Interface utilisateur
2.	Backend API REST (Node.js / Express)
→ Logique métier et sécurité
3.	Base de données (PostgreSQL)
→ Stockage persistant
________________________________________
9.2 Architecture Backend
Le backend est structuré selon le pattern MVC simplifié :
routes/ → controllers/ → services/ → prisma/ → database
•	Routes : réception requêtes HTTP
•	Controllers : validation et orchestration
•	Services : logique métier
•	Prisma : accès base de données
•	Middlewares : sécurité, rôles, erreurs
________________________________________
9.3 Architecture Frontend
Flutter est organisé par features :
features/
├── auth/
├── baskets/
├── orders/
├── profile/
├── merchant/
└── shared/
Chaque feature contient :
•	UI screens
•	ViewModels / Providers
•	Services API
________________________________________
10. Modélisation UML
________________________________________
10.1 Diagramme de Cas d’Utilisation (Description textuelle)
Acteur : Client
•	S’inscrire
•	Se connecter
•	Consulter paniers
•	Réserver panier
•	Effectuer paiement
•	Consulter historique
•	Présenter QR code
Acteur : Commerçant
•	S’inscrire comme commerçant
•	Créer panier
•	Modifier panier
•	Supprimer panier
•	Scanner QR code
•	Consulter réservations
Acteur : Administrateur
•	Valider comptes commerçants
•	Superviser transactions
•	Modérer contenus
________________________________________
10.2 Diagramme de Séquence — Réservation d’un Panier
1.	Client sélectionne un panier
2.	Application envoie requête au backend
3.	Backend vérifie disponibilité
4.	Backend initie paiement Flutterwave
5.	Flutterwave confirme transaction
6.	Backend génère QR code
7.	Client reçoit confirmation
________________________________________
10.3 Diagramme de Séquence — Validation Retrait
1.	Commerçant scanne QR code
2.	Application envoie données au backend
3.	Backend vérifie validité
4.	Backend marque commande comme retirée
5.	Confirmation envoyée au commerçant
________________________________________
10.4 Diagramme de Classes (Description)
Classes principales :
•	User
•	Merchant
•	Basket
•	Order
•	Notification
Relations :
•	User 1—1 Merchant
•	Merchant 1—N Basket
•	Basket 1—N Order
•	User 1—N Order
________________________________________
10.5 Diagramme d’Activité — Parcours Client
1.	Lancement application
2.	Connexion
3.	Recherche panier
4.	Sélection panier
5.	Paiement
6.	Génération QR
7.	Retrait produit
________________________________________
✅ PARTIE III : CONCEPTION DE LA BASE DE DONNÉES
________________________________________
11. Modèle Conceptuel de Données (MCD)
11.1 Objectif du MCD
Le Modèle Conceptuel de Données (MCD) permet de représenter de manière abstraite les entités du système ainsi que leurs relations, indépendamment de toute considération technique. Il constitue la base de la conception logique et physique de la base de données.
Dans le cadre de l’application Anti-Gaspillage Alimentaire, le MCD vise à :
•	Structurer les informations relatives aux utilisateurs, commerçants, paniers et commandes
•	Garantir la cohérence des données
•	Faciliter les opérations de réservation, paiement et retrait
________________________________________
11.2 Entités Principales
Entité	Description
Utilisateur (User)	Personne utilisant l’application (client, commerçant ou administrateur)
Commerçant (Merchant)	Commerce physique proposant des paniers
Panier (Basket)	Offre d’invendus alimentaires publiée par un commerçant
Commande (Order)	Réservation d’un panier par un client
Notification	Message système envoyé à un utilisateur
________________________________________
11.3 Relations Entre Entités
Relation	Cardinalité	Description
User — Merchant	1..1	Un utilisateur peut être associé à un commerce
Merchant — Basket	1..N	Un commerçant peut publier plusieurs paniers
Basket — Order	1..N	Un panier peut générer plusieurs commandes
User — Order	1..N	Un utilisateur peut passer plusieurs commandes
User — Notification	1..N	Un utilisateur reçoit plusieurs notifications
________________________________________
11.4 Représentation Textuelle du MCD
User (id, email, password, role, phone, latitude, longitude)
  |
  | 1..1
  |
Merchant (id, businessName, type, address, status)
  |
  | 1..N
  |
Basket (id, title, price, quantity, pickupTime)
  |
  | 1..N
  |
Order (id, paymentMethod, paymentStatus, qrCode, pickedUpAt)

User 1..N Notification
________________________________________
12. Modèle Logique de Données (MLD)
12.1 Objectif du MLD
Le Modèle Logique de Données transforme le MCD en structures relationnelles exploitables dans une base de données relationnelle, en définissant clairement :
•	Les tables
•	Les clés primaires
•	Les clés étrangères
•	Les contraintes d’intégrité
________________________________________
12.2 Tables Relationnelles
Table USER
•	id (PK)
•	email (unique)
•	password
•	displayName
•	phoneNumber
•	role
•	latitude
•	longitude
•	createdAt
•	updatedAt
________________________________________
Table MERCHANT
•	id (PK)
•	userId (FK → User.id)
•	businessName
•	type
•	address
•	latitude
•	longitude
•	phoneNumber
•	photoURL
•	status
•	createdAt
•	updatedAt
________________________________________
Table BASKET
•	id (PK)
•	merchantId (FK → Merchant.id)
•	title
•	description
•	category
•	originalPrice
•	discountedPrice
•	quantity
•	availableQuantity
•	pickupTimeStart
•	pickupTimeEnd
•	photoURL
•	status
•	createdAt
•	updatedAt
________________________________________
Table ORDER
•	id (PK)
•	userId (FK → User.id)
•	basketId (FK → Basket.id)
•	merchantId (FK → Merchant.id)
•	price
•	paymentMethod
•	paymentStatus
•	orderStatus
•	qrCode
•	transactionRef
•	paidAt
•	pickedUpAt
•	createdAt
•	updatedAt
________________________________________
Table NOTIFICATION
•	id (PK)
•	userId (FK → User.id)
•	title
•	body
•	type
•	data (JSON)
•	isRead
•	createdAt
________________________________________
13. Modèle Physique de Données (MPD)
13.1 Objectif du MPD
Le Modèle Physique de Données définit la structure concrète des tables telles qu’elles seront implémentées dans PostgreSQL, en précisant :
•	Les types de données
•	Les contraintes
•	Les index
•	Les relations référentielles
________________________________________
13.2 Schéma SQL (PostgreSQL)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name VARCHAR(150),
  phone_number VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('CLIENT','MERCHANT','ADMIN')) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  fcm_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  address TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  phone_number VARCHAR(20),
  photo_url TEXT,
  status VARCHAR(20) CHECK (status IN ('PENDING','APPROVED','REJECTED')) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(20) CHECK (category IN ('SWEET','SAVORY','MIXED')),
  original_price INTEGER NOT NULL,
  discounted_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  pickup_time_start TIMESTAMP NOT NULL,
  pickup_time_end TIMESTAMP NOT NULL,
  photo_url TEXT,
  status VARCHAR(20) CHECK (status IN ('AVAILABLE','SOLD_OUT','EXPIRED')) DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  basket_id UUID REFERENCES baskets(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('FLOOZ','TMONEY','CASH')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING','PAID','FAILED')),
  order_status VARCHAR(20) CHECK (order_status IN ('RESERVED','PICKED_UP','CANCELLED')),
  qr_code TEXT UNIQUE NOT NULL,
  transaction_ref TEXT,
  paid_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  body TEXT,
  type VARCHAR(50),
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
________________________________________
14. Dictionnaire de Données
________________________________________
📘 Table USER
Champ	Type	Description
id	UUID	Identifiant unique
email	VARCHAR	Adresse email unique
password	TEXT	Mot de passe hashé
display_name	VARCHAR	Nom affiché
phone_number	VARCHAR	Numéro téléphone
role	ENUM	CLIENT / MERCHANT / ADMIN
latitude	DECIMAL	Latitude GPS
longitude	DECIMAL	Longitude GPS
fcm_token	TEXT	Token notifications
created_at	TIMESTAMP	Date création
updated_at	TIMESTAMP	Date mise à jour
________________________________________
📘 Table MERCHANT
Champ	Type	Description
id	UUID	Identifiant du commerce
user_id	UUID	Référence utilisateur
business_name	VARCHAR	Nom du commerce
type	VARCHAR	Type d’activité
address	TEXT	Adresse physique
latitude	DECIMAL	Latitude
longitude	DECIMAL	Longitude
phone_number	VARCHAR	Contact
photo_url	TEXT	Image du commerce
status	ENUM	PENDING / APPROVED / REJECTED
created_at	TIMESTAMP	Date création
updated_at	TIMESTAMP	Date modification
________________________________________
📘 Table BASKET
Champ	Type	Description
id	UUID	Identifiant panier
merchant_id	UUID	Commerçant propriétaire
title	VARCHAR	Nom du panier
description	TEXT	Description
category	ENUM	SWEET / SAVORY / MIXED
original_price	INTEGER	Prix initial
discounted_price	INTEGER	Prix réduit
quantity	INTEGER	Quantité totale
available_quantity	INTEGER	Quantité restante
pickup_time_start	TIMESTAMP	Début retrait
pickup_time_end	TIMESTAMP	Fin retrait
photo_url	TEXT	Image
status	ENUM	AVAILABLE / SOLD_OUT / EXPIRED
created_at	TIMESTAMP	Date création
updated_at	TIMESTAMP	Date mise à jour
________________________________________
📘 Table ORDER
Champ	Type	Description
id	UUID	Identifiant commande
user_id	UUID	Client
basket_id	UUID	Panier réservé
merchant_id	UUID	Commerçant
price	INTEGER	Montant payé
payment_method	ENUM	FLOOZ / TMONEY / CASH
payment_status	ENUM	PENDING / PAID / FAILED
order_status	ENUM	RESERVED / PICKED_UP / CANCELLED
qr_code	TEXT	Code unique de retrait
transaction_ref	TEXT	Référence paiement
paid_at	TIMESTAMP	Date paiement
picked_up_at	TIMESTAMP	Date retrait
created_at	TIMESTAMP	Date création
updated_at	TIMESTAMP	Date modification
________________________________________
📘 Table NOTIFICATION
Champ	Type	Description
id	UUID	Identifiant notification
user_id	UUID	Destinataire
title	VARCHAR	Titre
body	TEXT	Message
type	VARCHAR	Type notification
data	JSON	Données supplémentaires
is_read	BOOLEAN	Lu ou non
created_at	TIMESTAMP	Date création
________________________________________
✅ PARTIE V : IMPLÉMENTATION
________________________________________
18. Technologies Utilisées
18.1 Backend
Technologie	Rôle
Node.js	Environnement d’exécution JavaScript côté serveur
Express.js	Framework web pour API REST
PostgreSQL	Base de données relationnelle
Prisma ORM	Accès typé à la base de données
JWT	Authentification sécurisée
bcrypt	Hashage des mots de passe
Flutterwave API	Paiements Mobile Money
Cloudinary	Hébergement et gestion des images
Firebase Cloud Messaging	Notifications push
________________________________________
18.2 Frontend
Technologie	Rôle
Flutter	Développement mobile multiplateforme
Dart	Langage Flutter
Google Maps SDK	Géolocalisation
QR Scanner	Lecture QR Code
Provider / Riverpod	Gestion d’état
REST API	Communication backend
________________________________________
18.3 Outils de Développement
Outil	Utilité
GitHub	Gestion du code source
Trello	Suivi des tâches
Figma	Maquettes UI/UX
Postman / cURL	Tests API
Railway / Render	Déploiement backend
________________________________________
19. Architecture Backend
________________________________________
19.1 Organisation du Projet
Le backend est structuré de manière modulaire afin de faciliter la maintenance et l’évolutivité :
src/
├── controllers/
├── routes/
├── services/
├── middlewares/
├── prisma/
├── utils/
├── config/
└── app.js
________________________________________
19.2 Flux de Traitement d’une Requête
1.	Réception requête HTTP via route
2.	Vérification authentification (middleware JWT)
3.	Validation des données (express-validator)
4.	Appel logique métier (service)
5.	Accès base de données via Prisma
6.	Retour réponse JSON au client
________________________________________
19.3 Sécurité Backend
•	Hashage mots de passe avec bcrypt (12 rounds)
•	Authentification JWT avec expiration
•	Middleware de rôle (CLIENT, MERCHANT, ADMIN)
•	Protection contre injections SQL via Prisma
•	Rate limiting contre abus API
________________________________________
20. Architecture Frontend
________________________________________
20.1 Organisation Flutter
Le frontend Flutter suit une architecture orientée fonctionnalités :
lib/
├── features/
│   ├── auth/
│   ├── baskets/
│   ├── orders/
│   ├── merchant/
│   ├── profile/
│   └── shared/
├── core/
└── main.dart
________________________________________
20.2 Navigation
•	Navigation par Bottom Navigation Bar
•	Routage avec Navigator 2.0 / GoRouter
•	Séparation écrans clients / commerçants
________________________________________
20.3 Communication Backend
•	Appels REST API via package dio / http
•	Intercepteurs pour token JWT
•	Gestion erreurs réseau
________________________________________
21. Intégrations Tierces
________________________________________
21.1 Paiement Flutterwave
•	Initialisation du paiement depuis le backend
•	Redirection client vers interface Flutterwave
•	Webhook pour confirmation serveur
•	Mise à jour commande en base
________________________________________
21.2 Upload Images — Cloudinary
•	Upload direct via endpoint backend
•	Stockage URL sécurisée
•	Compression automatique des images
________________________________________
21.3 Notifications — Firebase Cloud Messaging
•	Enregistrement token FCM utilisateur
•	Envoi notifications push côté serveur
•	Notifications lors de :
o	Confirmation réservation
o	Rappel de retrait
o	Paiement validé
________________________________________
22. Authentification et Gestion des Utilisateurs
________________________________________
22.1 Inscription
•	Email + mot de passe
•	Validation format email
•	Hash mot de passe
•	Génération JWT
________________________________________
22.2 Connexion
•	Vérification credentials
•	Renvoi token JWT
•	Stockage sécurisé côté client
________________________________________
22.3 Gestion Profil
•	Mise à jour nom, téléphone, localisation
•	Rafraîchissement token si nécessaire
________________________________________
23. Gestion des Paniers
________________________________________
23.1 Création Panier (Commerçant)
•	Saisie titre, description, prix, quantité
•	Upload image via Cloudinary
•	Définition créneau retrait
•	Validation automatique backend
________________________________________
23.2 Consultation Paniers (Client)
•	Liste géolocalisée
•	Filtres par distance, prix, catégorie
•	Affichage carte + liste
________________________________________
23.3 Mise à Jour Stock
•	Décrément automatique lors réservation
•	Blocage en cas stock épuisé
________________________________________
24. Système de Géolocalisation
________________________________________
24.1 Localisation Utilisateur
•	Accès GPS via permissions Android
•	Sauvegarde latitude/longitude
________________________________________
24.2 Calcul Distance
•	Utilisation formule Haversine côté backend
•	Tri automatique par proximité
________________________________________
25. Système de Commandes et Paiement
________________________________________
25.1 Création Commande
•	Vérification disponibilité panier
•	Création commande statut PENDING
•	Génération QR code unique
________________________________________
25.2 Paiement Mobile Money
•	Intégration Flutterwave
•	Confirmation via webhook sécurisé
•	Mise à jour statut commande → PAID
________________________________________
25.3 Gestion Erreurs Paiement
•	Timeout → annulation
•	Échec → remise stock automatique
________________________________________
26. Système de QR Code
________________________________________
26.1 Génération QR
•	QR généré après paiement
•	Stocké en base sous forme de token unique
________________________________________
26.2 Scan QR
•	Scan côté commerçant
•	Vérification serveur
•	Passage commande → PICKED_UP
________________________________________
27. Dashboard Commerçant
________________________________________
27.1 Fonctionnalités
•	Liste paniers publiés
•	Liste commandes reçues
•	Statistiques ventes simples
•	Historique retraits
________________________________________
27.2 Sécurité
•	Accès limité au commerçant propriétaire
•	Vérification serveur systématique
________________________________________
📘 SPÉCIFICATION API COMPLÈTE
Application MealFlavor – Backend REST
________________________________________
🔐 1. AUTHENTIFICATION & UTILISATEURS
🔹 1.1 Inscription
POST /api/auth/register
Description : Créer un compte utilisateur (client ou commerçant).
Body JSON :
{
  "email": "user@mail.com",
  "password": "password123",
  "displayName": "Jean Doe",
  "phoneNumber": "+22890123456",
  "role": "CLIENT"
}
Réponse 201 :
{
  "message": "Compte créé avec succès",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@mail.com",
    "displayName": "Jean Doe",
    "role": "CLIENT"
  }
}
Erreurs :
•	400 — Email invalide
•	409 — Email déjà utilisé
________________________________________
🔹 1.2 Connexion
POST /api/auth/login
Body :
{
  "email": "user@mail.com",
  "password": "password123"
}
Réponse 200 :
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@mail.com",
    "displayName": "Jean Doe",
    "role": "CLIENT"
  }
}
Erreur :
•	401 — Identifiants invalides
________________________________________
🔹 1.3 Profil utilisateur
GET /api/auth/me 🔐
Headers :
Authorization: Bearer <token>
Réponse :
{
  "id": "uuid",
  "email": "user@mail.com",
  "displayName": "Jean Doe",
  "phoneNumber": "+22890123456",
  "role": "CLIENT",
  "latitude": 6.1319,
  "longitude": 1.2228
}
________________________________________
PUT /api/auth/profile 🔐
Body :
{
  "displayName": "Jean Nouveau",
  "phoneNumber": "+22890123456",
  "latitude": 6.13,
  "longitude": 1.21
}
Réponse :
{ "message": "Profil mis à jour" }
________________________________________
🏪 2. GESTION DES COMMERÇANTS
🔹 2.1 Inscription commerçant
POST /api/merchants/register 🔐
Body :
{
  "businessName": "Boulangerie du Centre",
  "type": "BAKERY",
  "address": "Rue du Marché, Lomé",
  "latitude": 6.131,
  "longitude": 1.222,
  "phoneNumber": "+22890112233",
  "photoURL": "https://cloudinary.com/image.jpg"
}
Réponse :
{
  "message": "Demande enregistrée. En attente de validation.",
  "merchant": {
    "id": "uuid",
    "status": "PENDING"
  }
}
________________________________________
🔹 2.2 Voir mon commerce
GET /api/merchants/me 🔐 (MERCHANT)
Réponse :
{
  "id": "uuid",
  "businessName": "Boulangerie du Centre",
  "type": "BAKERY",
  "address": "Rue du Marché",
  "latitude": 6.13,
  "longitude": 1.22,
  "phoneNumber": "+228...",
  "photoURL": "...",
  "status": "APPROVED"
}
________________________________________
🔹 2.3 Valider commerçant (Admin)
PUT /api/admin/merchants/:id/approve 🔐 (ADMIN)
Réponse :
{ "message": "Commerçant approuvé" }
________________________________________
PUT /api/admin/merchants/:id/reject 🔐 (ADMIN)
Body :
{ "reason": "Informations incomplètes" }
________________________________________
🧺 3. GESTION DES PANIERS
🔹 3.1 Créer un panier
POST /api/baskets 🔐 (MERCHANT APPROVED)
Body :
{
  "title": "Panier viennoiseries",
  "description": "Croissants + pains au chocolat",
  "category": "SWEET",
  "originalPrice": 3000,
  "discountedPrice": 1200,
  "quantity": 10,
  "pickupTimeStart": "2025-02-10T17:00:00Z",
  "pickupTimeEnd": "2025-02-10T20:00:00Z",
  "photoURL": "https://cloudinary.com/img.jpg"
}
Réponse 201 :
{
  "message": "Panier créé",
  "basket": {
    "id": "uuid",
    "availableQuantity": 10,
    "status": "AVAILABLE"
  }
}
________________________________________
🔹 3.2 Lister les paniers (Public)
GET /api/baskets
Query Params :
?lat=6.13&lon=1.22&radius=10&category=SWEET&maxPrice=2000
Réponse :
[
  {
    "id": "uuid",
    "title": "Panier viennoiseries",
    "discountedPrice": 1200,
    "distanceKm": 1.2,
    "pickupTimeEnd": "2025-02-10T20:00:00Z",
    "merchant": {
      "businessName": "Boulangerie du Centre",
      "latitude": 6.13,
      "longitude": 1.22
    }
  }
]
________________________________________
🔹 3.3 Détail panier
GET /api/baskets/:id
Réponse :
{
  "id": "uuid",
  "title": "Panier viennoiseries",
  "description": "...",
  "category": "SWEET",
  "originalPrice": 3000,
  "discountedPrice": 1200,
  "quantity": 10,
  "availableQuantity": 4,
  "pickupTimeStart": "...",
  "pickupTimeEnd": "...",
  "photoURL": "...",
  "merchant": {
    "businessName": "Boulangerie du Centre",
    "address": "Rue du Marché",
    "latitude": 6.13,
    "longitude": 1.22
  }
}
________________________________________
🔹 3.4 Modifier panier
PUT /api/baskets/:id 🔐 (MERCHANT OWNER)
________________________________________
🔹 3.5 Supprimer panier
DELETE /api/baskets/:id 🔐 (MERCHANT OWNER / ADMIN)
________________________________________
🛒 4. COMMANDES & RÉSERVATIONS
________________________________________
🔹 4.1 Créer une commande
POST /api/orders 🔐 (CLIENT)
Body :
{
  "basketId": "uuid",
  "paymentMethod": "MTN_MOMO"
}
Réponse :
{
  "order": {
    "id": "uuid",
    "status": "PENDING",
    "qrCode": "qr_token_here",
    "amount": 1200
  },
  "paymentUrl": "https://flutterwave.com/pay/..."
}
________________________________________
🔹 4.2 Historique commandes client
GET /api/orders/my-orders 🔐
________________________________________
🔹 4.3 Commandes commerçant
GET /api/merchants/orders 🔐 (MERCHANT)
________________________________________
🔹 4.4 Détail commande
GET /api/orders/:id 🔐
________________________________________
🔹 4.5 Validation retrait (QR)
POST /api/orders/:id/pickup 🔐 (MERCHANT)
Body :
{
  "qrCode": "qr_token_here"
}
Réponse :
{ "message": "Commande validée" }
________________________________________
💳 5. PAIEMENT (Flutterwave)
________________________________________
🔹 5.1 Webhook Flutterwave
POST /api/payments/webhook
Headers :
verif-hash: flutterwave_signature_here
Body :
{
  "tx_ref": "ref123",
  "status": "successful",
  "amount": 1200
}
Réponse :
{ "message": "Webhook reçu" }
________________________________________
🖼️ 6. UPLOAD IMAGES
________________________________________
🔹 6.1 Upload image
POST /api/upload 🔐
Headers :
Content-Type: multipart/form-data
Body :
file: <image>
Réponse :
{
  "url": "https://cloudinary.com/image.jpg"
}
________________________________________
🔔 7. NOTIFICATIONS
________________________________________
🔹 7.1 Enregistrer token FCM
POST /api/auth/fcm-token 🔐
Body :
{
  "fcmToken": "firebase_token_here"
}
________________________________________
🔹 7.2 Notifications envoyées automatiquement
Événement	Notification
Paiement réussi	Confirmation
Panier proche publié	Alerte
Rappel retrait	Notification 1h avant
________________________________________
🔐 8. ADMINISTRATION
________________________________________
🔹 8.1 Statistiques admin
GET /api/admin/stats 🔐 (ADMIN)
________________________________________
⚠️ 9. CODES D’ERREUR STANDARD
Code	Signification
200	Succès
201	Créé
400	Requête invalide
401	Non authentifié
403	Accès interdit
404	Ressource introuvable
409	Conflit
500	Erreur serveur
________________________________________
🧠 10. RÈGLES MÉTIER IMPORTANTES
•	Un panier ne peut pas être réservé si availableQuantity = 0
•	Une commande non payée après 10 minutes est annulée automatiquement
•	Un QR code est à usage unique
•	Seul le commerçant propriétaire peut valider un retrait
•	Paiement CASH = validation immédiate sans Flutterwave
•	Un commerçant non approuvé ne peut pas publier de panier
________________________________________
Parfait — je te génère une ROADMAP SPRINT PAR SPRINT, claire, exploitable par ton équipe, et directement intégrable dans ton rapport ou Trello/Jira.
Basée sur ton planning officiel (20 semaines – Oct 2024 → Fév 2025).
________________________________________
🗺️ ROADMAP PRODUIT — PROJET DEVLIGHT
Application MealFlavor (Clone Too Good To Go)
________________________________________
🟦 PHASE 0 — INITIALISATION (Semaines 1–2)
🎯 Objectif : Poser toutes les bases techniques, fonctionnelles et organisationnelles.
🔹 Livrables attendus
•	Cahier des charges validé
•	Backlog produit structuré
•	Environnement de travail opérationnel
🧩 Tâches clés
•	Validation périmètre projet avec encadrant
•	Étude terrain (20 commerçants à Lomé)
•	Création repo GitHub + conventions commits
•	Mise en place Trello / Notion / Jira
•	Setup Figma + design system initial
•	Rédaction specs fonctionnelles & techniques
•	Création backlog initial (~40 user stories)
✅ Critères de validation
•	Backlog priorisé prêt pour Sprint 1
•	Architecture cible validée
•	Environnement technique fonctionnel
________________________________________
🟩 SPRINT 1 — ARCHITECTURE & AUTHENTIFICATION
📆 Semaines 3–5
🎯 Objectif : Mettre en place la base technique + gestion utilisateurs.
________________________________________
🧱 BACKEND
•	Setup Node.js + Express
•	Setup Prisma + PostgreSQL
•	Modèles : User, Merchant
•	Auth JWT : register / login / refresh token
•	Middleware auth & rôles
📱 FRONTEND
•	Setup Flutter (clean architecture)
•	Navigation + thème global
•	Écrans :
o	Splash
o	Login
o	Register
o	Forgot password
o	Profil utilisateur
🎨 UX/UI
•	Wireframes basse fidélité (15 écrans)
•	Parcours utilisateur principaux validés
📦 Livrables
•	Auth fonctionnelle backend + frontend
•	Architecture documentée
•	Wireframes validés
✅ Définition of Done (DoD)
•	Un utilisateur peut créer un compte et se connecter
•	JWT sécurisé et testé avec curl/Postman
•	Code versionné et documenté
________________________________________
🟨 SPRINT 2 — COMMERÇANTS & PANIERS
📆 Semaines 6–8
🎯 Objectif : Permettre aux commerçants de publier des paniers et aux clients de les consulter.
________________________________________
🧱 BACKEND
•	CRUD Merchant Profile
•	CRUD Basket
•	Filtres géolocalisés (Haversine)
•	Upload images (Cloudinary)
📱 FRONTEND
•	Écrans :
o	Création profil commerçant
o	Dashboard commerçant
o	Liste paniers
o	Détail panier
o	Carte commerces
🎨 UX/UI
•	Maquettes haute fidélité Figma
•	Design system validé
📦 Livrables
•	Publication de paniers fonctionnelle
•	Recherche géolocalisée opérationnelle
✅ DoD
•	Un commerçant peut publier un panier
•	Un client peut voir les paniers proches
•	Images uploadées via Cloudinary
________________________________________
🟧 SPRINT 3 — RÉSERVATION, QR & NOTIFICATIONS
📆 Semaines 9–11
🎯 Objectif : Permettre la réservation complète avec validation retrait.
________________________________________
🧱 BACKEND
•	Création Order
•	Gestion stock automatique
•	Génération QR code
•	Webhooks réservation
•	Firebase push notifications
📱 FRONTEND
•	Écrans :
o	Confirmation réservation
o	QR Code
o	Historique commandes client
o	Historique ventes commerçant
🔔 SERVICES
•	Firebase Cloud Messaging
•	Notification réservation réussie
•	Rappel avant expiration
📦 Livrables
•	Réservation temps réel complète
•	Validation retrait via QR
✅ DoD
•	Une commande bloque un stock
•	QR valide uniquement une fois
•	Notification envoyée automatiquement
________________________________________
🟥 SPRINT 4 — PAIEMENT MOBILE MONEY
📆 Semaines 12–14
🎯 Objectif : Permettre le paiement réel via Mobile Money.
________________________________________
🧱 BACKEND
•	Intégration Flutterwave API
•	Webhooks paiement
•	Gestion statuts paiement
•	Sécurisation transactions
📱 FRONTEND
•	Écrans :
o	Choix moyen de paiement
o	Paiement en cours
o	Paiement réussi / échec
🔐 SÉCURITÉ
•	Validation signatures webhook
•	Chiffrement données sensibles
📦 Livrables
•	Paiement Mobile Money fonctionnel
•	Historique transactions
✅ DoD
•	Paiement sandbox validé
•	Commande confirmée après paiement
•	Reçus générés automatiquement
________________________________________
🟪 SPRINT 5 — FONCTIONNALITÉS AVANCÉES & OPTIMISATION
📆 Semaines 15–17
🎯 Objectif : Stabiliser le produit et ajouter valeur business.
________________________________________
🧱 BACKEND
•	Système avis / notes
•	Statistiques commerçant
•	Optimisation requêtes
•	Cache Redis (optionnel)
📱 FRONTEND
•	Écrans :
o	Notation commerçant
o	Dashboard stats
o	Mode hors ligne partiel
⚡ PERFORMANCE
•	Lazy loading images
•	Réduction payload API
•	Optimisation Flutter builds
📦 Livrables
•	MVP complet et stable
✅ DoD
•	App fluide sur Android low-end
•	Aucun bug critique ouvert
•	Temps chargement < 2s
________________________________________
🟫 PHASE FINALE — DÉPLOIEMENT & DOCUMENTATION
📆 Semaines 18–20
🎯 Objectif : Mettre le produit en production académique.
________________________________________
🚀 BACKEND
•	Déploiement Railway / Render / Heroku
•	Variables d’environnement sécurisées
•	Monitoring basique
📱 MOBILE
•	Build APK/AAB
•	Publication Google Play (bêta)
📚 DOCS
•	Documentation API complète
•	Guide développeur
•	Guide utilisateur (client & commerçant)
🎤 SOUTENANCE
•	Slides présentation
•	Démo live
•	Vidéos tutoriels
📦 Livrables
•	Application déployée
•	Documentation complète
•	Soutenance prête
________________________________________
📊 ROADMAP SYNTHÈSE (TABLEAU)
Phase	Durée	Objectif
Phase 0	2 sem	Bases projet
Sprint 1	3 sem	Auth & architecture
Sprint 2	3 sem	Commerces & paniers
Sprint 3	3 sem	Réservation & QR
Sprint 4	3 sem	Paiement
Sprint 5	3 sem	Optimisation
Phase finale	3 sem	Déploiement
________________________________________

