const userModel = require('../models/userModel')
const validator = require('../utils/validator')
const config = require('../utils/awsConfig')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const saltRounds = 10

//creating user by validating every details.
const userCreation = async(req, res) => {
    try {
        let files = req.files;
        let requestBody = req.body;
        let {fname,lname,email,profileImage,phone,password,address} = requestBody

        //validation starts
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "please provide valid request body" })
        }
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "email is required" })
        }

        //searching email in DB to maintain its uniqueness
        const isEmailAleadyUsed = await userModel.findOne({ email })
        if (isEmailAleadyUsed) {
            return res.status(400).send({status: false, message: `${email} is alraedy in use. Please try another email Id.`})
        }

        //validating email using RegEx.
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
            return res.status(400).send({ status: false, message: "Invalid Email id." })

        if (!validator.isValidRequestBody(files)) {
            return res.status(400).send({ status: false, message: "Profile Image is required" })
        }
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: "phone number is required" })
        }

        //searching phone in DB to maintain its uniqueness
        const isPhoneAleadyUsed = await userModel.findOne({ phone })
        if (isPhoneAleadyUsed) {
            return res.status(400).send({status: false, message: `${phone} is already in use, Please try a new phone number.`})
        }

        //validating phone number of 10 digits only.
        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone))) 
        return res.status(400).send({ status: false, message: "Phone number must be a valid Indian number." })

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "password is required" })
        }
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "Password must be of 8-15 letters." })
        }
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, message: "Address is required" })
        }
        //shipping address validation
        if (address.shipping) {
            if (address.shipping.street) {
                if (!validator.isValidRequestBody(address.shipping.street)) {
                    return res.status(400).send({status: false, message: "Shipping address's Street Required"})
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address's street cannot be empty" })
            }

            if (address.shipping.city) {
                if (!validator.isValidRequestBody(address.shipping.city)) {
                    return res.status(400).send({status: false, message: "Shipping address city Required"})
                }
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Shipping address's city cannot be empty" })
            }
            if (address.shipping.pincode) {
                if (!validator.isValidRequestBody(address.shipping.pincode)) {
                    return res.status(400).send({status: false, message: "Shipping address's pincode Required"})
                }
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Shipping address's pincode cannot be empty" })
            }
        } else {
            return res.status(400).send({ status: false, message: "Shipping address cannot be empty." })
        }
        // Billing Address validation
        if (address.billing) {
            if (address.billing.street) {
                if (!validator.isValidRequestBody(address.billing.street)) {
                    return res.status(400).send({status: false, message: "Billing address's Street Required"})
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Billing address's street cannot be empty" })
            }
            if (address.billing.city) {
                if (!validator.isValidRequestBody(address.billing.city)) {
                    return res.status(400).send({status: false, message: "Billing address's city Required"})
                }
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Billing address's city cannot be empty" })
            }
            if (address.billing.pincode) {
                if (!validator.isValidRequestBody(address.billing.pincode)) {
                    return res.status(400).send({status: false, message: "Billing address's pincode Required "})
                }
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Billing address's pincode cannot be empty" })
            }
        } else {
            return res.status(400).send({ status: false, message: "Billing address cannot be empty." })
        }
        //validation ends

        profileImage = await config.uploadFile(files[0]); //uploading image to AWS
        const encryptedPassword = await bcrypt.hash(password, saltRounds) //encrypting password by using bcrypt.

        //object destructuring for response body.
        userData = {
            fname,
            lname,
            email,
            profileImage,
            phone,
            password: encryptedPassword,
            address
        }

        const saveUserData = await userModel.create(userData);
        return res.status(201).send({status: true, message: "user created successfully.", data: saveUserData });
    } catch (err) {
        return res.status(500).send({status: false, message: "Error is : " + err })}
}

//!....................................................................................

//user login by validating the email and password.
const userLogin = async function(req, res) {
    try {
        const requestBody = req.body;

        // Extract params
        const { email, password } = requestBody;

        // Validation starts
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
        }
        if (!validator.isValid(requestBody.email)) {
            return res.status(400).send({ status: false, message: 'Email Id is required' })
        }

        if (!validator.isValid(requestBody.password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }
        // Validation ends

        //finding user's details in DB to verify the credentials.
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).send({ status: false, message: `Login failed! email id is incorrect.` });
        }

        let hashedPassword = user.password
        const encryptedPassword = await bcrypt.compare(password, hashedPassword) //converting normal password to hashed value to match it with DB's entry by using compare function.

        if (!encryptedPassword) return res.status(401).send({ status: false, message: `Login failed! password is incorrect.` });

        //Creating JWT token through userId. 
        const userId = user._id
        const token = jwt.sign({
            userId: userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 //setting token expiry time limit.
        }, 'Hercules')

        return res.status(200).send({ status: true, message: `user login successfull `, data: { userId, token}});
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

//!..................................................................................
//fetching user's profile by Id.
const getProfile = async(req, res) => {
    try {
        const userId = req.params.userId
        const userIdFromToken = req.userId

        //validation starts
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        //validation ends

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(400).send({status: false, message: `User doesn't exists by ${userId}`})
        }

        //Authentication & authorization
        if (findUserProfile._id.toString() != userIdFromToken) {
           return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
        }

        return res.status(200).send({ status: true, message: "Profile found successfully.", data: findUserProfile })
    } catch (err) {
        return res.status(500).send({status: false, message: "Error is: " + err.message})}
}

