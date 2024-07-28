import { Client } from 'basic-ftp';

let client = null;

export async function connectFTPS() {
    if (client) return client;
    
    client = new Client();
    client.ftp.verbose = true; // Enable verbose logging for testing purposes
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
        });
        console.log("Connected to FTPS server successfully");
        return client;
    } catch (error) {
        console.error("Failed to connect to FTPS server:", error);
        throw error;
    }
}

export async function uploadFile(localPath, remotePath) {
    if (!client) await connectFTPS();
    try {
        await client.uploadFrom(localPath, remotePath);
        console.log(`File uploaded: ${localPath} -> ${remotePath}`);
    } catch (error) {
        console.error("Failed to upload file:", error);
        throw error;
    }
    finally {
        closeFTPSConnection();
    }

}

export async function downloadFile(remotePath, localPath) {
    if (!client) await connectFTPS();
    try {
        await client.downloadTo(localPath, remotePath);
        console.log(`File downloaded: ${remotePath} -> ${localPath}`);
    } catch (error) {
        console.error("Failed to download file:", error);
        throw error;
    }
    finally {
        closeFTPSConnection();
    }
}

export async function deleteFile(remotePath) {
    if (!client) await connectFTPS();
    try {
        await client.remove(remotePath);
        console.log(`File deleted: ${remotePath}`);
    } catch (error) {
        console.error("Failed to delete file:", error);
        throw error;
    }
    finally {
        closeFTPSConnection();
    }
}

function closeFTPSConnection() {
    if (client) {
        client.close();
        client = null;
        console.log("FTPS connection closed");
    }
}