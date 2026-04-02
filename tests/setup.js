const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_jwt_secret";
  process.env.JWT_EXPIRES_IN = "1d";
  process.env.ADMIN_EMAIL = "ravinerusu1@gmail.com";
  process.env.ADMIN_NAME = "System Administrator";
  process.env.ADMIN_PASSWORD = "TestAdmin123!";

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  // Reset all collections between tests for predictable assertions.
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