//Update profile details by validating user details.
const updateProfile = async(req, res) => {
    try {
        let files = req.files
        let requestBody = req.body
        let userId = req.params.userId
        let userIdFromToken = req.userId

        //Validation starts.
        if (!validator.isValidObjectId(userId)) {
          return  res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            
        }

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. Please provide user's details to update." })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(400).send({status: false, message: `User doesn't exists by ${userId}`})
        }

        //Authentication & authorization
        if (findUserProfile._id.toString() != userIdFromToken) {
           return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
            
        }

        // Extract params
        let { fname, lname, email, phone, password, address, profileImage } = requestBody;

        //validations for updatation details.
        if (!validator.validString(fname)) {
            return res.status(400).send({ status: false, message: 'fname is Required' })
        }
        if (fname) {
            if (!validator.isValid(fname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide fname" })
            }
        }
        if (!validator.validString(lname)) {
            return res.status(400).send({ status: false, message: 'lname is Required' })
        }
        if (lname) {
            if (!validator.isValid(lname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide lname" })
            }
        }

        //email validation
        if (!validator.validString(email)) {
            return res.status(400).send({ status: false, message: 'email is Required' })
        }
        if (email) {
            if (!validator.isValid(email)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
            }
            if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, message: `Email should be a valid email address` });
            }
            let isEmailAlredyPresent = await userModel.findOne({ email: email })
            if (isEmailAlredyPresent) {
                return res.status(400).send({ status: false, message: `Unable to update email. ${email} is already registered.` });
            }
        }

        //phone validation
        if (!validator.validString(phone)) {
            return res.status(400).send({ status: false, message: 'phone number is Required' })
        }
        if (phone) {
            if (!validator.isValid(phone)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone number." })
            }
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: `Please enter a valid Indian phone number.` });
            }
            let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })
            if (isPhoneAlredyPresent) {
                return res.status(400).send({ status: false, message: `Unable to update phone. ${phone} is already registered.` });
            }
        }

        //password validation and setting range of password.
        if (!validator.validString(password)) {
            return res.status(400).send({ status: false, message: 'password is Required' })
        }
        let tempPassword = password
        if (tempPassword) {
            if (!validator.isValid(tempPassword)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
            }
            if (!(tempPassword.length >= 8 && tempPassword.length <= 15)) {
                return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
            }
            var encryptedPassword = await bcrypt.hash(tempPassword, saltRounds)
        }

        //Address validation ->
        if (address) {

            //converting shipping address to string them parsing it.
            let shippingAddressToString = JSON.stringify(address)
            let parsedShippingAddress = JSON.parse(shippingAddressToString)

            if (validator.isValidRequestBody(parsedShippingAddress)) {
                if (parsedShippingAddress.hasOwnProperty('shipping')) {
                    if (parsedShippingAddress.shipping.hasOwnProperty('street')) {
                        if (!validator.isValid(parsedShippingAddress.shipping.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's Street" });
                        }
                    }
                    if (parsedShippingAddress.shipping.hasOwnProperty('city')) {
                        if (!validator.isValid(parsedShippingAddress.shipping.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's City" });
                        }
                    }
                    if (parsedShippingAddress.shipping.hasOwnProperty('pincode')) {
                        if (!validator.isValid(parsedShippingAddress.shipping.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's pincode" });
                        }
                    }

                    //using var to use these variables outside this If block.
                    var shippingStreet = address.shipping.street
                    var shippingCity = address.shipping.city
                    var shippingPincode = address.shipping.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address cannot be empty" });
            }
        }
        if (address) {

            //converting billing address to string them parsing it.
            let billingAddressToString = JSON.stringify(address)
            let parsedBillingAddress = JSON.parse(billingAddressToString)

            if (validator.isValidRequestBody(parsedBillingAddress)) {
                if (parsedBillingAddress.hasOwnProperty('billing')) {
                    if (parsedBillingAddress.billing.hasOwnProperty('street')) {
                        if (!validator.isValid(parsedBillingAddress.billing.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's Street" });
                        }
                    }
                    if (parsedBillingAddress.billing.hasOwnProperty('city')) {
                        if (!validator.isValid(parsedBillingAddress.billing.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's City" });
                        }
                    }
                    if (parsedBillingAddress.billing.hasOwnProperty('pincode')) {
                        if (!validator.isValid(parsedBillingAddress.billing.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's pincode" });
                        }
                    }

                    //using var to use these variables outside this If block.
                    var billingStreet = address.billing.street
                    var billingCity = address.billing.city
                    var billingPincode = address.billing.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Billing address cannot be empty" });
            }
        }

        //validating user's profile image.
        if (files) {
            if (validator.isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
                }
                var updatedProfileImage = await config.uploadFile(files[0])
            }
        }
        //Validation ends

        //object destructuring for response body.
        let changeProfileDetails = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                fname: fname,
                lname: lname,
                email: email,
                profileImage: updatedProfileImage,
                phone: phone,
                password: encryptedPassword,
                'address.shipping.street': shippingStreet,
                'address.shipping.city': shippingCity,
                'address.shipping.pincode': shippingPincode,
                'address.billing.street': billingStreet,
                'address.billing.city': billingCity,
                'address.billing.pincode': billingPincode
            }
        }, { new: true })
        return res.status(200).send({ status: true, data: changeProfileDetails })
    } catch (err) {
        return res.status(500).send({status: false, message: "Error is: " + err.message})}
}

module.exports = {
    userCreation,
    userLogin,
    getProfile,
    updateProfile
}