import axios from "axios";

export async function proxyImage(req, res) {
    try {
        const imageUrl = req.query.url;
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });

        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Error fetching image');
    }
}