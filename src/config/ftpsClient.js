import { Client } from 'basic-ftp';

let client = null;
let connectionPromise = null;

export async function connectFTPS() {
    if (client && client.closed === false) return client;
    if (connectionPromise) return connectionPromise;

    client = new Client();
    client.ftp.verbose = false; // Enable verbose logging for testing purposes
    client.ftp.timeout = 100000; // Set a timeout for the connection

    connectionPromise = client.access({
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: true,
    }).then(() => {
        console.log("Connected to FTPS server successfully");
        connectionPromise = null;
        return client;
    }).catch(error => {
        console.error("Failed to connect to FTPS server:", error);
        client = null;
        connectionPromise = null;
        throw error;
    });

    return connectionPromise;
}

export async function downloadFile(remotePath, localPath, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const client = await connectFTPS();
            await client.downloadTo(localPath, remotePath);
            console.log(`File downloaded: ${remotePath} -> ${localPath}`);
            return;
        } catch (error) {
            console.error(`Failed to download file (attempt ${attempt}):`, error);
            if (attempt === retries || error.code !== 'ECONNRESET') {
                throw error;
            }
            console.log(`Retrying download (attempt ${attempt + 1})...`);
            await reconnectFTPS();
        }
    }
}

export async function uploadFile(localPath, remotePath) {
    const client = await connectFTPS();
    try {
        await client.uploadFrom(localPath, remotePath);
        console.log(`File uploaded: ${localPath} -> ${remotePath}`);
    } catch (error) {
        console.error(`Failed to upload file: ${localPath} -> ${remotePath}`, error);
        throw error;
    } finally {
        closeFTPSConnection();
    }
}
async function reconnectFTPS() {
    if (client) {
        client.close();
        client = null;
    }
    await connectFTPS();
}

export function closeFTPSConnection() {
    if (client) {
        client.close();
        client = null;
        console.log("FTPS connection closed");
    }
}