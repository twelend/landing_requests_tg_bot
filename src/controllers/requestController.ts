import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// Function to create a new request
export const createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { requestNum, name, phone, date, operatorId, operatorName } = req.body;

    // Check if the request data is valid
    if (!requestNum || !name || !phone || !date) {
        res.status(400).json({ error: 'Invalid data' });
        return;
    }

    try {
        const newRequest = await pool.query(
            `INSERT INTO requests (request_num, name, phone, date, operator_id, operator_name, completed)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [requestNum, name, phone, date, operatorId, operatorName, false]
        );
        res.status(200).json(newRequest.rows[0]);
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
};

// Function to get the last number and use it to add a new request
export const getNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const requests = await pool.query(`SELECT request_num FROM requests ORDER BY request_num DESC LIMIT 1`);
        
        // If there are no requests, return 1
        if (!requests.rows[0]) {
            res.json({ number: 1 });
            return;
        }

        const lastNumber = requests.rows[0].request_num;
        res.json({ number: lastNumber + 1 });
    } catch (error) {
        console.error('Error getting number:', error);
        res.status(500).json({ error: 'Failed to get number' });
    }
};

// Function to get all requests
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const requests = await pool.query('SELECT * FROM requests ORDER BY date DESC');
        res.json(requests.rows);
    } catch (error) {
        console.error('Error getting all requests:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
};

// Function to delete all requests
export const deleteAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await pool.query('DELETE FROM requests');
        res.json({ message: 'All requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting requests:', error);
        res.status(500).json({ error: 'Failed to delete requests' });
    }
};
