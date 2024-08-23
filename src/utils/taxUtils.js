import knex from "../config/knex.js";

// Calculate total price with tax
async function calculateTotalPriceWithTax(email, cartItems) {
  try {
    // Fetch customer address details
    const address = await knex("Address")
      .where("Email", email)
      .select("StateProvinceId")
      .first();

    if (!address) {
      throw new Error("Address not found for the given email.");
    }

    const { StateProvinceId } = address;

    // Fetch state province details
    const stateProvince = await knex("StateProvince")
      .where("Id", StateProvinceId)
      .select("CountryId")
      .first();

    if (!stateProvince) {
      throw new Error("State province not found.");
    }

    const { CountryId } = stateProvince;

    // Fetch tax rate based on state province and country
    const taxRate = await knex("TaxRate")
      .where({ StateProvinceId, CountryId })
      .select("Percentage")
      .first();

    if (!taxRate) {
      throw new Error("Tax rate not found for the given state province and country.");
    }

    // Calculate total price
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.Price * item.Quantity;
    });

    // Calculate tax amount and final price
    //console.log("taxRate.Percentage", taxRate.Percentage)
    const taxAmount = (totalPrice * taxRate.Percentage) / 100;
    const finalPrice = totalPrice + taxAmount;

    return {
      totalPrice,
      taxAmount,
      finalPrice,
    };
  } catch (error) {
    console.error("Error calculating total price with tax:", error);
    throw new Error("Failed to calculate total price with tax.");
  }
}

export { calculateTotalPriceWithTax };
