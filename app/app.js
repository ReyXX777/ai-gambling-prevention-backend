const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const sequelize = require('./config/database');
const Alert = require('./models/alert');
const resourceRouter = require('./controllers/resourceController');
const alertRouter = require('./controllers/alertController');
const contactRouter = require('./controllers/contactController');
const userRouter = require('./controllers/userController');
const achievementRouter = require('./controllers/achievementController');

const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', resourceRouter);
app.use('/api', alertRouter);
app.use('/api', contactRouter);
app.use('/api/users', userRouter);
app.use('/api', achievementRouter);

// Error Handling Middleware
app.use(errorHandler);

// Database Sync
sequelize.sync({ force: true }).then(() => {
  console.log('Database & tables created!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Root Route
app.get('/', (req, res) => {
  res.send('AI-Driven Cybersecurity Tool for Gambling Disorder Prevention');
});
