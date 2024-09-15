import knex from "../config/knex.js";

// Calculate total price with tax
async function calculateTotalPriceWithTax(customerEmail, cartItems) {
  try {
    // Determine if customerEmail is an object or a string
    const email =
      typeof customerEmail === "object" ? customerEmail.Email : customerEmail;

    // Fetch customer address details based on email
    const address = await knex("Address")
      .where("Email", email) // Ensure email is treated as a string
      .select("StateProvinceId", "CountryId")
      .first();

    if (!address) {
      throw new Error("Address not found for the given email.");
    }

    const { StateProvinceId, CountryId } = address;

    if (!StateProvinceId) {
      throw new Error("State province ID not found in the address. Please add your state/province.");
    }

    if (!CountryId) {
      throw new Error("Country ID not found in the address. Please add your country.");
    }

    // Fetch state province details
    const stateProvince = await knex("StateProvince")
      .where("Id", StateProvinceId)
      .select("CountryId")
      .first();

    if (!stateProvince) {
      throw new Error("State province not found.");
    }

    // Fetch tax rate based on state province and country
    const taxRate = await knex("TaxRate")
      .where({ StateProvinceId, CountryId })
      .select("Percentage")
      .first();
    if (!taxRate) {
      throw new Error(
        "Tax rate not found for the given state province and country."
      );
    }

    // Calculate total price based on discount logic
    let totalPrice = 0;
    cartItems.forEach((item) => {
      let itemPrice;

      console.log("Item:", item);

      // Use FinalPrice if there's a discount, otherwise use Price
      if (item.Discount && item.Discount > 0) {
        itemPrice = item.FinalPrice;
      } else {
        itemPrice = item.Price;
      }

      if (typeof itemPrice === "number" && typeof item.Quantity === "number") {
        totalPrice += itemPrice * item.Quantity;
      } else {
        console.error("Invalid item data:", item);
      }
    });

    // Calculate tax amount and final price
    const taxAmount = (totalPrice * taxRate.Percentage) / 100;
    const finalPrice = totalPrice + taxAmount;

    return {
      totalPrice,
      taxAmount,
      finalPrice,
      taxRate: taxRate.Percentage,
    };
  } catch (error) {
    console.error("Error calculating total price with tax:", error);
    throw new Error("Failed to calculate total price with tax.");
  }
}

export { calculateTotalPriceWithTax };