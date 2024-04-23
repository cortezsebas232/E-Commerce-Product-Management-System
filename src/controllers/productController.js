const validator = require('../utils/validator')
const config = require('../utils/awsConfig')
const productModel = require('../models/productModel')
const currencySymbol = require("currency-symbol-map")

//creating product by validating all details.
const productCreation = async function(req, res) {
    try {
        let files = req.files;
        let requestBody = req.body;
        let productImage;

        //validating empty req body.
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" })
        }

        //extract params for request body.
        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = requestBody

        //validation for the params starts.
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Title is required" })
        }

        //searching title in DB to maintain their uniqueness.
        const istitleAleadyUsed = await productModel.findOne({ title })
        if (istitleAleadyUsed) {
            return res.status(400).send({
                status: false,
                message: `${title} is alraedy in use. Please use another title.`
            })
        }

        //uploading product image to AWS.
        if (files) {
            if (validator.isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Please provide product image" })
                }
                productImage = await config.uploadFile(files[0])
            }
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: "Description is required" })
        }

        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: "Price is required" })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: "currencyId should be INR" })
        }

        if (!validator.isValid(currencyFormat)) {
            currencyFormat = currencySymbol('INR')
        }
        currencyFormat = currencySymbol('INR') //used currency symbol package to store INR symbol.

        if (style) {
            if (!validator.validString(style)) {
                return res.status(400).send({ status: false, message: "style is required" })
            }
        }

        if (installments) {
            if (!validator.isValid(installments)) {
                return res.status(400).send({ status: false, message: "installments required" })
            }
        }
        if (installments) {
            if (!validator.validInstallment(installments)) {
                return res.status(400).send({ status: false, message: "installments can't be a decimal number " })
            }
        }

        if (isFreeShipping) {
            if (!(isFreeShipping != true)) {
                return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
            }
        }

        productImage = await config.uploadFile(files[0]);

        //object destructuring for response body.
        const newProductData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage: productImage
        }

        //validating sizes to take multiple sizes at a single attempt.
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }

            //using array.isArray function to check the value is array or not.
            if (Array.isArray(sizesArray)) {
                newProductData['availableSizes'] = [...new Set(sizesArray)]
            }
    
        }
        const saveProductDetails = await productModel.create(newProductData)
        return res.status(201).send({ status: true, message: "Product added successfully.", data: saveProductDetails })

    } catch (err) {
        return res.status(500).send({status: false, message: "Error is : " + err})}
}

//!.............................................................................
//fetch all products.
const getAllProducts = async function(req, res) {
    try {
        const filterQuery = { isDeleted: false } //complete object details.
        const queryParams = req.query;

        if (validator.isValidRequestBody(queryParams)) {
            const { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams;

            //validation starts.
            if (validator.isValid(size)) {
                filterQuery['availableSizes'] = size
            }

            //using $regex to match the subString of the names of products & "i" for case insensitive.
            if (validator.isValid(name)) {
                filterQuery['title'] = {}
                filterQuery['title']['$regex'] = name
                filterQuery['title']['$options'] = 'i'
            }

            //setting price for ranging the product's price to fetch them.
            if (validator.isValid(priceGreaterThan)) {

                if (!(!isNaN(Number(priceGreaterThan)))) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$gte'] = Number(priceGreaterThan)
                    //console.log(typeof Number(priceGreaterThan))
            }

            //setting price for ranging the product's price to fetch them.
            if (validator.isValid(priceLessThan)) {

                if (!(!isNaN(Number(priceLessThan)))) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (priceLessThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$lte'] = Number(priceLessThan)
                   
            }

            //sorting the products acc. to prices => 1 for ascending & -1 for descending.
            if (validator.isValid(priceSort)) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
                }

                const products = await productModel.find(filterQuery).sort({ price: priceSort })
                   
                if (Array.isArray(products) && products.length === 0) {
                    return res.status(404).send({ productStatus: false, message: 'No Product found' })
                }

                return res.status(200).send({ status: true, message: 'Product list', data2: products })
            }
        }

        const products = await productModel.find(filterQuery)

        //verifying is it an array and having some data in that array.
        if (Array.isArray(products) && products.length === 0) {
            return res.status(404).send({ productStatus: false, message: 'No Product found' })
        }

        return res.status(200).send({ status: true, message: 'Product list', data: products })
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }
}

