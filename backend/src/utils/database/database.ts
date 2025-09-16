import mysql from 'mysql2';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

const config: DatabaseConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'job_offers'
};

const connection = mysql.createConnection(config);

// Export the connection
export { connection };
export default connection;