import app from './app.js';
import dotenv from 'dotenv'

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});