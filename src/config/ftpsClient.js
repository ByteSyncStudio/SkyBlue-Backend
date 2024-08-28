import { Client } from 'basic-ftp';
import fs from 'fs/promises';

const MAX_CONNECTIONS = 5;
const connectionPool = [];
const uploadQueue = [];
let isProcessing = false;

async function getConnection() {
    if (connectionPool.length < MAX_CONNECTIONS) {
        const client = new Client();
        client.ftp.verbose = false;
        client.ftp.timeout = 100000;

        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
        });

        console.log("New FTPS connection created");
        connectionPool.push(client);
        return client;
    }

    // Wait for an available connection
    while (connectionPool.every(conn => conn.busy)) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return connectionPool.find(conn => !conn.busy);
}

async function releaseConnection(client) {
    client.busy = false;
}

async function uploadFile(localPath, remotePath, retries = 3) {
    let client;
    try {
        client = await getConnection();
        client.busy = true;

        await client.uploadFrom(localPath, remotePath);
        console.log(`File uploaded: ${localPath} -> ${remotePath}`);
    } catch (error) {
        console.error(`Failed to upload file: ${localPath} -> ${remotePath}`, error);
        if (retries > 0) {
            console.log(`Retrying upload (${retries} attempts left)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await uploadFile(localPath, remotePath, retries - 1);
        } else {
            throw error;
        }
    } finally {
        if (client) {
            releaseConnection(client);
        }
    }
}

export function queueFileUpload(localPath, remotePath) {
    uploadQueue.push({ localPath, remotePath });
    if (!isProcessing) {
        processQueue();
    }
}

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (uploadQueue.length > 0) {
        const { localPath, remotePath } = uploadQueue.shift();
        try {
            await uploadFile(localPath, remotePath);
            await fs.unlink(localPath);
        } catch (error) {
            console.error('Error processing upload:', error);
            // Optionally, you could implement a "dead letter queue" here
            // to store failed uploads for later retry or manual intervention
        }
    }

    isProcessing = false;
}

process.on('SIGTERM', () => {
    connectionPool.forEach(client => client.close());
});

export { uploadFile };