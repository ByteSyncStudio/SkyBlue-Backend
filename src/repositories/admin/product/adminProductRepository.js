import knex from '../../../config/knex.js'
import { generateImageUrl2 } from '../../../utils/imageUtils.js';

export async function AddProduct(product, trx) {
    try {
        const [productId] = await trx('Product').insert({
            ProductTypeId: 5,
            ParentGroupedProductId: 0,
            VisibleIndividually: 1,
            Name: product.Name,
            ShortDescription: product.ShortDescription,
            FullDescription: product.FullDescription,
            Barcode: product.Barcode,
            Barcode2: product.Barcode2,
            AdminComment: product.AdminComment,
            ProductTemplateId: 1,
            VendorId: product.VendorId ?? 0,
            ShowOnHomePage: 0,
            AllowCustomerReviews: 1,
            ApprovedRatingSum: 0,
            NotApprovedRatingSum: 0,
            ApprovedTotalReviews: 0,
            NotApprovedTotalReviews: 0,
            SubjectToAcl: 0,
            LimitedToStores: 1,
            IsGiftCard: 0,
            GiftCardTypeId: 0,
            RequireOtherProducts: 0,
            AutomaticallyAddRequiredProducts: 0,
            IsDownload: 0,
            DownloadId: 0,
            UnlimitedDownloads: 1, //? Default
            MaxNumberOfDownloads: 1, //? Default
            DownloadActivationTypeId: 0, //? Default
            HasSampleDownload: 0, //? Default
            SampleDownloadId: 0, //? Default
            HasUserAgreement: 0, //? Default
            IsRecurring: 0, //? Default
            RecurringCycleLength: 100, //? Default
            RecurringCyclePeriodId: 0, //? Default
            RecurringTotalCycles: 10, //? Default,
            IsRental: 0, //? Default
            RentalPriceLength: 1, //? Default
            RentalPricePeriodId: 0, //? Default
            IsShipEnabled: 1, //? Default
            IsFreeShipping: 0, //? Default
            ShipSeparately: 0, //? Default
            AdditionalShippingCharge: 0.0000, //? Default
            DeliveryDateId: 0, //? Default
            IsTaxExempt: 0, //? Default
            TaxCategoryId: 1, //? Default
            IsTelecommunicationsOrBroadcastingOrElectronicServices: 0, //? Default
            ManageInventoryMethodId: 1, //? Default
            ProductAvailabilityRangeId: 0, //? Default
            UseMultipleWarehouses: 0, //? Default
            WarehouseId: 0, //? Default
            StockQuantity: product.StockQuantity ?? 10000,
            DisplayStockAvailability: 1, //? Default
            DisplayStockQuantity: 0, //? Default
            MinStockQuantity: 0, //? Default
            LowStockActivityId: 0, //? Default
            NotifyAdminForQuantityBelow: 0, //? Default
            BackorderModeId: 0, //? Default
            AllowBackInStockSubscriptions: 0, //? Default
            OrderMinimumQuantity: product.OrderMinimumQuantity,
            OrderMaximumQuantity: product.OrderMaximumQuantity,
            AllowedQuantities: product.AllowedQuantities, //? Nullable
            AllowAddingOnlyExistingAttributeCombinations: 0, //? Default
            NotReturnable: 0, //? Default
            DisableBuyButton: 0, //? Default
            DisableWishlistButton: 0, //? Default
            AvailableForPreOrder: 0, //? Default
            CallForPrice: 0, //? Default
            Price: product.Price,
            OldPrice: product.OldPrice ?? 0.0000,
            ProductCost: 0.0000, //? Default
            CustomerEntersPrice: 0, //? Default
            MinimumCustomerEnteredPrice: 0.0000, //? Default
            MaximumCustomerEnteredPrice: 0.0000, //? Default
            BasepriceEnabled: 0, //? Default
            BasepriceAmount: 0.0000, //? Default
            BasepriceUnitId: 1, //? Default
            BasepriceBaseAmount: 0.0000, //? Default
            BasepriceBaseUnitId: 1, //? Default
            MarkAsNew: product.MarkAsNew ?? 0, //? Default
            HasTierPrices: 1, //? Default
            HasDiscountsApplied: 0, //? Default
            Weight: 0.0000, //? Default
            Length: 0.0000, //? Default
            Width: 0.0000, //? Default
            Height: 0.0000, //? Default
            DisplayOrder: 0, //? Default
            Published: product.Published,
            Deleted: 0, //? Initially 0
            CreatedOnUtc: new Date().toISOString(),
            UpdatedOnUtc: new Date().toISOString(),
            ItemLocation: product.ItemLocation,
            BoxQty: product.BoxQty,
            Stock: 0,
        }).returning('Id')
        return productId.Id
    } catch (error) {
        console.error("Error creating product:\n", error);
        throw error;
    }
}

