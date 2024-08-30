import knex from "../config/knex.js";

// Calculate total price with tax
async function calculateTotalPriceWithTax(customerEmail, cartItems) {
  try {
    // Determine if customerEmail is an object or a string
    const email = typeof customerEmail === 'object' ? customerEmail.Email : customerEmail;

    // Fetch customer address details based on email
    const address = await knex("Address")
      .where("Email", email) // Ensure email is treated as a string
      .select("StateProvinceId")
      .first();
    console.log("Address:", address); // Debug output

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
      throw new Error(
        "Tax rate not found for the given state province and country."
      );
    }

    // Calculate total price
    let totalPrice = 0;
    cartItems.forEach((item) => {
      if (typeof item.Price === "number" && typeof item.Quantity === "number") {
        totalPrice += item.Price * item.Quantity;
      } else {
        console.error("Invalid item data:", item);
      }
    });

    // Calculate tax amount and final price
    const taxAmount = (totalPrice * taxRate.Percentage) / 100;
    const finalPrice = totalPrice + taxAmount;

    console.log(
      "Total Price:",
      totalPrice,
      "Tax Amount:",
      taxAmount,
      "Final Price:",
      finalPrice
    ); // Debug output

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