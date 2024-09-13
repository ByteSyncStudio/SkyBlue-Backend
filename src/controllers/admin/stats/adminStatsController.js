import { GetallCustomerStats, GetallOrderStats, GetOrderTotals } from "../../../repositories/admin/stats/adminStatsRepositories.js";

export const getallOrderStats = async (req, res) => {
  try {
    // Get filter options from query parameters (default to 'week')
    const filter = req.query.filter || 'week';
    
    // Call the repository function to fetch data based on the filter
    const orderStats = await GetallOrderStats(filter);

    res.status(200).json({ success: true, data: orderStats });
  } catch (error) {
    console.log("Error on getting Orders");
    res.status(500).json({ success: false, message: "Failed to fetch order stats" });
  }
}

export const getallCustomerStats = async (req, res) => {
  try {
    // Get filter options from query parameters (default to 'week')
    const filter = req.query.filter || 'week';

    // Call the repository function to fetch data based on the filter
    const customerStats = await GetallCustomerStats(filter);

    res.status(200).json({ success: true, data: customerStats });
  } catch (error) {
    console.log("Error on getting Customers");
    res.status(500).json({ success: false, message: "Failed to fetch customer stats" });
  }
}

export const getOrderTotals = async (req, res) => {
  try {
    // Get totals for today, week, month, and year
    const totals = await GetOrderTotals();

    res.status(200).json({
      success: true,
      totals,
    });
  } catch (error) {
    console.log("Error fetching order totals with tax:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