export async function MapToCategory(productId, categoryId, trx) {
    try {
        await trx('Product_Category_Mapping').insert({
            ProductId: productId,
            CategoryId: categoryId,
            IsFeaturedProduct: 0,
            DisplayOrder: 0
        });
    } catch (error) {
        console.error("Error mapping product to category:\n", error);
        throw error;
    }
}

export async function AddTierPrices(productId, tierPrices, trx) {
    try {
        const tierPriceInserts = tierPrices.map(tp => ({
            ProductId: productId,
            StoreId: 0,
            CustomerRoleId: tp.roleId,
            Quantity: 1,
            Price: tp.price,
            StartDateTimeUtc: null,
            EndDateTimeUtc: null
        }));

        const result = await trx('TierPrice').insert(tierPriceInserts);
        console.log('Tier prices inserted:', result);
        return result;
    } catch (error) {
        console.error("Error adding tier prices:\n", error);
        throw error;
    }
}

export async function AddPicture(pictureData, trx) {
    try {
        const result = await trx('Picture').insert({
            PictureBinary: Buffer.from([]), // Empty buffer as actual image is stored on FTP
            MimeType: pictureData.mimeType,
            SeoFilename: pictureData.seoFilename,
            AltAttribute: '',
            TitleAttribute: '',
            IsNew: 1
        }).returning('Id');

        const pictureId = result[0].Id; // Extract the Id from the result
        console.log('Picture inserted:', pictureId);
        return pictureId;
    } catch (error) {
        console.error("Error adding picture:\n", error);
        throw error;
    }
}

export async function MapProductToPicture(productId, pictureId, displayOrder, trx) {
    try {
        //? Unmap previous pictures
        await trx('Product_Picture_Mapping')
            .where({ ProductId: productId })
            .del();

        const result = await trx('Product_Picture_Mapping').insert({
            ProductId: productId,
            PictureId: pictureId,
            DisplayOrder: displayOrder
        });
        console.log('Product mapped to picture:', result);
        return result;
    } catch (error) {
        console.error("Error mapping product to picture:\n", error);
        throw error;
    }
}

export async function UpdateProduct(productId, updateData, trx) {
    try {
        const updateFields = {};

        // Dynamically add fields to updateFields if they are present in updateData
        for (const key in updateData) {
            if (updateData.hasOwnProperty(key)) {
                updateFields[key] = updateData[key];
            }
        }

        // Perform the update
        await trx('Product')
            .where({ Id: productId })
            .update({
                ...updateFields,
                UpdatedOnUtc: new Date().toISOString()
            });

        console.log('Product updated with ID:', productId);
    } catch (error) {
        console.error("Error updating product:\n", error);
        throw error;
    }
}

export async function UpdateCategoryMapping(productId, categoryId, trx) {
    await trx('Product_Category_Mapping')
        .where('ProductId', productId)
        .update({ CategoryId: categoryId });
}

