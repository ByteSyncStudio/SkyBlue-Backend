import multer from "multer";
import knex from "../../../config/knex.js";
import {
  GetAllCampaign,
  getPictureFromDatabase,
  PostCampaign,
} from "../../../repositories/campaign/adminCampaignRepository.js";
import { queueFileUpload } from "../../../config/ftpsClient.js";
import { generateImageUrl2 } from "../../../utils/imageUtils.js";

const upload = multer({ dest: "uploads/" }); // Destination folder for uploads

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

export async function deleteCampaignController(req, res) {
  const { id } = req.params;
  try {
    const deletecampaign = await knex("Campaign").where({ Id: id }).del();
    if (!deletecampaign) {
      return res
        .status(404)
        .json({ success: false, message: "Error deleting campaign" });
    }
    return res.status(200).json(deletecampaign);
  } catch (error) {
    console.error("Error deleteing campaign:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch campaign" });
  }
}

// Upload image function
export const uploadImage = [
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file; // Using single file upload
      console.log("File:", file);

      // Check if the file was uploaded
      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }

      // Define the URL for the uploaded image
      const imageUrl = `/uploads/${file.filename}`; // URL of the uploaded image
      console.log("Uploaded Image URL:", imageUrl);

      // Insert picture details into the database
      const pictureId = await addPictureToDatabase(file); // Handle database insertion
      console.log("Picture added with ID:", pictureId);

      // Prepare additional information for processing
      const seoFilename = file.filename; // Customize this as necessary
      const fileExtension = file.mimetype.split("/")[1]; // Extract the file extension
      const formattedId = pictureId.toString().padStart(7, "0"); // Format the ID
      const remotePath = `/acc1845619052/SkyblueWholesale/Content/images/thumbs/${formattedId}_${seoFilename}.${fileExtension}`;

      console.log("Queueing file upload:", file.path, "to", remotePath);
      queueFileUpload(file.path, remotePath); // Add to upload queue

      // Send the response back to the client

      res.json({ success: true, url: imageUrl, pictureId: pictureId });
    } catch (error) {
      console.error("Error uploading image:", error);
      res
        .status(500)
        .json({ success: false, message: "Error uploading image." });
    }
  },
];
// Function to insert picture details into the database
async function addPictureToDatabase(file) {
  try {
    console.log("File", file.mimetype);
    const result = await knex("Picture")
      .insert({
        // Ensure table name matches your schema
        MimeType: file.mimetype,
        SeoFilename: file.filename,
        AltAttribute: "",
        TitleAttribute: "",
        IsNew: true,
      })
      .returning("Id"); // Adjust according to your DB structure

    return result[0].Id; // Assuming the ID is returned in this format
  } catch (error) {
    console.error("Error inserting picture into database:", error);
    throw error; // Throw the error to be handled in the uploadImage function
  }
}

export const getPictureById = async (req, res) => {
  const { id } = req.params;
  console.log(id, "This is the id asdsad");

  try {
    const pictureData = await getPictureFromDatabase(id);

    console.log("pictureData", pictureData);

    if (!pictureData) {
      return res
        .status(404)
        .json({ success: false, message: "Picture not found." });
    }

    const { Id, MimeType, SeoFilename } = pictureData;
    const imageUrl = generateImageUrl2(Id, MimeType, SeoFilename);
    console.log(imageUrl, "This is the image url");

    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error("Error retrieving picture:", error);
    res
      .status(500)
      .json({ success: false, message: "Error retrieving picture." });
  }
};
