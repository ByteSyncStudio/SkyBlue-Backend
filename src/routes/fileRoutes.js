import express from 'express';
import fs from 'fs';
import path from 'path';
import { downloadFile } from '../config/ftpsClient.js';

const router = express.Router();

router.get('/download', async (req, res) => {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    
    const localPath = path.join(tempDir, '0000005_0.jpeg');
    const remotePath = '/acc1845619052/SkyblueWholesale/Content/Images/0000005_0.jpeg';
    
    try {
        await downloadFile(remotePath, localPath);
        console.log(`File downloaded to: ${localPath}`);
        console.log(`File exists: ${fs.existsSync(localPath)}`);
        console.log(`File size: ${fs.statSync(localPath).size} bytes`);
        
        res.download(localPath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Comment out the file deletion for now
            // fs.unlinkSync(localPath);
        });
    } catch (error) {
        console.error("Failed to download file:", error);
        res.status(500).send('Failed to download file');
    }
});

export default router;