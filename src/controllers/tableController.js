import { listTables } from '../config/dbUtils.js';

async function getTables(req, res) {
    try {
        const tables = await listTables();
        res.json(tables);
        console.log(tables)
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export { getTables };