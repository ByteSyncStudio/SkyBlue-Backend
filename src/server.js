import express from 'express';
import getConnection from './config/db.js';

const app = express();
const port = 3000;


app.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Customer');
        if (result.recordset.length > 0) {
            res.json(result.recordset);
            result.recordset.forEach(row => console.log(row.Username))
        } else {
            res.send('No data found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});