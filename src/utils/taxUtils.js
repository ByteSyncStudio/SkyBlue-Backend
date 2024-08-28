import knex from "../config/knex.js";

// Calculate total price with tax
async function calculateTotalPriceWithTax(email, cartItems) {
  try {
    //console.log("Email:", email); // Debug output

    // Fetch customer address details based on email
    const address = await knex("Address")
      .where("Email", email) // Ensure email is treated as a string
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

    //console.log("Tax Rate Percentage:", taxRate.Percentage); // Debug output

    // Calculate total price
    let totalPrice = 0;
    cartItems.forEach(item => {
      //console.log("Item Price:", item.Price, "Item Quantity:", item.Quantity); // Debug output
      if (typeof item.Price === 'number' && typeof item.Quantity === 'number') {
        totalPrice += item.Price * item.Quantity;
      } else {
        console.error("Invalid item data:", item);
      }
    });

    // Calculate tax amount and final price
    const taxAmount = (totalPrice * taxRate.Percentage) / 100;
    const finalPrice = totalPrice + taxAmount;

    //console.log("Total Price:", totalPrice, "Tax Amount:", taxAmount, "Final Price:", finalPrice); // Debug output

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
