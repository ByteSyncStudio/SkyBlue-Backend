import knex from "../../../config/knex.js"


function organizeCategories(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // First, map all valid categories by their Id
    categories.forEach(category => {
        if (category.Published && !category.Deleted) {
            categoryMap.set(category.Id, { Id: category.Id, Name: category.Name, Published: category.Published, children: [] });
        }
    });

    // Then, organize them into a tree structure
    categories.forEach(category => {
        if (!category.Published || category.Deleted) return; // Skip invalid categories

        if (category.ParentCategoryId === 0) {
            rootCategories.push(categoryMap.get(category.Id));
        } else {
            const parentCategory = categoryMap.get(category.ParentCategoryId);
            if (parentCategory) {
                parentCategory.children.push(categoryMap.get(category.Id));
            }
        }
    });
    return rootCategories;
}


export async function GetAllCategories() {
    const result = await knex('Category')
    const organizedCategories = organizeCategories(result);
    console.log(organizedCategories.length)
    return JSON.stringify(organizedCategories, null, 2); // Pretty print JSON
}

export async function AddCategory(Name, ParentCategoryId, Published) {
    try {
        const [newCategoryId] = await knex.transaction(async (trx) => {
            const [categoryId] = await trx('Category')
                .insert({
                    Name,
                    ParentCategoryId,
                    Published,
                    CategoryTemplateId: 1, // Default value
                    PictureId: 0, // Default value (no images)
                    PageSize: 18, // Default value
                    AllowCustomersToSelectPageSize: 1, // Default
                    ShowOnHomePage: 0, // Default value
                    IncludeInTopMenu: 1, // Default value
                    SubjectToAcl: 1, // Default value
                    LimitedToStores: 1, // Default value
                    Deleted: 0, // Initially 0
                    DisplayOrder: 0, // Default value
                    CreatedOnUtc: new Date().toISOString(),
                    UpdatedOnUtc: new Date().toISOString(),
                })
                .returning('Id');
            return categoryId;
        });
        return newCategoryId;
    } catch (error) {
        console.error("Error adding category:\n", error);
        throw error;
    }
}

export async function UpdateCategory(categoryId, updatedCategory) {
    try {
        const updateFields = {};

        // Dynamically add fields to updateFields if they are present in updateData
        for (const key in updatedCategory) {
            if (updatedCategory.hasOwnProperty(key)) {
                updateFields[key] = updatedCategory[key];
            }
        }

        await knex.transaction(async (trx) => {
            await trx('Category')
                .where({ Id: categoryId })
                .update({
                    ...updateFields,
                    UpdatedOnUtc: new Date().toISOString()
                });
        });
        return categoryId;
    } catch (error) {
        console.error("Error updating category:\n", error);
        throw error;
    }
}

export async function DeleteCategory(categoryId) {
    try {
        await knex.transaction(async (trx) => {
            await trx('Category')
                .where('Id', categoryId)
                .del();
        });
        return categoryId;
    } catch (error) {
        console.error("Error deleting category:\n", error);
        throw error;
    }
}