export async function UpdateTierPrices(productId, tierPrices, trx) {
    try {
        for (const tp of tierPrices) {
            if (parseInt(tp.price) === 0) {
                // Delete the tier price if the price is 0
                await trx('TierPrice')
                    .where({
                        ProductId: productId,
                        CustomerRoleId: tp.roleId
                    })
                    .del();
                console.log(`Tier price for role ${tp.roleId} deleted for product ID: ${productId}`);
            } else {
                const existingTierPrice = await trx('TierPrice')
                    .where({
                        ProductId: productId,
                        CustomerRoleId: tp.roleId
                    })
                    .first();

                if (existingTierPrice) {
                    // Update existing tier price
                    await trx('TierPrice')
                        .where({
                            ProductId: productId,
                            CustomerRoleId: tp.roleId
                        })
                        .update({
                            Price: tp.price,
                        });
                    console.log(`Tier price for role ${tp.roleId} updated for product ID: ${productId}`);
                } else {
                    // Insert new tier price
                    await trx('TierPrice').insert({
                        ProductId: productId,
                        StoreId: 0,
                        CustomerRoleId: tp.roleId,
                        Quantity: 1,
                        Price: tp.price,
                        StartDateTimeUtc: null,
                        EndDateTimeUtc: null,
                    });
                    console.log(`Tier price for role ${tp.roleId} inserted for product ID: ${productId}`);
                }
            }
        }
    } catch (error) {
        console.error("Error updating tier prices:\n", error);
        throw error;
    }
}

export async function DeleteProductPictures(productId, pictureIds, trx) {
    await trx('Product_Picture_Mapping')
        .where('ProductId', productId)
        .whereIn('PictureId', pictureIds)
        .del();
    await trx('Picture').whereIn('Id', pictureIds).del();
    // You may also want to delete the files from FTP here
}


export async function UpdateProductPictures(productId, files, seoFilenamesArray, trx) {
    // Fetch existing picture IDs for the product
    const existingPictures = await trx('Product_Picture_Mapping')
        .where('ProductId', productId)
        .select('PictureId');

    const existingPictureIds = existingPictures.map(p => p.PictureId);

    // Delete existing pictures
    if (existingPictureIds.length > 0) {
        await trx('Product_Picture_Mapping')
            .where('ProductId', productId)
            .whereIn('PictureId', existingPictureIds)
            .del();
        await trx('Picture').whereIn('Id', existingPictureIds).del();
    }

    // Add new pictures
    let displayOrder = 1;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const seoFilename = seoFilenamesArray[i] || `product-${productId}-image-${displayOrder}`;
        const pictureId = await AddPicture({ mimeType: file.mimetype, seoFilename }, trx);
        await MapProductToPicture(productId, pictureId, displayOrder, trx);
        displayOrder++;

        // Queue file upload (assuming you have a similar function for updates)
        queueFileUpload(file.path, `/path/to/ftp/${pictureId}_${seoFilename}`);
    }
}

export async function DeleteProduct(productId) {
    await knex.transaction(async (trx) => {
        await trx('Product').where('Id', productId).update({ Deleted: 1 });
        // You might want to handle related data (e.g., pictures, tier prices) here
    });
}

/**
* * Retrieves a list of best-selling products sorted by a specified criterion.*
* **
* * @param {string} sortBy - The criterion to sort by ('quantity' or 'amount').*
* * @param {number} size - The number of items to retrieve.*
* * @returns {Promise<Array>} A promise that resolves to an array of best-selling product objects.*
**/
export async function listBestsellers(sortBy, size, user) {
    try {
        const orderColumn = sortBy === 'quantity' ? 'TotalQuantity' : 'TotalAmount';
        
        const query = knex.raw(`
            WITH TopProducts AS (
                SELECT 
                    oi.ProductId,
                    SUM(oi.Quantity) as TotalQuantity,
                    SUM(oi.PriceExclTax) as TotalAmount,
                    ROW_NUMBER() OVER (ORDER BY SUM(CASE WHEN ? = 'quantity' THEN oi.Quantity ELSE oi.PriceExclTax END) DESC) as RowNum
                FROM OrderItem oi
                JOIN Product p ON oi.ProductId = p.Id
                WHERE p.Published = 1 AND p.Deleted = 0
                GROUP BY oi.ProductId
            )
            SELECT 
                p.Id,
                p.Name,
                p.HasTierPrices,
                p.Price,
                p.FullDescription,
                p.ShortDescription,
                p.OrderMinimumQuantity,
                p.OrderMaximumQuantity,
                p.StockQuantity,
                ppm.PictureId,
                pic.MimeType,
                pic.SeoFilename,
                tp.TotalQuantity,
                tp.TotalAmount
            FROM TopProducts tp
            JOIN Product p ON tp.ProductId = p.Id
            LEFT JOIN Product_Picture_Mapping ppm ON p.Id = ppm.ProductId
            LEFT JOIN Picture pic ON ppm.PictureId = pic.Id
            WHERE tp.RowNum <= ?
            ORDER BY tp.RowNum
        `, [sortBy, size]);

        const products = await query;
        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);

        const processedProducts = products.map(product => {
            const imageUrl = product.PictureId
                ? generateImageUrl2(product.PictureId, product.MimeType, product.SeoFilename)
                : null;
            const price = product.Price;
            return {
                Id: product.Id,
                Name: product.Name,
                Price: price,
                FullDescription: product.FullDescription,
                ShortDescription: product.ShortDescription,
                OrderMinimumQuantity: product.OrderMinimumQuantity,
                OrderMaximumQuantity: product.OrderMaximumQuantity,
                Stock: product.StockQuantity,
                Images: [imageUrl],
                Quantity: product.TotalQuantity,
                Amount: product.TotalAmount
            };
        });

        return processedProducts;
    } catch (error) {
        console.error('Error in listBestsellers:', error);
        error.statusCode = 500;
        error.message = "Error in BestSellers";
        throw error;
    }
}

