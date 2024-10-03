import { GetUserInfo, ChangePassword, UpdateUserInfo, GetCustomerOrders, GetSingleCustomerOrders, GetCountryList, GetStateList, GetWishListItems, AddToWishList, RemoveFromWishList, WishlistCheck } from '../repositories/customerRepository.js'


export async function getCustomerInfo(req, res) {
    try {
        const result = await GetUserInfo(req.user);
        res.status(200).send(result)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'currentPassword and newPassword fields are required' });
            return;
        }

        const result = await ChangePassword(req.user, currentPassword, newPassword);
        res.status(result.statusCode || 200).json(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function updateCustomerInfo(req, res) {
    try {
        const result = await UpdateUserInfo(req.user, req.body)
        res.status(result.statusCode || 200).json(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function getCountryList(req, res) {
    try {
        const result = await GetCountryList();
        res.status(result.statusCode || 200).json(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function getStateList(req, res) {
    try {
        const countryId = req.params.id;
        const result = await GetStateList(countryId );
        res.status(result.statusCode || 200).json(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}



export async function getCustomerOrders(req, res) {
    try {
      //console.log(req.user);
      const result = await GetCustomerOrders(req.user);
      res.status(200).send({
        success: true,
        message: "Orders retrieved successfully.",
        data: result
      });
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Server error'
      });
    }
  }


  export async function getSingleCustomerOrders(req, res) {
    try {
        const orderId = parseInt(req.params.id, 10);  // Ensure orderId is parsed as an integer

        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'Invalid Order ID.' });
        }

        const orderDetails = await GetSingleCustomerOrders(orderId);  // Fetch the order details

        if (!orderDetails) {
            return res.status(404).json({ message: 'No order items found for this order ID.' });
        }

        res.status(200).json(orderDetails);  // Send the order details as a response
    } catch (error) {
        console.error("Error fetching single customer order:", error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function getWishListItems(req, res) {
    try {
        const items = await GetWishListItems(req.user);
        res.status(200).send(items);
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(error.statusCode || 500).json(error.message || 'Server error');
    }
}

export async function addToWishList(req, res) {
    try {
        const response = await AddToWishList(req.user, req.params.id);
        res.status(200).send(response);
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(error.statusCode || 500).json(error.message || 'Server error');
    }
}

export async function removeFromWishList(req, res) {
    try {
        const response = await RemoveFromWishList(req.user, req.params.id);
        res.status(200).send(response);
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(error.statusCode || 500).json(error.message || 'Server error');
    }
}

export async function wishlistCheck(req, res) {
    try {
        res.status(200).send(await WishlistCheck(req.user, req.params.id))
    } catch (error) {
        console.error("Error checking wishlist:", error);
        res.status(error.statusCode || 500).json(error.message || 'Server error');
    }
}