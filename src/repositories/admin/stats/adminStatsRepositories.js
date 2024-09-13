import knex from "../../../config/knex.js";

// Function to fetch order stats based on the filter
export const GetallOrderStats = async (filter) => {
  try {
    let dateRange = getDateRange(filter);

    // Query to get total number of orders within the date range
    const orderCount = await knex('dbo.Order')
      .whereBetween('CreatedonUtc', [dateRange.start, dateRange.end])
      .count('Id as totalOrders')
      .first();

    return {
      totalOrders: orderCount.totalOrders,
      dateRange: dateRange,  // Returning the date range for reference
    };
  } catch (error) {
    console.error("Error fetching order stats:", error);
    throw new Error("Failed to fetch order stats");
  }
};

// Function to fetch customer stats based on the filter
export const GetallCustomerStats = async (filter) => {
  try {
    let dateRange = getDateRange(filter);

    // Query to get total number of customers within the date range
    const customerCount = await knex('dbo.Customer')
      .whereBetween('CreatedonUtc', [dateRange.start, dateRange.end])
      .count('Id as totalCustomers')
      .first();

    return {
      totalCustomers: customerCount.totalCustomers,
      dateRange: dateRange,  // Returning the date range for reference
    };
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    throw new Error("Failed to fetch customer stats");
  }
};

export const GetOrderTotals = async () => {
  try {
    const endDate = new Date(); // End of the current day

    // Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Beginning of today

    // This week (assuming Monday as the first day)
    const weekStart = new Date();
    const dayOfWeek = endDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Get difference to Monday
    weekStart.setDate(endDate.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // This month
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1); // Beginning of this month

    // This year
    const yearStart = new Date(endDate.getFullYear(), 0, 1); // Beginning of this year

    // Helper function to get totals for a given date range
    const getTotalsForRange = async (startDate, endDate) => {
      return await knex('dbo.Order')
        .whereBetween('CreatedOnUtc', [startDate, endDate])
        .select(
          knex.raw('SUM(OrderTotal) as totalOrderAmount'),
          knex.raw('SUM(OrderTotal + OrderTax) as totalOrderAmountWithTax')
        )
        .first();
    };

    // Fetch totals for today
    const totalToday = await getTotalsForRange(todayStart, endDate);

    // Fetch totals for this week
    const totalWeek = await getTotalsForRange(weekStart, endDate);

    // Fetch totals for this month
    const totalMonth = await getTotalsForRange(monthStart, endDate);

    // Fetch totals for this year
    const totalYear = await getTotalsForRange(yearStart, endDate);

    // Return all the totals
    return {
      today: totalToday || { totalOrderAmount: 0, totalOrderAmountWithTax: 0 },
      thisWeek: totalWeek || { totalOrderAmount: 0, totalOrderAmountWithTax: 0 },
      thisMonth: totalMonth || { totalOrderAmount: 0, totalOrderAmountWithTax: 0 },
      thisYear: totalYear || { totalOrderAmount: 0, totalOrderAmountWithTax: 0 },
    };
  } catch (error) {
    console.error("Error fetching order totals with tax:", error);
    throw error;
  }
};


// Utility function to get the start and end date range for week, month, or year
const getDateRange = (filter) => {
  const today = new Date();
  let start, end;

  switch (filter) {
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);  // January 1st
      end = new Date(today.getFullYear(), 11, 31);  // December 31st
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);  // First day of the current month
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);  // Last day of the current month
      break;
    case 'week':
    default:
      const startOfWeek = today.getDate() - today.getDay();  // Subtract days to get Sunday
      start = new Date(today.setDate(startOfWeek));
      end = new Date(today.setDate(startOfWeek + 6));  // Add 6 days to get Saturday
      break;
  }

  return { start, end };
};
