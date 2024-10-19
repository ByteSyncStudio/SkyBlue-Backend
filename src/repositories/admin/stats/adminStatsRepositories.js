import knex from "../../../config/knex.js";

//get stats
export const GetStats = async () => {
  try {
    const [totalCustomers, registeredCustomers, totalOrders, newOrders] =
      await Promise.all([
        knex("dbo.Customer").count("Id as totalCustomers").first(),
        knex("dbo.Customer")
          .where("Deleted", false)
          .count("Id as registeredCustomers")
          .first(),
        knex("dbo.Order").count("Id as totalOrders").first(),
        knex("dbo.Order")
          .where(
            "CreatedOnUtc",
            ">=",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
          .count("Id as newOrders")
          .first(),
      ]);

    return {
      totalCustomers: totalCustomers.totalCustomers,
      registeredCustomers: registeredCustomers.registeredCustomers,
      totalOrders: totalOrders.totalOrders,
      newOrders: newOrders.newOrders,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw new Error("Failed to fetch stats");
  }
};

export const GetOrderTotals = async () => {
  try {
    const endDate = new Date();
    const ranges = {
      today: [new Date().setHours(0, 0, 0, 0), endDate],
      week: [
        new Date(
          new Date().setDate(endDate.getDate() - endDate.getDay() + 1)
        ).setHours(0, 0, 0, 0),
        endDate,
      ],
      month: [new Date(endDate.getFullYear(), endDate.getMonth(), 1), endDate],
      year: [new Date(endDate.getFullYear(), 0, 1), endDate],
    };

    const totals = await Promise.all(
      Object.entries(ranges).map(async ([key, [startDate, endDate]]) => {
        const result = await knex("dbo.Order")
          .whereBetween("CreatedOnUtc", [new Date(startDate).toISOString(), new Date(endDate).toISOString()])
          .sum("OrderTotal as totalOrderAmount")
          .first();
        return { [key]: result.totalOrderAmount || 0 };
      })
    );

    const totalAllTime = await knex("dbo.Order")
      .sum("OrderTotal as totalOrderAmount")
      .first();

    return totals.reduce((acc, curr) => ({ ...acc, ...curr }), {
      allTime: totalAllTime.totalOrderAmount || 0,
    });
  } catch (error) {
    console.error("Error fetching order totals:", error);
    throw error;
  }
};

export const GetValueOrders = async () => {
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

    // Helper function to get counts for a given date range
    const getCountsForRange = async (startDate, endDate) => {
      const result = await knex("dbo.Order")
        .whereBetween("CreatedOnUtc", [startDate, endDate])
        .count("Id as totalOrders")
        .first();
      return result.totalOrders || 0;
    };

    // Fetch counts for today
    const totalToday = await getCountsForRange(todayStart, endDate);

    // Fetch counts for this week
    const totalWeek = await getCountsForRange(weekStart, endDate);

    // Fetch counts for this month
    const totalMonth = await getCountsForRange(monthStart, endDate);

    // Fetch counts for this year
    const totalYear = await getCountsForRange(yearStart, endDate);

    // Return all the counts
    return {
      today: totalToday,
      thisWeek: totalWeek,
      thisMonth: totalMonth,
      thisYear: totalYear,
    };
  } catch (error) {
    console.error("Error fetching order counts:", error);
    throw error;
  }
};

//getting active customers


export const GetActiveCustomers = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 8);
  

    // Fetch the top 150 most recent active customers with an email who registered in the past 6 months
    const customers = await knex("dbo.Customer")
      .select("Id", "Email")
      .where({ IsApproved: 1 })
      .whereNotNull("Email") // Ensure the email field is not null
      .andWhere("CreatedOnUtc", ">=", sixMonthsAgo)
      .orderBy("CreatedOnUtc", "desc")
      .limit(150);

    // Fetch orders and order items for each customer
    const customerDetails = await Promise.all(
      customers.map(async (customer) => {
        // Fetch orders for the customer
        const orders = await knex("dbo.Order")
          .select("Id", "OrderSubtotalExclTax")
          .where({ CustomerId: customer.Id });

        // If the customer has no orders, return null
        if (orders.length === 0) {
          return null;
        }

        // Fetch order items for each order
        const orderDetails = await Promise.all(
          orders.map(async (order) => {
            const orderItems = await knex("dbo.OrderItem")
              .select("Quantity")
              .where({ OrderId: order.Id });

            // Calculate total quantity from order items
            const totalQuantity = orderItems.reduce(
              (sum, item) => sum + item.Quantity,
              0
            );

            return {
              orderId: order.Id,
              orderSubtotalExclTax: order.OrderSubtotalExclTax,
              totalQuantity,
            };
          })
        );

        return {
          Email: customer.Email,
          orders: orderDetails,
          length: orderDetails.length,
        };
      })
    );

    // Filter out null values (customers with no orders)
    const filteredCustomerDetails = customerDetails.filter(
      (customer) => customer !== null
    );

    return filteredCustomerDetails;
  } catch (error) {
    console.error("Error fetching active customers:", error);
    throw error;
  }
};


