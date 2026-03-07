import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import { Role } from "@prisma/client"; // ✅ importer directement l'enum

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export const registerUser = async (email, password, displayName, phoneNumber, role) => {
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("Cet email est déjà utilisé.");
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Vérifier et convertir le rôle fourni
  let userRole;
  if (role && Role[role.toUpperCase()]) {
    userRole = Role[role.toUpperCase()];
  } else {
    userRole = Role.CLIENT; // ✅ valeur par défaut
  }

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      displayName,
      phoneNumber,
      role: userRole,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
    },
  });

  // Générer le token JWT
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return { user, token };
};

export const loginUser = async (email, password) => {
  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Identifiants invalides.');
  }

  // Comparer le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Identifiants invalides.');
  }

  // Générer le token JWT
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Retourne l'utilisateur avec les champs pertinents
  const userResponse = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };

  return { user: userResponse, token };
};
