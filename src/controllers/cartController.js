const validator = require('../utils/validator')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')

const cartCreation = async function (req, res) {
    try {
        const userId = req.params.userId
        const requestBody = req.body;
        const { quantity, productId } = requestBody
        let userIdFromToken = req.userId;

        //validating starts.
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        }
        if (!validator.isValidObjectId(productId) || !validator.isValid(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" })
        }

        if (!validator.isValid(quantity) || !validator.validQuantity(quantity)) {
            return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." })
        }
        //validation ends.

        const findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` })
        }

        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` })
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId }) //finding cart related to user.

        if (!findCartOfUser) {

            //destructuring for the response body.
            var cartData = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: quantity,
                }],
                totalPrice: findProduct.price * quantity,
                totalItems: 1
            }

            const createCart = await cartModel.create(cartData)
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart })
        }

        if (findCartOfUser) {

            //updating price when products get added or removed.
            let price = findCartOfUser.totalPrice + (req.body.quantity * findProduct.price)
            let itemsArr = findCartOfUser.items

            //updating quantity.
            for (i in itemsArr) {
                if (itemsArr[i].productId.toString() === productId) {
                    itemsArr[i].quantity += quantity

                    let updatedCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }

                    let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true })

                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })
                }
            }
            itemsArr.push({ productId: productId, quantity: quantity }) //storing the updated prices and quantity to the newly created array.

            let updatedCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true })

            return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })
        }
    } catch (err) {
        res.status(500).send({ status: false, data: err.message });
    }
}

//update cart.
const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let requestBody = req.body;
        let userIdFromToken = req.userId;

        //validation starts.
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in body" })
        }

        let findUser = await userModel.findOne({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: "UserId does not exits" })
        }

        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
        }

        //Extract body
        const { cartId, productId, removeProduct } = requestBody
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide cart details.' })
        }

        //cart validation
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Invalid cartId in body" })
        }
        let findCart = await cartModel.findById({ _id: cartId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "cartId does not exists" })
        }

        //product validation
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId in body" })
        }
        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(400).send({ status: false, message: "productId does not exists" })
        }

        //finding if products exits in cart
        let isProductinCart = await cartModel.findOne({ items: { $elemMatch: { productId: productId } } })
        if (!isProductinCart) {
            return res.status(400).send({ status: false, message: `This ${productId} product does not exists in the cart` })
        }

        //removeProduct validation either 0 or 1.
        if (!(!isNaN(Number(removeProduct)))) {
            return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1` })
        }

        //removeProduct => 0 for product remove completely, 1 for decreasing its quantity.
        if (!((removeProduct === 0) || (removeProduct === 1))) {
            return res.status(400).send({ status: false, message: 'removeProduct should be 0 (product is to be removed) or 1(quantity has to be decremented by 1) ' })
        }

        let findQuantity = findCart.items.find(x => x.productId.toString() === productId) //returns object

        if (removeProduct === 0) {
            let totalAmount = findCart.totalPrice - (findProduct.price * findQuantity.quantity) // substract the amount of product*quantity

            await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })

            let quantity = findCart.totalItems - 1
            let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }) //update the cart with total items and totalprice

            return res.status(200).send({ status: true, message: `${productId} is been removed`, data: data })
        }

        // decrement quantity
        let totalAmount = findCart.totalPrice - findProduct.price
        let itemsArr = findCart.items

        for (i in itemsArr) {
            if (itemsArr[i].productId.toString() == productId) {
                itemsArr[i].quantity = itemsArr[i].quantity - 1

                if (itemsArr[i].quantity < 1) {
                    await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })
                    let quantity = findCart.totalItems - 1

                    let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } },
                        { new: true }) //update the cart with total items and totalprice

                    return res.status(200).send({ status: true, message: `No such quantity/product exist in cart`, data: data })
                }
            }
        }
        let data = await cartModel.findOneAndUpdate({ _id: cartId }, { items: itemsArr, totalPrice: totalAmount }, { new: true })

        return res.status(200).send({ status: true, message: `${productId} quantity is been reduced By 1`, data: data })

    } catch (err) {
        return res.status(500).send({ status: false, message: "Error is : " + err })
    }
}

//fetching cart details.
const getCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        let userIdFromToken = req.userId

        //validation starts
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        //validation ends

        const findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId} ` })
        }

        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });

        }

        const findCart = await cartModel.findOne({ userId: userId })

        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't exists by ${userId} ` })
        }

        return res.status(200).send({ status: true, message: "Successfully fetched cart.", data: findCart })

    } catch (err) {
        return res.status(500).send({ status: false, message: "Error is : " + err })
    }
}

//deleting cart- changing its items,price & totlItems to 0.
const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        let userIdFromToken = req.userId

        //validating userId
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        const findUser = await userModel.findOne({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId} ` })
        }

        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });

        }

        //finding cart
        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't exists by ${userId} ` })
        }
        //Basically not deleting the cart, just changing their value to 0.
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, {
            $set: {
                items: [],
                totalPrice: 0,
                totalItems: 0
            }
        })
        return res.status(204).send({ status: true, message: "Cart deleted successfully" })

    } catch (err) {
        return res.status(500).send({ status: false, message: "Error is : " + err })
    }
}

module.exports = {
    cartCreation,
    updateCart,
    getCart,
    deleteCart,
}