import fs from 'fs';
import path from 'path';
import { downloadFile } from '../config/ftpsClient.js';

export const download = async (req, res) => {
    const {id, MimeType} = req.body;
    // Validate that id and MimeType are present
    if (!id || !MimeType) {
        return res.status(400).json({ error: 'id and MimeType are required' });
    }

    const formattedId = id.toString().padStart(7, '0');
    const fileExtension = MimeType.split('/')[1];
    const fileName = `${formattedId}_0.${fileExtension}`;
    console.log(fileName);

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const localPath = path.join(tempDir, fileName);
    const remotePath = `/acc1845619052/SkyblueWholesale/Content/Images/${fileName}`;

    try {
        await downloadFile(remotePath, localPath);
        console.log(`File downloaded to: ${localPath}`);
        console.log(`File exists: ${fs.existsSync(localPath)}`);
        console.log(`File size: ${fs.statSync(localPath).size} bytes`);

        res.download(localPath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }

            // Comment it out to keep files in
            fs.unlinkSync(localPath);
        });
    } catch (error) {
        console.error("Failed to download file:", error);
        res.status(500).send('Failed to download file');
    }
}