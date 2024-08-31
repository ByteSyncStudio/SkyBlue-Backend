import knex from '../../../config/knex.js'

export async function AddProduct(product, trx) {
    try {
        const result = await trx('Product').insert({
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
            VendorId: product.VendorId,
            ShowOnHomePage: 0,
            AllowCustomerReviews: 1, 
            ApprovedRatingSum: 0,
            NotAprrovedRatingSum: 0,
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

                 
        })

    } catch (error) {
        console.error("Error creating user:\n", error);
        throw error;
    }
}