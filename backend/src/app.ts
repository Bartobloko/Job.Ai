import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Import and initialize routes
import initializeRoutes from './utils/endpoints/routes';
initializeRoutes(app);

app.listen(port, () => {
  console.log(`Server started on ${port}`);
});