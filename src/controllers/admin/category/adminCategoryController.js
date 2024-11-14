import multer from 'multer';
import { promisify } from 'util';
import { GetAllCategories, AddCategory, UpdateCategory, DeleteCategory, GetSingleCategory, AddPicture } from "../../../repositories/admin/category/adminCategoryRepository.js";
import { queueFileUpload } from '../../../config/ftpsClient.js';
import knex from "../../../config/knex.js";

const upload = multer({ dest: 'uploads/' });
const uploadMiddleware = promisify(upload.single('Image'));

export async function getAllCategories(req, res) {
    try {
        const searchTerm = req.query.search;
        const result = await GetAllCategories(searchTerm);
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function addCategory(req, res) {
    try {
        await uploadMiddleware(req, res);

        let { Name, ParentCategoryId, Published, DiscountId, Description, ShowOnHomePage } = req.body;
        const file = req.file;

        if (ParentCategoryId === undefined) {
            ParentCategoryId = 0;
        }

        let pictureId = 0;
        if (file) {
            const pictureData = {
                mimeType: file.mimetype,
                seoFilename: 'category',
                altAttribute: '',
                titleAttribute: ''
            };
            pictureId = await AddPicture(pictureData);

            // Queue the file for FTP upload
            const fileExtension = file.mimetype.split('/')[1];
            const formattedId = pictureId.toString().padStart(7, '0');
            const remotePath = `/acc1845619052/SkyblueWholesale/Content/Images/Category/${formattedId}.${fileExtension}`;
            queueFileUpload(file.path, remotePath);
        }

        const newCategoryId = await AddCategory(Name, ParentCategoryId, Published, DiscountId, Description, ShowOnHomePage, pictureId);
        res.status(201).send({ newCategoryId });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function updateCategory(req, res) {
    try {
        await uploadMiddleware(req, res);

        const categoryId = req.params.id;
        const { Name, ParentCategoryId, Published, DiscountId, Description, ShowOnHomePage, removedImage } = req.body;
        const file = req.file;

        let pictureId;
        let seoFilename = 'category'
        if (file) {
            const pictureData = {
                mimeType: file.mimetype,
                seoFilename: seoFilename,
                altAttribute: '',
                titleAttribute: ''
            };
            pictureId = await AddPicture(pictureData);

            // Queue the file for FTP upload
            const fileExtension = file.mimetype.split('/')[1];
            const formattedId = pictureId.toString().padStart(7, '0');
            console.log(fileExtension, formattedId)
            const remotePath = `/acc1845619052/SkyblueWholesale/content/images/thumbs/${formattedId}_${seoFilename}.${fileExtension}`;
            queueFileUpload(file.path, remotePath);
        } else if (removedImage) {
            pictureId = 0;
        }

        const updatedCategory = {};

        // Conditionally add fields to updatedCategory
        if (Name !== undefined) updatedCategory.Name = Name;
        if (ParentCategoryId !== undefined) updatedCategory.ParentCategoryId = parseInt(ParentCategoryId);
        if (Published !== undefined) updatedCategory.Published = Published === 'true';
        if (DiscountId !== undefined) updatedCategory.DiscountId = DiscountId === 'null' ? null : parseInt(DiscountId);
        if (Description !== undefined) updatedCategory.Description = Description;
        if (ShowOnHomePage !== undefined) updatedCategory.ShowOnHomePage = ShowOnHomePage === 'true' || ShowOnHomePage === '1' ? 1 : 0;
        if (pictureId !== undefined) updatedCategory.PictureId = pictureId;

        await UpdateCategory(categoryId, updatedCategory);
        res.status(200).send({ Id: categoryId });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function deleteCategory(req, res) {
    try {
        const categoryId = req.params.id;
        const result = await DeleteCategory(categoryId);
        res.status(200).send({ success: true, result });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function getSingleCategory(req, res) {
    try {
        const categoryId = req.params.id;
        console.log(categoryId)
        const result = await GetSingleCategory(categoryId);
        res.status(200).send(result)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}