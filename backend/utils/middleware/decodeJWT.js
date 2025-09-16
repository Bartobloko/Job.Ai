const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // Replace with your secret key

const decodeJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.status(401).json({ error: "Invalid or expired token" });
            }
            req.user = user;
            next(); // Proceed to the next middleware or route handler
        });
    } else {
        return res.status(401).json({ error: "Token required" });
    }
};

module.exports = decodeJWT;