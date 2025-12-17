const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10000, // 10 seconds max wait to acquire a transaction
    timeout: 30000, // 30 seconds transaction timeout
  },
});

module.exports = prisma;
