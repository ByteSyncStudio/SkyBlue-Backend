import { Client } from 'basic-ftp';

let client = null;
let connectionPromise = null;

export async function connectFTPS() {
    if (client) return client;
    if (connectionPromise) return connectionPromise;

    client = new Client();
    client.ftp.verbose = true; // Enable verbose logging for testing purposes
    client.ftp.timeout = 10000; // Set a timeout for the connection

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

export async function downloadFile(remotePath, localPath) {
    const client = await connectFTPS();
    try {
        await client.downloadTo(localPath, remotePath);
        console.log(`File downloaded: ${remotePath} -> ${localPath}`);
    } catch (error) {
        console.error("Failed to download file:", error);
        throw error;
    }
}

export function closeFTPSConnection() {
    if (client) {
        client.close();
        client = null;
        console.log("FTPS connection closed");
    }
}