import knex from "../../../config/knex.js"
import { generateImageUrl2 } from "../../../utils/imageUtils.js";


function organizeCategories(categories, searchTerm = '') {
    const categoryMap = new Map();
    const rootCategories = [];

    // First, map all valid categories by their Id
    categories.forEach(category => {
        if (!category.Deleted) {
            const imageUrl = category.PictureId
                ? generateImageUrl2(category.PictureId, category.MimeType, category.SeoFilename)
                : null;
            categoryMap.set(category.Id, { ...category, children: [], Image: imageUrl });
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
    const result = await knex('Category')
        .leftJoin('Picture', 'Category.PictureId', 'Picture.Id')
        .leftJoin('Discount_AppliedToCategories as datc', 'Category.Id', 'datc.Category_Id')
        .leftJoin('Discount', 'datc.Discount_Id', 'Discount.Id')
        .select(
            'Category.Id',
            'Category.Name',
            'Category.ParentCategoryId',
            'Category.Deleted',
            'Category.PictureId',
            'Category.Published',
            'Picture.MimeType',
            'Picture.SeoFilename',
            'Discount.Name as DiscountName'
        )
        .orderBy('Category.Id', 'desc');
    const organizedCategories = organizeCategories(result, searchTerm);
    return JSON.stringify(organizedCategories, null, 2); // Pretty print JSON
}

export async function AddCategory(Name, ParentCategoryId, Published, DiscountId, Description, ShowOnHomePage, MetaKeywords, MetaDescription, MetaTitle, PictureId) {
    try {
        const result = await knex.transaction(async (trx) => {
            const [categoryId] = await trx('Category')
                .insert({
                    Name,
                    ParentCategoryId,
                    Published,
                    CategoryTemplateId: 1,
                    PictureId,
                    PageSize: 18,
                    AllowCustomersToSelectPageSize: 1,
                    ShowOnHomePage,
                    IncludeInTopMenu: 1,
                    SubjectToAcl: 1,
                    LimitedToStores: 1,
                    Deleted: 0,
                    DisplayOrder: 0,
                    Description,
                    MetaKeywords,
                    MetaDescription,
                    MetaTitle,
                    CreatedOnUtc: new Date().toISOString(),
                    UpdatedOnUtc: new Date().toISOString(),
                })
                .returning('Id');

            if (DiscountId) {
                await MapDiscountToCategory(categoryId.Id, DiscountId, trx);
            }

            return categoryId; // Return single ID value
        });
        
        return result;
    } catch (error) {
        console.error("Error adding category:\n", error);
        throw error;
    }
}
export async function UpdateCategory(categoryId, updatedCategory) {
    try {
        await knex.transaction(async (trx) => {
            const { DiscountId, ...categoryData } = updatedCategory;

            await trx('Category')
                .where({ Id: categoryId })
                .update({
                    ...categoryData,
                    UpdatedOnUtc: new Date().toISOString()
                });

            if (DiscountId === null) {
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

export async function AddPicture(pictureData) {
    try {
        const [pictureId] = await knex('Picture').insert({
            MimeType: pictureData.mimeType,
            SeoFilename: pictureData.seoFilename,
            AltAttribute: pictureData.altAttribute,
            TitleAttribute: pictureData.titleAttribute,
            IsNew: true,
        }).returning('Id');
        return pictureId.Id;
    } catch (error) {
        console.error("Error creating picture:\n", error);
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
    const categoryWithDiscount = await knex('Category as c')
        .leftJoin('Discount_AppliedToCategories as datc', 'c.Id', 'datc.Category_Id')
        .leftJoin('Discount as d', 'datc.Discount_Id', 'd.Id')
        .leftJoin('Picture as p', 'c.PictureId', 'p.Id')
        .select([
            'c.Id',
            'c.Name',
            'c.Published',
            'c.Deleted',
            'c.MetaKeywords',
            'c.MetaDescription',
            'c.MetaTitle',
            'd.Name as DiscountName',
            'd.Id as DiscountId',
            'p.Id as PictureId',
            'p.MimeType',
            'p.SeoFilename',
            'c.Description',
            'c.ShowOnHomePage'
        ])
        .where('c.Id', categoryId)
        .first();

    if (categoryWithDiscount && categoryWithDiscount.PictureId) {
        categoryWithDiscount.Image = generateImageUrl2(
            categoryWithDiscount.PictureId,
            categoryWithDiscount.MimeType,
            categoryWithDiscount.SeoFilename
        );
    } else {
        categoryWithDiscount.Image = null;
    }

    return categoryWithDiscount;
}
