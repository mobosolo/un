// src/controllers/adminController.js
import { approveMerchant, rejectMerchant } from '../services/merchantService.js';
import { getAdminStats as fetchAdminStats, listMerchants, listUsers } from '../services/adminService.js';

export const approve = async (req, res) => {
  const { id } = req.params;

  try {
    await approveMerchant(id);
    res.status(200).json({ message: 'Commercant approuve' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : "Erreur lors de l'approbation du commercant.";
    res.status(status).json({ message });
  }
};

export const reject = async (req, res) => {
  const { id } = req.params;

  try {
    await rejectMerchant(id);
    res.status(200).json({ message: 'Commercant rejete' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors du rejet du commercant.';
    res.status(status).json({ message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const stats = await fetchAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des statistiques.';
    res.status(status).json({ message });
  }
};

export const getMerchants = async (req, res) => {
  const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  const allowed = new Set(['PENDING', 'APPROVED', 'REJECTED']);

  if (status && !allowed.has(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  try {
    const merchants = await listMerchants({ status });
    res.status(200).json(merchants);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des commercants.';
    res.status(status).json({ message });
  }
};

export const getUsers = async (req, res) => {
  const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;
  const allowed = new Set(['CLIENT', 'MERCHANT', 'ADMIN']);

  if (role && !allowed.has(role)) {
    return res.status(400).json({ message: 'Role invalide.' });
  }

  try {
    const users = await listUsers({ role });
    res.status(200).json(users);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des utilisateurs.';
    res.status(status).json({ message });
  }
};
