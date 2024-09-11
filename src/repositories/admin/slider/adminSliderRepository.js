import knex from "../../../config/knex.js";

export async function AddSlider(slider, trx) {
    try {
        const [sliderId] = await trx('Slider').insert({
            Type: slider.type,
            DisplayOrder: slider.displayOrder,
        }).returning('Id');
        return sliderId.Id;
    } catch (error) {
        console.error("Error creating slider:\n", error);
        throw error;
    }
}

export async function AddPicture(pictureData, trx) {
    try {
        const [pictureId] = await trx('Picture').insert({
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

export async function MapSliderToPicture(sliderId, pictureId, trx) {
    try {
        await trx('Slider_Picture_Mapping').insert({
            SliderId: sliderId,
            PictureId: pictureId,
        });
    } catch (error) {
        console.error("Error mapping slider to picture:\n", error);
        throw error;
    }
}

export async function DeleteSlider(sliderId, trx) {
    try {
        await trx('Slider_Picture_Mapping').where({ SliderId: sliderId }).del();
        await trx('Slider').where({ Id: sliderId }).del();
    } catch (error) {
        console.error("Error deleting slider:\n", error);
        throw error;
    }
}

export async function UpdateSlider(sliderId, updateData, trx) {
    try {
        const updateFields = {};

        // Dynamically add fields to updateFields if they are present in updateData
        for (const key in updateData) {
            if (updateData.hasOwnProperty(key)) {
                updateFields[key] = updateData[key];
            }
        }

        // Perform the update
        await trx('Slider')
            .where({ Id: sliderId })
            .update({
                ...updateFields,
            });

        console.log('Slider updated with ID:', sliderId);
    } catch (error) {
        console.error("Error updating slider:\n", error);
        throw error;
    }
}