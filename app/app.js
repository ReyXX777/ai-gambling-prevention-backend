const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const sequelize = require('./config/db');
const resourceRouter = require('./routes/resourceRoutes');
const alertRouter = require('./routes/alertRoutes');
const contactRouter = require('./routes/contactRoutes');
const userRouter = require('./routes/userRoutes');
const achievementRouter = require('./routes/achievementRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');
const paymentRouter = require('./routes/paymentRoutes'); // Added new component
const supportRouter = require('./routes/supportRoutes'); // Added new component


const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/users', userRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/payments', paymentRouter); // Added new route
app.use('/api/support', supportRouter); // Added new route

// Root Route
app.get('/', (req, res) => {
  res.send('AI-Driven Cybersecurity Tool for Gambling Disorder Prevention');
});

// Error Handling Middleware
app.use(errorHandler);

// Database Sync
sequelize
  .sync({ force: false }) // Change `true` to `false` for production
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
