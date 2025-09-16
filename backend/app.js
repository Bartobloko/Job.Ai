const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const initializeRoutes = require('./utils/endpoints/routes');

initializeRoutes(app);

app.listen(port, () => {
    console.log(`Server started on ${port}`);
});