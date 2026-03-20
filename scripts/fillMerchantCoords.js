import dotenv from "dotenv";
import prisma from "../src/utils/prisma.js";

dotenv.config();

const DEFAULT_LAT = parseFloat(process.env.DEFAULT_MERCHANT_LAT || "6.1319");
const DEFAULT_LON = parseFloat(process.env.DEFAULT_MERCHANT_LON || "1.2228");
const JITTER_KM = parseFloat(process.env.DEFAULT_MERCHANT_JITTER_KM || "3");

const jitterDegrees = (km) => km / 111;

const randomOffset = () => {
  const max = jitterDegrees(JITTER_KM);
  return (Math.random() * 2 - 1) * max;
};

async function main() {
  console.log("Filling missing merchant coordinates...");

  const merchants = await prisma.merchant.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
    include: {
      user: true,
    },
  });

  if (merchants.length === 0) {
    console.log("All merchants already have coordinates.");
    return;
  }

  let updated = 0;

  for (const merchant of merchants) {
    let lat = merchant.latitude;
    let lon = merchant.longitude;

    if ((lat == null || lon == null) && merchant.user) {
      if (merchant.user.latitude != null && merchant.user.longitude != null) {
        lat = merchant.user.latitude;
        lon = merchant.user.longitude;
      }
    }

    if (lat == null || lon == null) {
      lat = (DEFAULT_LAT + randomOffset()).toFixed(6);
      lon = (DEFAULT_LON + randomOffset()).toFixed(6);
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        latitude: lat,
        longitude: lon,
      },
    });
    updated += 1;
  }

  console.log(`Updated ${updated} merchant(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
