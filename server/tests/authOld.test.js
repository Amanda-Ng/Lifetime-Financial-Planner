// TP Copilot prompt: "Create a test for the auth API endpoints"

const request = require('supertest');
const app = require('../server'); // Import your Express app
const User = require('../models/User'); // Import your User model
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  // Start an in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // Disconnect and stop the in-memory database
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear the database after each test
  await User.deleteMany({});
});

// describe('Auth API', () => {
//   describe('POST /signup', () => {
//     it('should create a new user', async () => {
//       const response = await request(app)
//         .post('/auth/signup')
//         .send({ username: 'testuser', password: 'password123' });

//       expect(response.status).toBe(201);
//       expect(response.body.message).toBe('User created successfully');

//       const user = await User.findOne({ username: 'testuser' });
//       expect(user).not.toBeNull();
//     });

//     it('should return an error if the user already exists', async () => {
//       await User.create({ username: 'testuser', password: 'password123' });

//       const response = await request(app)
//         .post('/auth/signup')
//         .send({ username: 'testuser', password: 'password123' });

//       expect(response.status).toBe(401);
//       expect(response.body.error).toBe('User already registered!');
//     });
//   });

//   describe('POST /login', () => {
//     it('should log in an existing user and return a token', async () => {
//       const hashedPassword = await bcrypt.hash('password123', 10);
//       await User.create({ username: 'testuser', password: hashedPassword });

//       const response = await request(app)
//         .post('/auth/login')
//         .send({ username: 'testuser', password: 'password123' });

//       expect(response.status).toBe(200);
//       expect(response.body.token).toBeDefined();
//     });

//     it('should return an error for invalid credentials', async () => {
//       const response = await request(app)
//         .post('/auth/login')
//         .send({ username: 'nonexistentuser', password: 'wrongpassword' });

//       expect(response.status).toBe(401);
//       expect(response.body.error).toBe('Invalid username or password');
//     });
//   });

  describe('GET /auth/isAuthenticated', () => {
    it('should return user details if authenticated', async () => {
      const user = await User.create({ username: 'testuser', password: 'password123' });

      const response = await request(app)
        .get('/auth/isAuthenticated')
        .set('Authorization', `Bearer mocked-token`);

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe(user.username);
    });

    it('should return an error if not authenticated', async () => {
      const response = await request(app).get('/auth/isAuthenticated');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /auth/updateAge', () => {
    it('should update the user age', async () => {
      const user = await User.create({ username: 'testuser', password: 'password123', age: 25 });

      const response = await request(app)
        .post('/auth/updateAge')
        .set('Authorization', `Bearer mocked-token`)
        .send({ age: 30 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Age updated successfully');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.age).toBe(30);
    });

    it('should return an error if age is invalid', async () => {
      await User.create({ username: 'testuser', password: 'password123', age: 25 });

      const response = await request(app)
        .post('/auth/updateAge')
        .set('Authorization', `Bearer mocked-token`)
        .send({ age: -5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid age');
    });
  });