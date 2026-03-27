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

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

const RETRY_DELAY_MS = 400;
const MAX_RETRIES = 4;

const isConnectionClosedError = (err) => {
  if (!err) return false;
  if (err.code === "P1017") return true;
  const msg = String(err.message || "");
  if (msg.toLowerCase().includes("closed the connection")) return true;
  const adapterMsg = String(err?.meta?.driverAdapterError?.message || "");
  return adapterMsg.toLowerCase().includes("connectionclosed");
};

async function withRetry(fn, label) {
  let attempt = 0;
  // Retry transient DB connection closures (e.g. pooled Neon connections).
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (!isConnectionClosedError(err) || attempt > MAX_RETRIES) {
        throw err;
      }
      console.warn(`${label} failed (connection closed). Retrying ${attempt}/${MAX_RETRIES}...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
}

async function upsertUser(user) {
  return withRetry(
    () =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          latitude: user.latitude,
          longitude: user.longitude,
        },
        create: user,
      }),
    `upsertUser:${user.email}`
  );
}

async function main() {
  console.log("Seeding database with realistic data...");
  await prisma.$connect();

  const defaultPassword = await bcrypt.hash("password123", 12);

  const users = [
    {
      email: "admin@mealflavor.com",
      password: defaultPassword,
      displayName: "Admin MealFlavor",
      role: Role.ADMIN,
    },
    {
      email: "merchant1@mealflavor.com",
      password: defaultPassword,
      displayName: "Boulangerie Soleil",
      phoneNumber: "+22890000001",
      role: Role.MERCHANT,
      latitude: "6.137500",
      longitude: "1.212300",
    },
    {
      email: "merchant2@mealflavor.com",
      password: defaultPassword,
      displayName: "Restaurant Saveurs",
      phoneNumber: "+22890000002",
      role: Role.MERCHANT,
      latitude: "6.140100",
      longitude: "1.220500",
    },
    {
      email: "merchant3@mealflavor.com",
      password: defaultPassword,
      displayName: "Epicerie Quartier",
      phoneNumber: "+22890000003",
      role: Role.MERCHANT,
      latitude: "6.129900",
      longitude: "1.209900",
    },
    {
      email: "merchant4@mealflavor.com",
      password: defaultPassword,
      displayName: "Traiteur Moderne",
      phoneNumber: "+22890000004",
      role: Role.MERCHANT,
      latitude: "6.132800",
      longitude: "1.225100",
    },
    {
      email: "merchant5@mealflavor.com",
      password: defaultPassword,
      displayName: "Fruits et Legumes",
      phoneNumber: "+22890000005",
      role: Role.MERCHANT,
      latitude: "6.128400",
      longitude: "1.218200",
    },
    {
      email: "client1@mealflavor.com",
      password: defaultPassword,
      displayName: "Client Alpha",
      phoneNumber: "+22890111111",
      role: Role.CLIENT,
      latitude: "6.131900",
      longitude: "1.222800",
    },
    {
      email: "client2@mealflavor.com",
      password: defaultPassword,
      displayName: "Client Beta",
      phoneNumber: "+22890222222",
      role: Role.CLIENT,
      latitude: "6.133200",
      longitude: "1.218600",
    },
    {
      email: "client3@mealflavor.com",
      password: defaultPassword,
      displayName: "Client Gamma",
      phoneNumber: "+22890333333",
      role: Role.CLIENT,
      latitude: "6.135000",
      longitude: "1.214900",
    },
  ];

  const createdUsers = [];
  for (const user of users) {
    createdUsers.push(await upsertUser(user));
  }
  const userByEmail = Object.fromEntries(createdUsers.map((u) => [u.email, u]));

  const merchants = [
    {
      userEmail: "merchant1@mealflavor.com",
      businessName: "Boulangerie Soleil",
      type: "BAKERY",
      address: "Rue du Marche, Lome",
      latitude: "6.137500",
      longitude: "1.212300",
      phoneNumber: "+22890000001",
      photoURL: "https://picsum.photos/seed/merchant1/600/400",
    },
    {
      userEmail: "merchant2@mealflavor.com",
      businessName: "Restaurant Saveurs",
      type: "RESTAURANT",
      address: "Avenue de la Paix, Lome",
      latitude: "6.140100",
      longitude: "1.220500",
      phoneNumber: "+22890000002",
      photoURL: "https://picsum.photos/seed/merchant2/600/400",
    },
    {
      userEmail: "merchant3@mealflavor.com",
      businessName: "Epicerie Quartier",
      type: "GROCERY",
      address: "Boulevard du 13 Janvier, Lome",
      latitude: "6.129900",
      longitude: "1.209900",
      phoneNumber: "+22890000003",
      photoURL: "https://picsum.photos/seed/merchant3/600/400",
    },
    {
      userEmail: "merchant4@mealflavor.com",
      businessName: "Traiteur Moderne",
      type: "CATERING",
      address: "Rue des Ecoles, Lome",
      latitude: "6.132800",
      longitude: "1.225100",
      phoneNumber: "+22890000004",
      photoURL: "https://picsum.photos/seed/merchant4/600/400",
    },
    {
      userEmail: "merchant5@mealflavor.com",
      businessName: "Fruits et Legumes",
      type: "GROCERY",
      address: "Quartier Agoe, Lome",
      latitude: "6.128400",
      longitude: "1.218200",
      phoneNumber: "+22890000005",
      photoURL: "https://picsum.photos/seed/merchant5/600/400",
    },
  ];

  const createdMerchants = [];

  for (const m of merchants) {
    const user = userByEmail[m.userEmail];
    const merchant = await withRetry(
      () =>
        prisma.merchant.upsert({
          where: { userId: user.id },
          update: {
            businessName: m.businessName,
            type: m.type,
            address: m.address,
            latitude: m.latitude,
            longitude: m.longitude,
            phoneNumber: m.phoneNumber,
            photoURL: m.photoURL,
            status: MerchantStatus.APPROVED,
          },
          create: {
            userId: user.id,
            businessName: m.businessName,
            type: m.type,
            address: m.address,
            latitude: m.latitude,
            longitude: m.longitude,
            phoneNumber: m.phoneNumber,
            photoURL: m.photoURL,
            status: MerchantStatus.APPROVED,
          },
        }),
      `upsertMerchant:${m.userEmail}`
    );
    createdMerchants.push(merchant);
  }

  const merchantIds = createdMerchants.map((m) => m.id);
  await withRetry(
    () =>
      prisma.notification.deleteMany({
        where: { userId: { in: createdUsers.map((u) => u.id) } },
      }),
    "deleteNotifications"
  );
  await withRetry(
    () => prisma.basket.deleteMany({ where: { merchantId: { in: merchantIds } } }),
    "deleteBaskets"
  );

  const basketData = [
    {
      merchantEmail: "merchant1@mealflavor.com",
      title: "Panier viennoiseries du soir",
      description: "Croissants, pains au chocolat et pains speciaux",
      category: Category.SWEET,
      originalPrice: 3000,
      discountedPrice: 1200,
      quantity: 10,
      availableQuantity: 8,
      pickupTimeStart: hoursFromNow(2),
      pickupTimeEnd: hoursFromNow(4),
      photoURL: "https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: BasketStatus.AVAILABLE,
    },
    {
      merchantEmail: "merchant2@mealflavor.com",
      title: "Panier repas midi",
      description: "Riz, sauce et accompagnements",
      category: Category.SAVORY,
      originalPrice: 4500,
      discountedPrice: 1800,
      quantity: 7,
      availableQuantity: 4,
      pickupTimeStart: hoursFromNow(5),
      pickupTimeEnd: hoursFromNow(7),
      photoURL: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: BasketStatus.AVAILABLE,
    },
    {
      merchantEmail: "merchant3@mealflavor.com",
      title: "Panier mixte du matin",
      description: "Fruits, legumes et pain frais",
      category: Category.MIXED,
      originalPrice: 3500,
      discountedPrice: 1500,
      quantity: 6,
      availableQuantity: 6,
      pickupTimeStart: hoursFromNow(1),
      pickupTimeEnd: hoursFromNow(3),
      photoURL: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: BasketStatus.AVAILABLE,
    },
    {
      merchantEmail: "merchant4@mealflavor.com",
      title: "Panier traiteur soir",
      description: "Poulet roti, legumes sautes, riz",
      category: Category.SAVORY,
      originalPrice: 6000,
      discountedPrice: 2500,
      quantity: 5,
      availableQuantity: 2,
      pickupTimeStart: hoursFromNow(6),
      pickupTimeEnd: hoursFromNow(8),
      photoURL: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=749&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: BasketStatus.AVAILABLE,
    },
    {
      merchantEmail: "merchant5@mealflavor.com",
      title: "Panier fruits et legumes",
      description: "Pommes, bananes, tomates, carottes",
      category: Category.MIXED,
      originalPrice: 4000,
      discountedPrice: 1600,
      quantity: 8,
      availableQuantity: 8,
      pickupTimeStart: hoursFromNow(3),
      pickupTimeEnd: hoursFromNow(5),
      photoURL: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: BasketStatus.AVAILABLE,
    },
    {
      merchantEmail: "merchant1@mealflavor.com",
      title: "Panier mixte d hier",
      description: "Produits invendus de la veille",
      category: Category.MIXED,
      originalPrice: 3500,
      discountedPrice: 1400,
      quantity: 5,
      availableQuantity: 0,
      pickupTimeStart: hoursAgo(26),
      pickupTimeEnd: hoursAgo(23),
      photoURL: "https://plus.unsplash.com/premium_photo-1663858367001-89e5c92d1e0e?q=80&w=715&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: BasketStatus.SOLD_OUT,
    },
  ];

  const baskets = [];
  for (const b of basketData) {
    const merchant = createdMerchants.find((m) => m.userId === userByEmail[b.merchantEmail].id);
    const basket = await withRetry(
      () =>
        prisma.basket.create({
          data: {
            merchantId: merchant.id,
            title: b.title,
            description: b.description,
            category: b.category,
            originalPrice: b.originalPrice,
            discountedPrice: b.discountedPrice,
            quantity: b.quantity,
            availableQuantity: b.availableQuantity,
            pickupTimeStart: b.pickupTimeStart,
            pickupTimeEnd: b.pickupTimeEnd,
            photoURL: b.photoURL,
            status: b.status,
          },
        }),
      `createBasket:${b.title}`
    );
    baskets.push(basket);
  }

  const client1 = userByEmail["client1@mealflavor.com"];
  const client2 = userByEmail["client2@mealflavor.com"];

  await withRetry(
    () =>
      prisma.order.create({
        data: {
          userId: client1.id,
          basketId: baskets[0].id,
          merchantId: baskets[0].merchantId,
          price: baskets[0].discountedPrice,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.RESERVED,
          qrCode: `qr_${Date.now()}_1`,
          transactionRef: `cash_ref_${Date.now()}_1`,
          paidAt: new Date(),
        },
      }),
    "createOrder:client1"
  );

  await withRetry(
    () =>
      prisma.order.create({
        data: {
          userId: client2.id,
          basketId: baskets[1].id,
          merchantId: baskets[1].merchantId,
          price: baskets[1].discountedPrice,
          paymentMethod: PaymentMethod.FLOOZ,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.RESERVED,
          qrCode: `qr_${Date.now()}_2`,
          transactionRef: `flw_ref_${Date.now()}_2`,
        },
      }),
    "createOrder:client2"
  );

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
