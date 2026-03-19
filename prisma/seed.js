import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";
import prisma from "../src/utils/prisma.js";

const {
  BasketStatus,
  Category,
  MerchantStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} = prismaPkg;

async function main() {
  console.log("Seeding database...");

  await prisma.notification.deleteMany();
  await prisma.order.deleteMany();
  await prisma.basket.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@mealflavor.com",
      password: defaultPassword,
      displayName: "Admin MealFlavor",
      role: Role.ADMIN,
    },
  });

  const merchantUser1 = await prisma.user.create({
    data: {
      email: "merchant1@mealflavor.com",
      password: defaultPassword,
      displayName: "Boulangerie Soleil",
      phoneNumber: "+22890000001",
      role: Role.MERCHANT,
      latitude: "6.137500",
      longitude: "1.212300",
    },
  });

  const merchantUser2 = await prisma.user.create({
    data: {
      email: "merchant2@mealflavor.com",
      password: defaultPassword,
      displayName: "Restaurant Saveurs",
      phoneNumber: "+22890000002",
      role: Role.MERCHANT,
      latitude: "6.140100",
      longitude: "1.220500",
    },
  });

  const merchantUser3 = await prisma.user.create({
    data: {
      email: "merchant3@mealflavor.com",
      password: defaultPassword,
      displayName: "Epicerie Quartier",
      phoneNumber: "+22890000003",
      role: Role.MERCHANT,
      latitude: "6.129900",
      longitude: "1.209900",
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: "client1@mealflavor.com",
      password: defaultPassword,
      displayName: "Client Alpha",
      phoneNumber: "+22890111111",
      role: Role.CLIENT,
      latitude: "6.131900",
      longitude: "1.222800",
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: "client2@mealflavor.com",
      password: defaultPassword,
      displayName: "Client Beta",
      phoneNumber: "+22890222222",
      role: Role.CLIENT,
      latitude: "6.133200",
      longitude: "1.218600",
    },
  });

  const merchant1 = await prisma.merchant.create({
    data: {
      userId: merchantUser1.id,
      businessName: "Boulangerie Soleil",
      type: "BAKERY",
      address: "Rue du Marche, Lome",
      latitude: "6.137500",
      longitude: "1.212300",
      phoneNumber: "+22890000001",
      photoURL: "https://picsum.photos/seed/merchant1/600/400",
      status: MerchantStatus.APPROVED,
    },
  });

  const merchant2 = await prisma.merchant.create({
    data: {
      userId: merchantUser2.id,
      businessName: "Restaurant Saveurs",
      type: "RESTAURANT",
      address: "Avenue de la Paix, Lome",
      latitude: "6.140100",
      longitude: "1.220500",
      phoneNumber: "+22890000002",
      photoURL: "https://picsum.photos/seed/merchant2/600/400",
      status: MerchantStatus.APPROVED,
    },
  });

  const merchant3 = await prisma.merchant.create({
    data: {
      userId: merchantUser3.id,
      businessName: "Epicerie Quartier",
      type: "GROCERY",
      address: "Boulevard du 13 Janvier, Lome",
      latitude: "6.129900",
      longitude: "1.209900",
      phoneNumber: "+22890000003",
      photoURL: "https://picsum.photos/seed/merchant3/600/400",
      status: MerchantStatus.PENDING,
    },
  });

  const now = new Date();
  const plus2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const plus4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const plus5h = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const plus7h = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const minus26h = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const minus23h = new Date(now.getTime() - 23 * 60 * 60 * 1000);

  const basket1 = await prisma.basket.create({
    data: {
      merchantId: merchant1.id,
      title: "Panier viennoiseries du soir",
      description: "Croissants, pains au chocolat et pains speciaux",
      category: Category.SWEET,
      originalPrice: 3000,
      discountedPrice: 1200,
      quantity: 10,
      availableQuantity: 8,
      pickupTimeStart: plus2h,
      pickupTimeEnd: plus4h,
      photoURL: "https://picsum.photos/seed/basket1/800/500",
      status: BasketStatus.AVAILABLE,
    },
  });

  const basket2 = await prisma.basket.create({
    data: {
      merchantId: merchant2.id,
      title: "Panier repas midi",
      description: "Riz, sauce et accompagnements",
      category: Category.SAVORY,
      originalPrice: 4500,
      discountedPrice: 1800,
      quantity: 7,
      availableQuantity: 4,
      pickupTimeStart: plus5h,
      pickupTimeEnd: plus7h,
      photoURL: "https://picsum.photos/seed/basket2/800/500",
      status: BasketStatus.AVAILABLE,
    },
  });

  const basket3 = await prisma.basket.create({
    data: {
      merchantId: merchant1.id,
      title: "Panier mixte d hier",
      description: "Produits invendus de la veille",
      category: Category.MIXED,
      originalPrice: 3500,
      discountedPrice: 1400,
      quantity: 5,
      availableQuantity: 0,
      pickupTimeStart: minus26h,
      pickupTimeEnd: minus23h,
      photoURL: "https://picsum.photos/seed/basket3/800/500",
      status: BasketStatus.SOLD_OUT,
    },
  });

  const order1 = await prisma.order.create({
    data: {
      userId: client1.id,
      basketId: basket1.id,
      merchantId: merchant1.id,
      price: basket1.discountedPrice,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.RESERVED,
      qrCode: `qr_${Date.now()}_1`,
      transactionRef: `cash_ref_${Date.now()}_1`,
      paidAt: now,
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: client2.id,
      basketId: basket2.id,
      merchantId: merchant2.id,
      price: basket2.discountedPrice,
      paymentMethod: PaymentMethod.FLOOZ,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.RESERVED,
      qrCode: `qr_${Date.now()}_2`,
      transactionRef: `flw_ref_${Date.now()}_2`,
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: client1.id,
      basketId: basket3.id,
      merchantId: merchant1.id,
      price: basket3.discountedPrice,
      paymentMethod: PaymentMethod.TMONEY,
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.PICKED_UP,
      qrCode: `qr_${Date.now()}_3`,
      transactionRef: `tm_ref_${Date.now()}_3`,
      paidAt: minus23h,
      pickedUpAt: minus23h,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: client1.id,
        title: "Reservation confirmee",
        body: "Votre commande est reservee. Montrez votre QR code au retrait.",
        type: "ORDER_CONFIRMED",
        data: { orderId: order1.id, basketId: basket1.id },
        isRead: false,
      },
      {
        userId: merchantUser1.id,
        title: "Nouvelle commande",
        body: "Une nouvelle reservation a ete effectuee sur votre panier.",
        type: "NEW_ORDER",
        data: { orderId: order1.id, basketId: basket1.id },
        isRead: false,
      },
      {
        userId: client2.id,
        title: "Paiement en attente",
        body: "Finalisez votre paiement pour confirmer la commande.",
        type: "PAYMENT_PENDING",
        data: { orderId: order2.id, basketId: basket2.id },
        isRead: false,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Default password for all seeded users: password123");
  console.log(`Admin: ${admin.email}`);
  console.log(`Merchants: ${merchantUser1.email}, ${merchantUser2.email}, ${merchantUser3.email}`);
  console.log(`Clients: ${client1.email}, ${client2.email}`);
  console.log(`Created merchants: ${merchant1.id}, ${merchant2.id}, ${merchant3.id}`);
  console.log(`Created baskets: ${basket1.id}, ${basket2.id}, ${basket3.id}`);
  console.log(`Created orders: ${order1.id}, ${order2.id}, ${order3.id}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