export const GetNewCustomers = async () => {
  try {
    const endDate = new Date(); // End of the current day

    // Define date ranges
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(endDate.getMonth() - 3);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(endDate.getMonth() - 6);

    const yearStart = new Date(endDate.getFullYear(), 0, 1);

    // Helper function to get counts for a given date range
    const getCountForRange = async (startDate, endDate) => {
      const result = await knex("dbo.Customer")
        .whereBetween("CreatedOnUtc", [startDate, endDate])
        .count("Id as totalCustomers")
        .first();
      return result.totalCustomers || 0;
    };

    // Fetch counts for today
    const totalToday = await getCountForRange(todayStart, endDate);

    // Fetch counts for this month
    const totalMonth = await getCountForRange(monthStart, endDate);

    // Fetch counts for the last 3 months
    const totalThreeMonths = await getCountForRange(threeMonthsAgo, endDate);

    // Fetch counts for the past 6 months
    const totalSixMonths = await getCountForRange(sixMonthsAgo, endDate);

    // Fetch counts for this year
    const totalYear = await getCountForRange(yearStart, endDate);

    // Return all the counts
    return {
      today: totalToday,
      thisMonth: totalMonth,
      lastThreeMonths: totalThreeMonths,
      lastSixMonths: totalSixMonths,
      thisYear: totalYear,
    };
  } catch (error) {
    console.error('Error fetching new customers:', error);
    throw new Error('Failed to fetch new customers');
  }
};



export const GetBestSellersByQuantity = async () => {
  try {
    // Fetch best sellers by quantity
    const bestSellersByQuantity = await knex('dbo.OrderItem')
      .select('ProductId')
      .sum('Quantity as TotalQuantity')  // Sum total quantity for each product
      .groupBy('ProductId')
      .orderBy('TotalQuantity', 'desc')
      .limit(30); // Adjust limit as needed

    // Extract product IDs
    const productIds = bestSellersByQuantity.map(item => item.ProductId);

    // Fetch product details
    const products = await knex('dbo.Product')
      .select('Id', 'Name')
      .whereIn('Id', productIds);

    // Create a map of product details for quick lookup
    const productMap = new Map(products.map(product => [product.Id, product.Name]));

    // Enrich best sellers by quantity with product names and total quantity
    const enrichedBestSellersByQuantity = bestSellersByQuantity.map(item => ({
      ProductId: item.ProductId,
      Quantity: item.TotalQuantity,  // Total quantity sold for the product
      Name: productMap.get(item.ProductId) || 'Unknown',  // Get the product name or use 'Unknown'
    }));

    return enrichedBestSellersByQuantity;
  } catch (error) {
    console.error("Error fetching best sellers by quantity:", error);
    throw error;
  }
};



