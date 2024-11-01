import app from './app.js';
import dotenv from 'dotenv'

dotenv.config();

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});