export async function ListSearchProducts(categoryName, productName, published, page, size) {
    try {
        const offset = (page - 1) * size;
        let query = knex('Product')
            .select([
                'Product.Id',
                'Product.Name',
                'Product.Price',
                'Product.HasTierPrices',
                'Product.FullDescription',
                'Product.ShortDescription',
                'Product.OrderMinimumQuantity',
                'Product.OrderMaximumQuantity',
                'Product.StockQuantity',
                'Product.Published',
                'Product.Deleted',
                knex.raw('MAX(Product_Picture_Mapping.PictureId) as PictureId'),
                knex.raw('MAX(Picture.MimeType) as MimeType'),
                knex.raw('MAX(Picture.SeoFilename) as SeoFilename'),
                knex.raw('COUNT(*) OVER() AS total_count')
            ])
            .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
            .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
            .where('Product.Deleted', false)
            .groupBy(
                'Product.Id',
                'Product.Name',
                'Product.Price',
                'Product.HasTierPrices',
                'Product.FullDescription',
                'Product.ShortDescription',
                'Product.OrderMinimumQuantity',
                'Product.OrderMaximumQuantity',
                'Product.StockQuantity',
                'Product.Published',
                'Product.Deleted'
            )
            .orderBy('Product.Name');

        if (categoryName) {
            query = query
                .join('Product_Category_Mapping', 'Product.Id', 'Product_Category_Mapping.ProductId')
                .join('Category', 'Product_Category_Mapping.CategoryId', 'Category.Id')
                .where('Category.Name', 'like', `%${categoryName}%`);
        }

        if (productName) {
            query = query.andWhere('Product.Name', 'like', `%${productName}%`);
        }

        if (published === 0 || published === 1) {
            query = query.andWhere('Product.Published', published === 1);
        }

        query = query.limit(size).offset(offset);

        console.log(query.toString());

        const products = await query;

        const productsWithImageUrls = products.map(product => ({
            Id: product.Id.toString(),
            Name: product.Name,
            Price: product.Price,
            HasTierPrices: product.HasTierPrices,
            FullDescription: product.FullDescription,
            ShortDescription: product.ShortDescription,
            OrderMinimumQuantity: product.OrderMinimumQuantity,
            OrderMaximumQuantity: product.OrderMaximumQuantity,
            StockQuantity: product.StockQuantity,
            Published: product.Published,
            Deleted: product.Deleted,
            total_count: product.total_count,
            imageUrl: product.PictureId && product.MimeType && product.SeoFilename
                ? generateImageUrl2(product.PictureId, product.MimeType, product.SeoFilename)
                : null
        }));

        console.log('Number of products retrieved:', productsWithImageUrls.length);

        const totalItems = productsWithImageUrls.length > 0 ? productsWithImageUrls[0].total_count : 0;
        const totalPages = Math.ceil(totalItems / size);

        return {
            totalItems,
            totalPages,
            currentPage: page,
            products: productsWithImageUrls,
        };
    } catch (error) {
        console.error('Error in ListSearchProducts:', error);
        error.statusCode = 500;
        error.message = "Error in ListSearchProducts";
        throw error;
    }
}