import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_offers',
  port: parseInt(process.env.DB_PORT || '3306')
};

const connection = mysql.createConnection(config);

// Export the connection
export { connection };
export default connection;