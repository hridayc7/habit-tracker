const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, habits) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch habits' });
    }
    res.json(habits);
  });
});

router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Habit name is required'),
  body('description').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  const userId = req.user.id;

  db.run('INSERT INTO habits (user_id, name, description) VALUES (?, ?, ?)', 
    [userId, name, description || ''], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create habit' });
      }

      db.get('SELECT * FROM habits WHERE id = ?', [this.lastID], (err, habit) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve created habit' });
        }
        res.status(201).json(habit);
      });
    }
  );
});

router.delete('/:id', (req, res) => {
  const habitId = req.params.id;
  const userId = req.user.id;

  db.get('SELECT id FROM habits WHERE id = ? AND user_id = ?', [habitId, userId], (err, habit) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    db.run('DELETE FROM habits WHERE id = ? AND user_id = ?', [habitId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete habit' });
      }
      res.json({ message: 'Habit deleted successfully' });
    });
  });
});

router.get('/completions', (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT hc.*, h.name as habit_name 
    FROM habit_completions hc 
    JOIN habits h ON hc.habit_id = h.id 
    WHERE hc.user_id = ?
    ORDER BY hc.completion_date DESC
  `, [userId], (err, completions) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch completions' });
    }
    res.json(completions);
  });
});

router.post('/completions', [
  body('habit_id').isInt().withMessage('Valid habit ID is required'),
  body('completion_date').isDate().withMessage('Valid date is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { habit_id, completion_date } = req.body;
  const userId = req.user.id;

  db.get('SELECT id FROM habits WHERE id = ? AND user_id = ?', [habit_id, userId], (err, habit) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    db.run('INSERT OR REPLACE INTO habit_completions (user_id, habit_id, completion_date) VALUES (?, ?, ?)', 
      [userId, habit_id, completion_date], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to record completion' });
        }
        
        res.status(201).json({
          id: this.lastID,
          user_id: userId,
          habit_id,
          completion_date,
          message: 'Completion recorded successfully'
        });
      }
    );
  });
});

router.delete('/completions', [
  body('habit_id').isInt().withMessage('Valid habit ID is required'),
  body('completion_date').isDate().withMessage('Valid date is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { habit_id, completion_date } = req.body;
  const userId = req.user.id;

  db.run('DELETE FROM habit_completions WHERE user_id = ? AND habit_id = ? AND completion_date = ?', 
    [userId, habit_id, completion_date], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove completion' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Completion not found' });
      }
      
      res.json({ message: 'Completion removed successfully' });
    }
  );
});

module.exports = router;