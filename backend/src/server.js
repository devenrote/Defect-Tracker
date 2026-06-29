require('dotenv').config();
const app = require('./app');
const db = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  try {
    await db.query('SELECT 1');
    const server = app.listen(PORT, () => {
      console.log(`Defect Tracker Pro API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the process using this port or set a different PORT environment variable.`);
        process.exit(1);
      }

      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error.message || error);
    process.exit(1);
  }
};

startServer();
