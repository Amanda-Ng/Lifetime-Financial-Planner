// TP: Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/jwt');
const configs = require('../configs/config.js');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user in the database
    const user = await User.findOne({ username });

    if (user) {
      return res.status(401).json({ error: 'User already registered!' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user in the database
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create and send JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'secretKey'
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google authentication route
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback route
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, send a token
    const token = jwt.sign(
      { userId: req.user._id, username: req.user.username },
      'secretKey'
    );
    res.redirect(
      `${configs.googleAuthClientSuccessURL}/success?token=${token}`
    );
  }
);

// Success route
router.get('/success', (req, res) => {
  const { token } = req.query;
  // Render a success page or send a response with the token
  res.json({ message: 'Authentication successful', token });
});

// Protected Route
router.get('/isAuthenticated', verifyToken, (req, res) => {
  res.status(200).json({
    message: 'This is a protected endpoint',
    user: req.user,
  });
});

module.exports = router;