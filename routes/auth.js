const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
          [name, email, hashedPassword], 
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            const user = { id: this.lastID, name, email };
            const token = generateToken(user);

            res.status(201).json({
              message: 'User created successfully',
              user: { id: user.id, name: user.name, email: user.email },
              token
            });
          }
        );
      } catch (hashError) {
        res.status(500).json({ error: 'Failed to process password' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      try {
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);

        res.json({
          message: 'Login successful',
          user: { id: user.id, name: user.name, email: user.email },
          token
        });
      } catch (compareError) {
        res.status(500).json({ error: 'Authentication failed' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;