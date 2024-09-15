import { GetAllCategories, AddCategory, UpdateCategory, DeleteCategory } from "../../../repositories/admin/category/adminCategoryRepository.js";

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
        let { Name, ParentCategoryId, Published, DiscountId } = req.body;

        if (ParentCategoryId === undefined) {
            ParentCategoryId = 0;
        }

        const newCategoryId = await AddCategory(Name, ParentCategoryId, Published, DiscountId);
        res.status(201).send({ Id: newCategoryId });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function updateCategory(req, res) {
    try {
        const categoryId = req.params.id;
        const updatedCategory = req.body;
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
