import knex from "../../config/knex.js";

export async function GetAllCampaign(storeId) {
  try {
    // Fetch all campaigns or filter by StoreId if it's provided
    const query = knex("Campaign").select("Id","Name", "CreatedOnUtc", "DontSendBeforeDateUtc");

    if (storeId) {
      query.where({ StoreId: storeId });
    }

    const campaigns = await query;
    return campaigns;
  } catch (error) {
    console.log("Error fetching campaigns:", error);
    throw error; // Rethrow the error to be caught by the controller
  }
}


// Service to create a new campaign
export async function PostCampaign(Name, Subject, Body, StoreId, CustomerRoleId, DontSendBeforeDateUtc, PictureId) {
  try {
    // Insert the new campaign into the database
    const [newCampaignId] = await knex("Campaign")
      .insert({
        Name,
        Subject,
        Body,
        StoreId,
        CustomerRoleId,
        DontSendBeforeDateUtc,
        PictureId,
        CreatedOnUtc: knex.fn.now() // Set creation date to current timestamp
      })
      .returning("Id"); // Return the newly created campaign's ID

    // Return the ID of the newly created campaign
    return { newCampaignId };
  } catch (error) {
    console.log("Error creating campaign:", error);
    throw error; // Rethrow the error to be caught by the controller
  }
}

export async function PostImageComapign() {
  
}


export const getPictureFromDatabase = async (pictureId) => {
  try {
    const result = await knex('Picture')
      .select('Id', 'MimeType', 'SeoFilename')
      .where('Id', pictureId)
      .first(); // Get the first record

    return result;
  } catch (error) {
    console.error('Error querying database:', error);
    throw error; // Throw the error to be handled in the controller
  }
};