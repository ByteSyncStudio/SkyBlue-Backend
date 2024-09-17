import knex from "../../../config/knex.js"


function organizeCategories(categories, searchTerm = '') {
    const categoryMap = new Map();
    const rootCategories = [];

    // First, map all valid categories by their Id
    categories.forEach(category => {
        if (!category.Deleted) {
            categoryMap.set(category.Id, { ...category, children: [] });
        }
    });

    // Then, organize them into a tree structure
    categories.forEach(category => {
        if (category.Deleted) return; // Skip invalid categories

        if (category.ParentCategoryId === 0) {
            rootCategories.push(categoryMap.get(category.Id));
        } else {
            const parentCategory = categoryMap.get(category.ParentCategoryId);
            if (parentCategory) {
                parentCategory.children.push(categoryMap.get(category.Id));
            }
        }
    });

    // If searchTerm is provided, filter the categories
    if (searchTerm) {
        const filteredRootCategories = filterCategories(rootCategories, searchTerm.toLowerCase());
        return filteredRootCategories;
    }

    return rootCategories;
}

function filterCategories(categories, searchTerm) {
    return categories.reduce((acc, category) => {
        const matchedCategory = { ...category };
        if (category.Name.toLowerCase().includes(searchTerm)) {
            acc.push(matchedCategory);
        } else if (category.children && category.children.length > 0) {
            const matchedChildren = filterCategories(category.children, searchTerm);
            if (matchedChildren.length > 0) {
                matchedCategory.children = matchedChildren;
                acc.push(matchedCategory);
            }
        }
        return acc;
    }, []);
}

export async function GetAllCategories(searchTerm = '') {
    const result = await knex('Category');
    const organizedCategories = organizeCategories(result, searchTerm);
    return JSON.stringify(organizedCategories, null, 2); // Pretty print JSON
}

export async function AddCategory(Name, ParentCategoryId, Published, DiscountId) {
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

            if (DiscountId) {
                await MapDiscountToCategory(categoryId, DiscountId, trx);
            }

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
        const { DiscountId, ...categoryData } = updatedCategory;

        // Dynamically add fields to updateFields if they are present in updateData
        for (const key in categoryData) {
            if (categoryData.hasOwnProperty(key)) {
                updateFields[key] = categoryData[key];
            }
        }

        await knex.transaction(async (trx) => {
            await trx('Category')
                .where({ Id: categoryId })
                .update({
                    ...updateFields,
                    UpdatedOnUtc: new Date().toISOString()
                });

            if (DiscountId === "0") {
                await DeleteDiscountMapping(categoryId, trx);
            } else if (DiscountId) {
                await DeleteDiscountMapping(categoryId, trx);
                await MapDiscountToCategory(categoryId, DiscountId, trx);
            }
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

export async function MapDiscountToCategory(categoryId, discountId, trx) {
    try {
        await trx('Discount_AppliedToCategories').insert({
            Discount_Id: discountId,
            Category_Id: categoryId
        });
    } catch (error) {
        console.error("Error mapping discount to category:\n", error);
        throw error;
    }
}

export async function DeleteDiscountMapping(categoryId, trx) {
    try {
        await trx('Discount_AppliedToCategories')
            .where('Category_Id', categoryId)
            .del();
    } catch (error) {
        console.error("Error deleting discount mapping:\n", error);
        throw error;
    }
}

export async function GetSingleCategory(categoryId) {
    const categoryWithDiscount = await knex('Category')
        .leftJoin('Discount_AppliedToCategories', 'Category.Id', 'Discount_AppliedToCategories.Category_Id')
        .select('Category.*', 'Discount_AppliedToCategories.*')
        .where('Category.Id', categoryId);

    return categoryWithDiscount;
}