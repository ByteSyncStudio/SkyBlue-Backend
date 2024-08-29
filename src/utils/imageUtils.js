// src/utils/imageUtils.js
/**
 * Generates the image URL for a PRODUCT.
 * 
 * @param {number} pictureId - The ID of the picture.
 * @param {string} mimeType - The MIME type of the picture.
 * @returns {string} The generated image URL.
 */
export function generateImageUrl(pictureId, mimeType) {
    const formattedId = pictureId.toString().padStart(7, '0');
    const fileExtension = mimeType ? mimeType.split('/')[1] : 'jpg';
    return `https://skybluewholesale.com/content/images/${formattedId}_0.${fileExtension}`;
}


// src/utils/imageUtils.js
/**
 * Generates the image URL for a PRODUCT.
 * 
 * @param {number} pictureId - The ID of the picture.
 * @param {string} mimeType - The MIME type of the picture.
 * @param {string} seoFilename - The SEO filename of the picture.
 * @returns {string} The generated image URL.
 */
export function generateImageUrl2(pictureId, mimeType, seoFilename) {
    const formattedId = pictureId.toString().padStart(7, '0');
    const fileExtension = mimeType ? mimeType.split('/')[1] : 'jpg';
    return `https://skybluewholesale.com/content/images/thumbs/${formattedId}_${seoFilename}.${fileExtension}`;
}