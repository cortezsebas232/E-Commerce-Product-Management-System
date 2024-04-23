const mongoose = require('mongoose')

// Validation checking function
const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false //it checks whether the value is null or undefined.
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
};
const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}
const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0; // it checks, is there any key is available or not in request body
};

//only check empty string value.
const validString = function(value) {
        if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
        return true;
    }
  
//for product
const validInstallment = function isInteger(value) {
    if (value < 0) return false
    if (value % 1 == 0) return true;
}

// const validatingInvalidObjectId = function(objectId) {
//     if (objectId.length == 24) return true //verifying the length of objectId -> it must be of 24 hex characters.
//     return false
// }


//for cart
const validQuantity = function isInteger(value) {
    if (value < 1) return false
    if (isNaN(Number(value))) return false
    if (value % 1 == 0) return true
}

//for order
const isValidStatus = function(status) {
    return ['pending', 'completed', 'cancelled'].indexOf(status) !== -1
}

module.exports = {
    isValid,
    isValidRequestBody,
    isValidObjectId,
    validString,
    validInstallment,
    //validatingInvalidObjectId,
    validQuantity,
    isValidStatus
}


