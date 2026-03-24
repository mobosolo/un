import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import prismaPkg from "@prisma/client";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const { Role } = prismaPkg;

export const registerUser = async (email, password, displayName, phoneNumber, role) => {
  // Verifier si l'utilisateur existe deja
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error("Cet email est deja utilise.");
    err.statusCode = 409;
    throw err;
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Verifier et convertir le role fourni
  let userRole;
  if (role && Role[role.toUpperCase()]) {
    userRole = Role[role.toUpperCase()];
  } else {
    userRole = Role.CLIENT; // valeur par defaut
  }

  // Creer l'utilisateur
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

  // Generer le token JWT
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return { user, token };
};

export const loginUser = async (email, password) => {
  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Identifiants invalides.');
    err.statusCode = 401;
    throw err;
  }

  // Comparer le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const err = new Error('Identifiants invalides.');
    err.statusCode = 401;
    throw err;
  }

  // Generer le token JWT
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

export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    },
  });

  return { token: rawToken, expires };
};

export const resetPassword = async (email, token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await prisma.user.findFirst({
    where: {
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error("Token invalide ou expire.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return true;
};
