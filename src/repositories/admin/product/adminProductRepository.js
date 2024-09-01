import knex from '../../../config/knex.js'

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