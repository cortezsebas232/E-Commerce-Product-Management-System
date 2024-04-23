const validator = require("../utils/validator");
const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");

//Creating order
const orderCreation = async (req, res) => {
    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        const userIdFromToken = req.userId;

        //validation for request body
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({status: false, message: "Invalid request body. Please provide the the input to proceed."});
        }
        //Extract parameters
        const { cartId, cancellable, status } = requestBody;

        //validating userId
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." });
        }

        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) {
            return res.status(400).send({status: false, message: `user doesn't exists for ${userId}`});
        }
        //Authentication & authorization
        if (searchUser._id.toString() != userIdFromToken) {
           return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });   
        }

        if (!cartId) {
            return res.status(400).send({status: false, message: `Cart doesn't exists for ${userId}`});
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({status: false, message: `Invalid cartId in request body.`});
        }

        //searching cart to match the cart by userId whose is to be ordered.
        const searchCartDetails = await cartModel.findOne({_id: cartId, userId: userId});
        if (!searchCartDetails) {
            return res.status(400).send({status: false,message: `Cart doesn't belongs to ${userId}`});
        }

        //must be a boolean value.
        if (cancellable) {
            if (typeof cancellable != "boolean") {
                return res.status(400).send({status: false,message: `Cancellable must be either 'true' or 'false'.`})}
        }

        // must be either - pending , completed or cancelled.
        if (status) {
            if (!validator.isValidStatus(status)) {
                return res.status(400).send({status: false,message: `Status must be among ['pending','completed','cancelled'].`})}
        }

        //verifying whether the cart is having any products or not.
        if (!searchCartDetails.items.length) {
            return res.status(202).send({status: false, message: `Order already placed for this cart. Please add some products in cart to make an order.`});
        }

        //adding quantity of every products
        const reducer = (previousValue, currentValue) => previousValue + currentValue;

        let totalQuantity = searchCartDetails.items.map((x) => x.quantity).reduce(reducer);

        //object destructuring for response body.
        const orderDetails = {
            userId: userId,
            items: searchCartDetails.items,
            totalPrice: searchCartDetails.totalPrice,
            totalItems: searchCartDetails.totalItems,
            totalQuantity: totalQuantity,
            cancellable,
            status,
        };
        const savedOrder = await orderModel.create(orderDetails);

        //Empty the cart after the successfull order
        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, {
            $set: {
                items: [],
                totalPrice: 0,
                totalItems: 0,
            }});
        return res.status(200).send({ status: true, message: "Order placed.", data: savedOrder });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

//updating order status.
const updateOrder = async (req, res) => {
    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        const userIdFromToken = req.userId

        //validating request body.
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({status: false, message: "Invalid request body. Please provide the the input to proceed."});
        }
        //extract params
        const { orderId, status } = requestBody;
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." });
        }
        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) {
            return res.status(400).send({status: false, message: `user doesn't exists for ${userId}`});
        }

        //Authentication & authorization
        if (searchUser._id.toString() != userIdFromToken) {
           return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
            
        }

        if (!orderId) {
            return res.status(400).send({status: false, message: `Order doesn't exists for ${orderId}`});
        }

        //verifying does the order belongs to user or not.
        isOrderBelongsToUser = await orderModel.findOne({ userId: userId });
        if (!isOrderBelongsToUser) {
            return res.status(400).send({status: false, message: `Order doesn't belongs to ${userId}`});
        }

        if (!status) {
            return res.status(400).send({status: false, message: "Mandatory paramaters not provided. Please enter current status of the order."});
        }
        if (!validator.isValidStatus(status)) {
            return res.status(400).send({status: false, message: "Invalid status in request body. Choose either 'pending','completed', or 'cancelled'."});
        }

        //if cancellable is true then status can be updated to any of te choices.
        if (isOrderBelongsToUser["cancellable"] == true) {
            if ((validator.isValidStatus(status))) {
                if (isOrderBelongsToUser['status'] == 'pending') {
                    const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, {
                        $set: { status: status }
                    }, { new: true })
                    return res.status(200).send({ status: true, message: `Successfully updated the order details.`, data: updateStatus })
                }

                //if order is in completed status then nothing can be changed/updated.
                if (isOrderBelongsToUser['status'] == 'completed') {
                    return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in completed status.` })
                }

                //if order is already in cancelled status then nothing can be changed/updated.
                if (isOrderBelongsToUser['status'] == 'cancelled') {
                    return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in cancelled status.` })
                }
            }
        }
        //for cancellable : false
        if (isOrderBelongsToUser['status'] == "completed") {
            if (status) {
                return res.status(400).send({ status: false, message: `Cannot update or change the status, because it's already in completed status.` })
            }
        }

        if (isOrderBelongsToUser['status'] == "cancelled") {
            if (status) {
                return res.status(400).send({ status: false, message: `Cannot update or change the status, because it's already in cancelled status.` })
            }
        }

        if (isOrderBelongsToUser['status'] == "pending") {
            if (status) {
                if (status == "cancelled") {
                    return res.status(400).send({ status: false, message: `Cannot cancel the order due to Non-cancellable policy.` })
                }
                if (status == "pending") {
                    return res.status(400).send({ status: false, message: `Cannot update status from pending to pending.` })
                }

                const updatedOrderDetails = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })

                return res.status(200).send({ status: true, message: `Successfully updated the order details.`, data: updatedOrderDetails })
               
            }
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = {
    orderCreation,
    updateOrder,
};
