# Habit Tracker

A full-stack habit tracking web application with user authentication, built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

- **User Authentication**: Secure signup/login with JWT tokens and bcrypt password hashing
- **Habit Management**: Create, delete, and track daily habits
- **Progress Visualization**: GitHub-style contribution graph showing habit completion patterns
- **Streak Tracking**: Current and longest streak calculation
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant feedback when marking habits complete

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Validation**: express-validator

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `DELETE /api/habits/:id` - Delete habit

### Habit Completions
- `GET /api/habits/completions` - Get user's habit completions
- `POST /api/habits/completions` - Mark habit as complete
- `DELETE /api/habits/completions` - Remove habit completion

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `created_at` - Account creation timestamp

### Habits Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `name` - Habit name
- `description` - Optional habit description
- `created_at` - Habit creation timestamp

### Habit Completions Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `habit_id` - Foreign key to habits table
- `completion_date` - Date habit was completed
- `created_at` - Completion record timestamp

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Input validation and sanitization
- CORS enabled for cross-origin requests
- SQL injection prevention with parameterized queries

## Usage

1. **Sign Up**: Create a new account with your name, email, and password
2. **Add Habits**: Click "Add New Habit" to create habits you want to track
3. **Track Daily**: Mark habits as complete each day on the Dashboard
4. **View Progress**: Check the Progress page for a visual overview of your consistency
5. **Analyze Streaks**: See your current and longest streaks for motivation

## Development

The application uses:
- SQLite database stored in `database/habits.db`
- JWT tokens for stateless authentication
- Express middleware for request validation
- Responsive CSS Grid for the progress visualization

## License

MIT