//!..............................................................................
//fetch products by Id.
const getProductsById = async function(req, res) {
    try {
        const productId = req.params.productId

        //validation starts.
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }
        //validation ends.

        const product = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!product) {
            return res.status(404).send({ status: false, message: `product does not exists` })
        }

        return res.status(200).send({ status: true, message: 'Product found successfully', data: product })
    } catch (err) {
        return res.status(500).send({status: false, message: "Error is : " + err})}
}

//!.................................................................................
//Update product details.
const updateProduct = async function(req, res) {
    try {
        const requestBody = req.body
        const params = req.params
        const productId = params.productId

        // Validation stats
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }

        if (!(validator.isValidRequestBody(requestBody) || req.files)) {
            return res.status(400).send({ status: false, message: 'No paramateres passed. product unmodified', data: product })
        }

        // Extract params
        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        //Declaring an empty object then using hasOwnProperty to match the keys and setting the appropriate values.
        const updatedProductDetails = {}

        if (validator.isValid(title)) {

            const isTitleAlreadyUsed = await productModel.findOne({ title: title });

            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: `${title} title is already used` })
            }

            if (!updatedProductDetails.hasOwnProperty('title'))
                updatedProductDetails['title'] = title
        }

        if (validator.isValid(description)) {
            if (!updatedProductDetails.hasOwnProperty('description'))
                updatedProductDetails['description'] = description
        }

        //verifying price is number & must be greater than 0.
        if (validator.isValid(price)) {

            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }

            if (price <= 0) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }

            if (!updatedProductDetails.hasOwnProperty('price'))
                updatedProductDetails['price'] = price
        }
        //verifying currency Id must be INR.
        if (validator.isValid(currencyId)) {

            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
            }

            if (!updatedProductDetails.hasOwnProperty('currencyId'))
                updatedProductDetails['currencyId'] = currencyId;
        }

        //shipping must be true/false.
        if (validator.isValid(isFreeShipping)) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }

            if (!updatedProductDetails.hasOwnProperty('isFreeShipping'))
                updatedProductDetails['isFreeShipping'] = isFreeShipping
        }

        //uploading images to AWS.
        let productImage = req.files;
        if ((productImage && productImage.length > 0)) {

            let updatedproductImage = await config.uploadFile(productImage[0]);

            if (!updatedProductDetails.hasOwnProperty('productImage'))
                updatedProductDetails['productImage'] = updatedproductImage
        }

        if (validator.isValid(style)) {

            if (!updatedProductDetails.hasOwnProperty('style'))
                updatedProductDetails['style'] = style
        }

        //validating sizes to take multiple sizes at a single attempt.
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }
            if (!updatedProductDetails.hasOwnProperty(updatedProductDetails, '$addToSet'))
                updatedProductDetails['$addToSet'] = {}
            updatedProductDetails['$addToSet']['availableSizes'] = sizesArray
        }

        //verifying must be a valid no. & must be greater than 0.
        if (validator.isValid(installments)) {

            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: `installments should be a valid number` })
            }

            if (!updatedProductDetails.hasOwnProperty('installments'))
                updatedProductDetails['installments'] = installments
        }

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updatedProductDetails, { new: true })

        return res.status(200).send({ status: true, message: 'Product details updated successfully.', data: updatedProduct });
    } catch (err) {
        return res.status(500).send({status: false, message: "Error is : " + err})}
}

//!..............................................................................
//deleting product by the seller side.
const deleteProduct = async function(req, res) {
    try {
        const params = req.params
        const productId = params.productId

        //validation starts
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }
        //vaidation ends.

        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).send({ status: false, message: `Product doesn't exists by ${productId}` })
        }
        if (product.isDeleted == false) {
            await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })

            return res.status(200).send({ status: true, message: `Product deleted successfully.` })
        }
        return res.status(400).send({ status: true, message: `Product has been already deleted.` })

    } catch (err) {
        return res.status(500).send({status: false,message: "Error is : " + err})}
}

module.exports = {
    productCreation,
    getAllProducts,
    getProductsById,
    updateProduct,
    deleteProduct
}
