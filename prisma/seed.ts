import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alphaPC = await prisma.node.create({
    data: {
      name: 'AlphaPC',
      properties: {
        create: [
          { key: 'Height', value: 450.0 },
          { key: 'Width', value: 180.0 },
        ],
      },
    },
  });

  const processing = await prisma.node.create({
    data: {
      name: 'Processing',
      parentId: alphaPC.id,
    },
  });

  await prisma.node.create({
    data: {
      name: 'CPU',
      parentId: processing.id,
      properties: {
        create: [
          { key: 'Cores', value: 4 },
          { key: 'Power', value: 2.41 },
        ],
      },
    },
  });

  await prisma.node.create({
    data: {
      name: 'Graphics',
      parentId: processing.id,
      properties: {
        create: [
          { key: 'RAM', value: 4000.0 },
          { key: 'Ports', value: 8.0 },
        ],
      },
    },
  });

  await prisma.node.create({
    data: {
      name: 'RAM',
      parentId: processing.id,
      properties: {
        create: [{ key: 'RAM', value: 32000.0 }],
      },
    },
  });

  const storage = await prisma.node.create({
    data: {
      name: 'Storage',
      parentId: alphaPC.id,
    },
  });

  await prisma.node.create({
    data: {
      name: 'SSD',
      parentId: storage.id,
      properties: {
        create: [
          { key: 'Capacity', value: 1024.0 },
          { key: 'WriteSpeed', value: 250.0 },
        ],
      },
    },
  });

  await prisma.node.create({
    data: {
      name: 'HDD',
      parentId: storage.id,
      properties: {
        create: [
          { key: 'Capacity', value: 5120.0 },
          { key: 'WriteSpeed', value: 1.724752 },
        ],
      },
    },
  });
}

main()
  .then(() => {
    console.log('Seeding complete!');
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
