import { getCartItems } from "../repositories/cartRepository";

const testUser = { id: 95806 };
const result = await getCartItems(testUser);
console.log("Test Result:", result);
