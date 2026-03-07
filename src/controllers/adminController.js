// src/controllers/adminController.js
import { approveMerchant, rejectMerchant } from '../services/merchantService.js';
import { getAdminStats as fetchAdminStats } from '../services/adminService.js';

export const approve = async (req, res) => {
  const { id } = req.params;

  try {
    await approveMerchant(id);
    res.status(200).json({ message: 'Commerçant approuvé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'approbation du commerçant.', error: error.message });
  }
};

export const reject = async (req, res) => {
  const { id } = req.params;

  try {
    await rejectMerchant(id);
    res.status(200).json({ message: 'Commerçant rejeté' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du rejet du commerçant.', error: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const stats = await fetchAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.', error: error.message });
  }
};

