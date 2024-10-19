import {  GetActiveCustomers, GetBestSellerByAmount, GetBestSellersByQuantity, GetNewCustomers, GetOrderTotals, GetStats, GetValueOrders, NewCustomersInPastMonths, TotalCustomersByPeriod, TotalOrdersByPeriod } from "../../../repositories/admin/stats/adminStatsRepositories.js";


//getting stats for heaader
export const getStats = async (req, res) => {
  try {
    const stats = await GetStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//getting stats for Orders in amount
export const getOrderStats= async (req, res) => {
  try {
    // Call the repository function to fetch data
    const orderStats = await GetOrderTotals();

    res.status(200).json({ success: true, data: orderStats });
  } catch (error) {
    console.log("Error on getting Orders");
    res.status(500).json({ success: false, message: "Failed to fetch order stats" });
  }
}

//getting stats of how much Orders in values
export const getValueOrders = async (req, res) => {
  try {
    const orderValues = await GetValueOrders()
    res.status(200).json({ success: true, values: orderValues });
  } catch (error) {
    console.log("Erroor");
  }
}

//getting stats of active customers
export const getActiveCustomers = async (req, res) => {
  try {
    const activeCustomers = await GetActiveCustomers();
    res.json(activeCustomers);
  } catch (error) {
    console.error("Error fetching active customers:", error);
    res.status(500).json({ error: "Failed to retrieve active customers." });
  }
};

//getting stats of new customers ac to year month and day
export const getNewCustomers = async (req, res) => {
  try {
    const result = await GetNewCustomers();
    res.json(result);
  } catch (error) {
    console.error('Error fetching new customers:', error);
    res.status(500).json({ error: 'Failed to fetch new customers' });
  }
}

//getting stats of best sellers

export const getBestSellerByQunatity = async (req, res) => {
  try {
    const data = await GetBestSellersByQuantity();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch best sellers by quantity' });
  }
}

export const getBestSellerByAmount = async (req, res) => {
  try {
    const data = await GetBestSellerByAmount();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch best sellers by amount' });
  }
}

export async function totalOrdersByPeriod(req, res) {
  try {
    const period = req.query.period;
    const data = await TotalOrdersByPeriod(period);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function totalCustomersByPeriod(req, res) {
  try {
    const period = req.query.period;
    const data = await TotalCustomersByPeriod(period);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function newCustomersInPastMonths(req, res) {
  try {
    const data = await NewCustomersInPastMonths();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}