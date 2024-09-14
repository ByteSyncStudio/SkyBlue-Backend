import knex from "../../../config/knex.js";

export async function AddSlider(slider, trx) {
    try {
        const [sliderId] = await trx('Slider').insert({
            Type: slider.type,
            DisplayOrder: slider.displayOrder,
            Link: slider.link
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

        // Ensure updateData is an object
        if (typeof updateData === 'object' && updateData !== null) {
            // Dynamically add fields to updateFields if they are present in updateData
            for (const key in updateData) {
                if (Object.prototype.hasOwnProperty.call(updateData, key)) {
                    let newKey = key.charAt(0).toUpperCase() + key.slice(1);
                    if (key === 'link') {
                        newKey = 'Link';
                    } else if (key === 'image') {
                        newKey = 'Image';
                    } else if (key === 'displayOrder') {
                        newKey = 'DisplayOrder';
                    } else if (key === 'pictureId') {
                        // Handle the new pictureId separately
                        await trx('Slider_Picture_Mapping')
                            .where({ SliderId: sliderId })
                            .update({ PictureId: updateData[key] });
                        continue; // Skip adding pictureId to updateFields
                    }
                    updateFields[newKey] = updateData[key];
                }
            }
        }

        // Only perform the update if there are fields to update
        if (Object.keys(updateFields).length > 0) {
            await trx('Slider')
                .where({ Id: sliderId })
                .update(updateFields);
        }

        console.log('Slider updated with ID:', sliderId);
    } catch (error) {
        console.error("Error updating slider:\n", error);
        throw error;
    }
}

export async function GetSliderByType(type) {
    try {
        const sliders = await knex('Slider')
            .join('Slider_Picture_Mapping', 'Slider.Id', 'Slider_Picture_Mapping.SliderId')
            .join('Picture', 'Slider_Picture_Mapping.PictureId', 'Picture.Id')
            .select('Slider.Id as SliderId', 'Slider.DisplayOrder', 'Slider.Link', 'Picture.Id as PictureId', 'Picture.MimeType')
            .where('Slider.Type', type)
            .orderBy('Slider.Id', 'desc');

        return sliders.map(slider => {
            const formattedId = slider.PictureId.toString().padStart(7, '0');
            const fileExtension = slider.MimeType.split('/')[1];
            const image = `https://skybluewholesale.com/Content/Images/Sliders/${formattedId}.${fileExtension}`;
            return { sliderId: slider.SliderId, image, link: slider.Link, displayOrder: slider.DisplayOrder};
        });
    } catch (error) {
        console.error("Error fetching sliders by type:\n", error);
        throw error;
    }
}