export const GetBestSellerByAmount = async (req, res) => {
  try {
    // Fetch best sellers by amount and quantity
    const bestSellersByAmount = await knex('dbo.OrderItem')
      .select('ProductId')
      .sum('PriceExclTax as TotalAmount')
      .sum('Quantity as TotalQuantity')  // Add total quantity
      .groupBy('ProductId')
      .orderBy('TotalAmount', 'desc')
      .limit(500); // Adjust limit as needed

    // Extract product IDs
    const productIds = bestSellersByAmount.map(item => item.ProductId);

    // Fetch product details
    const products = await knex('dbo.Product')
      .select('Id', 'Name')
      .whereIn('Id', productIds);

    // Create a map of product details for quick lookup
    const productMap = new Map(products.map(product => [product.Id, product.Name]));

    // Enrich best sellers by amount with product names and quantities
    const enrichedBestSellersByAmount = bestSellersByAmount.map(item => ({
      ProductId: item.ProductId,
      Amount: item.TotalAmount,
      Quantity: item.TotalQuantity,  // Include total quantity
      Name: productMap.get(item.ProductId) || 'Unknown',
    }));

    return enrichedBestSellersByAmount;
  } catch (error) {
    console.error("Error fetching best sellers by amount:", error);
    throw error;
  }
};

export async function TotalOrdersByPeriod(period) {
  try {
    const currentDate = new Date();
    let startDate, endDate, dateIncrement, formatDate, groupByFormat;

    if (period === 'year') {
      startDate = new Date(Date.UTC(currentDate.getUTCFullYear() - 1, currentDate.getUTCMonth(), 1));
      endDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() + 1));
      dateIncrement = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
      formatDate = (date) => `${date.toLocaleString('default', { month: 'short' })} ${date.getUTCFullYear()}`;
      groupByFormat = 'yyyy-MM';
    } else if (period === 'month') {
      startDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - 29));
      endDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() + 1));
      dateIncrement = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
      formatDate = (date) => `${date.toLocaleString('default', { month: 'short' })} ${date.getUTCDate()}`;
      groupByFormat = 'yyyy-MM-dd';
    } else if (period === 'week') {
      startDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - 6));
      endDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() + 1));
      dateIncrement = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
      formatDate = (date) => `${date.toLocaleString('default', { month: 'short' })} ${date.getUTCDate()}`;
      groupByFormat = 'yyyy-MM-dd';
    } else {
      throw new Error('Invalid period');
    }

    const orders = await knex('Order')
      .select(knex.raw(`FORMAT(CreatedOnUtc, '${groupByFormat}') as date`))
      .count('* as total')
      .where('CreatedOnUtc', '>=', startDate.toISOString())
      .andWhere('Deleted', 0)
      .groupByRaw(`FORMAT(CreatedOnUtc, '${groupByFormat}')`)
      .orderBy('date');

    const dateMap = new Map(orders.map(order => [order.date, parseInt(order.total)]));

    const result = [];
    for (let date = startDate; date < endDate; date = dateIncrement(date)) {
      const formattedDate = formatDate(date);
      const dateKey = date.toISOString().split('T')[0].slice(0, groupByFormat === 'yyyy-MM' ? 7 : 10);
      result.push({
        date: formattedDate,
        orders: dateMap.get(dateKey) || 0
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching total orders:', error);
    throw error;
  }
}

export async function NewCustomersInPastMonths() {
  try {
    const currentDate = new Date();
    const result = [];

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1; // JavaScript months are 0-indexed

      const orders = await knex('Customer')
        .count('* as total')
        .where('CreatedOnUtc', '>=', `${year}-${month.toString().padStart(2, '0')}-01`)
        .andWhere('CreatedOnUtc', '<', `${year}-${(month + 1).toString().padStart(2, '0')}-01`)
        .andWhere('Deleted', 0)
        .first();

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      result.push({
        month: monthNames[month - 1],
        customers: parseInt(orders.total)
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching total orders:', error);
    throw error;
  }
}