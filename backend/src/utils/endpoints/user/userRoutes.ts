import express, { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { connection } from '../../database/database';
import decodeJWT from '../../middleware/decodeJWT';
import { Account, DatabaseResult, AuthenticatedRequest } from '../../../types';

const router = express.Router();
const secretKey = 'your_secret_key'; // Replace with your secret key

// CREATE: Add a new account
router.post('/', (req: Request, res: Response): void => {
  const { username }: { username: string } = req.body;

  // Validate input
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  // Start database transaction
  connection.beginTransaction(err => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const sqlInsertAccount = "INSERT INTO accounts (username) VALUES (?)";
    connection.query(sqlInsertAccount, [username], (err: any, result: any) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({ error: err.message });
        });
      }

      const accountId = result.insertId;

      // Insert into account_settings
      const sqlInsertSettings = `
        INSERT INTO account_settings (
          account_id 
        ) VALUES (?)`;

      connection.query(sqlInsertSettings, [accountId], (err) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ error: err.message });
          });
        }

        // Insert into account_stats
        const sqlInsertStats = `
          INSERT INTO account_stats (
            account_id, bot_activation_count
          ) VALUES (?, 0)`;

        connection.query(sqlInsertStats, [accountId], (err) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          // Commit transaction
          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            res.status(201).json({
              message: "Account created",
              account_id: accountId
            });
          });
        });
      });
    });
  });
});

// LOGIN: Authenticate a user by username and generate a JWT
router.post('/login', (req: Request, res: Response): void => {
  const { username }: { username: string } = req.body;

  // Validate input
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const sql = "SELECT * FROM accounts WHERE username = ?";
  connection.query(sql, [username], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // User exists, generate JWT
    const user = results[0];
    const token = jwt.sign({
      id: user.id,
      username: user.username
    }, secretKey);

    res.status(200).json({
      message: "Login successful",
      token,
    });
  });
});

// READ: Get all accounts
router.get('/', (req: Request, res: Response): void => {
  const sql = "SELECT * FROM accounts";
  connection.query(sql, (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// DELETE: Delete an account by ID
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  const sql = "DELETE FROM accounts WHERE id = ?";
  connection.query(sql, [id], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Account not found" });
      return;
    }
    res.status(200).json({ message: "Account deleted" });
  });
});

router.use(decodeJWT);

router.get('/me', decodeJWT, (req: any, res: Response): void => {
  const { id, username } = req.user;

  // Fetch the user details from the database
  const sql = "SELECT * FROM accounts WHERE id = ?";
  connection.query(sql, [id], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Return the user details
    const user = results[0];
    res.status(200).json({
      id: user.id,
      username: user.username,
      created_at: user.created_at,
    });
  });
});

router.get('/botStats', decodeJWT, (req: any, res: Response): void => {
  const { id } = req.user;
  const sql = "SELECT * FROM account_stats WHERE account_id = ?";
  connection.query(sql, [id], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: "No stats found for this account" });
      return;
    }
    res.status(200).json(results[0]);
  });
});

export default router;