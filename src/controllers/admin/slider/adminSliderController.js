import multer from 'multer';
import { AddSlider, AddPicture, MapSliderToPicture, DeleteSlider, UpdateSlider, GetSliderByType } from '../../../repositories/admin/slider/adminSliderRepository.js';
import { queueFileUpload } from '../../../config/ftpsClient.js';
import knex from "../../../config/knex.js";

const upload = multer({ dest: 'uploads/' });

export const addSlider = [
    upload.single('image'),
    async (req, res) => {
        const { type, displayOrder, link } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).send({ success: false, message: 'Image file is required.' });
        }

        try {
            await knex.transaction(async (trx) => {
                // 1. Add the slider
                const sliderId = await AddSlider({ type, displayOrder, link }, trx);

                // 2. Add the picture
                const pictureData = {
                    mimeType: file.mimetype,
                    seoFilename: null, // SeoFilename will be null
                    altAttribute: '',
                    titleAttribute: ''
                };
                const pictureId = await AddPicture(pictureData, trx);

                // 3. Map the slider to the picture
                await MapSliderToPicture(sliderId, pictureId, trx);

                // 4. Upload the image to the FTP server
                const fileExtension = file.mimetype.split('/')[1];
                const formattedId = pictureId.toString().padStart(7, '0');
                const remotePath = `/acc1845619052/SkyblueWholesale/Content/Images/Sliders/${formattedId}.${fileExtension}`;

                console.log('Queueing file upload:', file.path, 'to', remotePath);
                queueFileUpload(file.path, remotePath);
            });

            res.status(201).send({ success: true, message: 'Slider Added.' });
        } catch (error) {
            console.error('Error in addSlider:', error);
            res.status(error.statusCode || 500).send(error.message || 'Server error');
        }
    }
];

export const deleteSlider = async (req, res) => {
    const { sliderId } = req.params;

    try {
        await knex.transaction(async (trx) => {
            await DeleteSlider(sliderId, trx);
        });

        res.status(200).send({ success: true, message: 'Slider Deleted.' });
    } catch (error) {
        console.error('Error in deleteSlider:', error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
};

export const updateSlider = [
    upload.single('image'),
    async (req, res) => {
        const { sliderId } = req.params;
        let updateData = {};
        const file = req.file;

        // Add any other fields from req.body to updateData
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                updateData[key] = req.body[key];
            });
        }

        try {
            await knex.transaction(async (trx) => {
                if (file) {
                    // Add the new picture
                    const pictureData = {
                        mimeType: file.mimetype,
                        seoFilename: null,
                        altAttribute: '',
                        titleAttribute: ''
                    };
                    const pictureId = await AddPicture(pictureData, trx);

                    // Map the slider to the new picture
                    await MapSliderToPicture(sliderId, pictureId, trx);

                    // Upload the new image to the FTP server
                    const fileExtension = file.mimetype.split('/')[1];
                    const formattedId = pictureId.toString().padStart(7, '0');
                    const remotePath = `/acc1845619052/SkyblueWholesale/Content/Images/Sliders/${formattedId}.${fileExtension}`;

                    console.log('Queueing file upload:', file.path, 'to', remotePath);
                    queueFileUpload(file.path, remotePath);

                    // Add the pictureId to updateData
                    updateData.pictureId = pictureId;
                }

                await UpdateSlider(sliderId, updateData, trx);
            });

            res.status(200).send({ success: true, message: 'Slider Updated.' });
        } catch (error) {
            console.error('Error in updateSlider:', error);
            res.status(error.statusCode || 500).send(error.message || 'Server error');
        }
    }
];

export const getSliderByType = async (req, res) => {
    const { type } = req.params;

    try {
        const sliders = await GetSliderByType(type);
        res.status(200).send(sliders);
    } catch (error) {
        console.error('Error in getSliderByType:', error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
};