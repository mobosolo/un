import prisma from '../utils/prisma.js';

export const getAdminStats = async () => {
  const totalUsers = await prisma.user.count();
  const totalMerchants = await prisma.merchant.count();
  const pendingMerchants = await prisma.merchant.count({
    where: { status: 'PENDING' },
  });
  const approvedMerchants = await prisma.merchant.count({
    where: { status: 'APPROVED' },
  });
  const totalBaskets = await prisma.basket.count();
  const availableBaskets = await prisma.basket.count({
    where: { status: 'AVAILABLE' },
  });
  const totalOrders = await prisma.order.count();
  const pendingOrders = await prisma.order.count({
    where: { paymentStatus: 'PENDING' },
  });
  const paidOrders = await prisma.order.count({
    where: { paymentStatus: 'PAID' },
  });
  const pickedUpOrders = await prisma.order.count({
    where: { orderStatus: 'PICKED_UP' },
  });

  return {
    users: {
      total: totalUsers,
    },
    merchants: {
      total: totalMerchants,
      pending: pendingMerchants,
      approved: approvedMerchants,
    },
    baskets: {
      total: totalBaskets,
      available: availableBaskets,
    },
    orders: {
      total: totalOrders,
      pendingPayment: pendingOrders,
      paid: paidOrders,
      pickedUp: pickedUpOrders,
    },
  };
};
