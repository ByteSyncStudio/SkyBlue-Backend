import knex from "../../../config/knex.js";
import {
  GetAllCampaign,
  PostCampaign,
} from "../../../repositories/campaign/adminCampaignRepository.js";

export async function getAllCampaignController(req, res) {
  try {
    const { storeId } = req.query; // Retrieve StoreId from query params if present
    const campaigns = await GetAllCampaign(storeId); // Pass StoreId to the repository function
    res
      .status(200)
      .json({ success: true, data: campaigns, length: campaigns.length });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching campaigns" });
  }
}

export async function editCampaignController(req, res) {
  const { id } = req.params;
  const {
    Name,
    Subject,
    Body,
    StoreId,
    CustomerRoleId,
    DontSendBeforeDateUtc,
    PictureId,
  } = req.body;

  try {
    await knex("Campaign").where({ Id: id }).update({
      Name,
      Subject,
      Body,
      StoreId,
      CustomerRoleId,
      DontSendBeforeDateUtc,
      PictureId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Campaign updated successfully" });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update campaign" });
  }
}

export async function postCampaignController(req, res) {
  try {
    // Extract the required fields from the request body
    const {
      Name,
      Subject,
      Body,
      StoreId,
      CustomerRoleId,
      DontSendBeforeDateUtc,
      PictureId,
    } = req.body;

    // Call the PostCampaign service function and pass the extracted data
    const result = await PostCampaign(
      Name,
      Subject,
      Body,
      StoreId,
      CustomerRoleId,
      DontSendBeforeDateUtc,
      PictureId
    );

    // Send the response back
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Error posting campaign:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create campaign" });
  }
}

export async function getWithIdCampaignController(req, res) {
  const { id } = req.params;
  try {
    const campaign = await knex("Campaign").where({ Id: id }).first(); // Fetch the campaign by ID
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }
    return res.status(200).json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch campaign" });
  }
}
