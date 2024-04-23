## Ecommerce - Products Management

### Key points
- In this project we will work feature wise. That means we pick one object like user, book, blog, etc at a time. We work through it's feature. The steps would be:
  1) We create it's model.
  2) We build it's APIs.
  3) We test these APIs.
  4) We deploy these APIs.
  5) We integrate these APIs with frontend.
  6) We will repeat steps from Step 1 to Step 5 for each feature in this project.
- This project is divided into 4 features namely User, Product, Cart and Order. You need to work on a single feature at a time. Once that is completed as per above mentioned steps. You will be instructed to move to next Feature.
- In this project we are changing how we send token with a request. Instead of using a custom header key like x-api-key, you need to use Authorization header and send the JWT token as Bearer token.
- You branch will be checked as part of the demo. Branch name should follow the naming convention `project/productsManagement`
- Follow the naming conventions exactly as instructed.


## FEATURE I - User
### Models
- User Model
```yaml
{ 
  fname: {string, mandatory},
  lname: {string, mandatory},
  email: {string, mandatory, valid email, unique},
  profileImage: {string, mandatory}, // s3 link
  phone: {string, mandatory, unique, valid Indian mobile number}, 
  password: {number, mandatory, minLen 8, maxLen 15}, // encrypted password
  address: {
    shipping: {
      street: {string, mandatory},
      city: {string, mandatory},
      pincode: {number, mandatory}
    },
    billing: {
      street: {string, mandatory},
      city: {string, mandatory},
      pincode: {number, mandatory}
    }
  },
  createdAt: {timestamp},
  updatedAt: {timestamp}
}
```


## User APIs 
### POST /register
- Create a user document from request body. Request body must contain image.
- Upload image to S3 bucket and save it's public url in user document.
- Save password in encrypted format. (use bcrypt)
- __Response format__
  - _**On success**_ - Return HTTP status 201. Also return the user document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)
```yaml
{
    "status": true,
    "message": "User created successfully",
    "data": {
        "fname": "John",
        "lname": "Doe",
        "email": "johndoe@mailinator.com",
        "profileImage": "https://classroom-training-bucket.s3.ap-south-1.amazonaws.com/user/copernico-p_kICQCOM4s-unsplash.jpg",
        "phone": 9876543210,
        "password": "$2b$10$DpOSGb0B7cT0f6L95RnpWO2P/AtEoE6OF9diIiAEP7QrTMaV29Kmm",
        "address": {
            "shipping": {
                "street": "MG Road",
                "city": "Indore",
                "pincode": 452001
            },
            "billing": {
                "street": "MG Road",
                "city": "Indore",
                "pincode": 452001
            }
        },
        "_id": "6162876abdcb70afeeaf9cf5",
        "createdAt": "2021-10-10T06:25:46.051Z",
        "updatedAt": "2021-10-10T06:25:46.051Z",
        "__v": 0
    }
}
```

### POST /login
- Allow an user to login with their email and password.
- On a successful login attempt return the userId and a JWT token contatining the userId, exp, iat.
> **_NOTE:_** There is a slight change in response body. You should also return userId in addition to the JWT token.
- __Response format__
  - _**On success**_ - Return HTTP status 200 and JWT token in response body. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)
```yaml
{
    "status": true,
    "message": "User login successfull",
    "data": {
        "userId": "6165f29cfe83625cf2c10a5c",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MTYyODc2YWJkY2I3MGFmZWVhZjljZjUiLCJpYXQiOjE2MzM4NDczNzYsImV4cCI6MTYzMzg4MzM3Nn0.PgcBPLLg4J01Hyin-zR6BCk7JHBY-RpuWMG_oIK7aV8"
    }
}
```

## GET /user/:userId/profile (Authentication required)
- Allow an user to fetch details of their profile.
- Make sure that userId in url param and in token is same
- __Response format__
  - _**On success**_ - Return HTTP status 200 and returns the user document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)
```yaml
{
    "status": true,
    "message": "User profile details",
    "data": {
        "address": {
            "shipping": {
                "street": "MG Road",
                "city": "Indore",
                "pincode": 452001
            },
            "billing": {
                "street": "MG Road",
                "city": "Indore",
                "pincode": 452001
            }
        },
        "_id": "6162876abdcb70afeeaf9cf5",
        "fname": "John",
        "lname": "Doe",
        "email": "johndoe@mailinator.com",
        "profileImage": "https://classroom-training-bucket.s3.ap-south-1.amazonaws.com/user/copernico-p_kICQCOM4s-unsplash.jpg",
        "phone": 9876543210,
        "password": "$2b$10$DpOSGb0B7cT0f6L95RnpWO2P/AtEoE6OF9diIiAEP7QrTMaV29Kmm",
        "createdAt": "2021-10-10T06:25:46.051Z",
        "updatedAt": "2021-10-10T06:25:46.051Z",
        "__v": 0
    }
}
```

## PUT /user/:userId/profile (Authentication required)
- Allow an user to update their profile.
- A user can update all the fields
- Make sure that userId in url param and in token is same
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated user document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)
```yaml
{
    "status": true,
    "message": "User profile updated",
    "data": {
        "address": {
            "shipping": {
                "street": "MG Road",
                "city": "Delhi",
                "pincode": 110001
            },
            "billing": {
                "street": "MG Road",
                "city": "Indore",
                "pincode": 452010
            }
        },
        "_id": "6162876abdcb70afeeaf9cf5",
        "fname": "Jane",
        "lname": "Austin",
        "email": "janedoe@mailinator.com",
        "profileImage": "https://classroom-training-bucket.s3.ap-south-1.amazonaws.com/user/laura-davidson-QBAH4IldaZY-unsplash.jpg",
        "phone": 9876543210,
        "password": "$2b$10$jgF/j/clYBq.3uly6Tijce4GEGJn9EIXEcw9NI3prgKwJ/6.sWT6O",
        "createdAt": "2021-10-10T06:25:46.051Z",
        "updatedAt": "2021-10-10T08:47:15.297Z",
        "__v": 0
    }
}
```

Note: [Bcrypt](https://www.npmjs.com/package/bcrypt)
Send [form-data](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

## FEATURE II - Product
### Models
- Product Model
```yaml
{ 
  title: {string, mandatory, unique},
  description: {string, mandatory},
  price: {number, mandatory, valid number/decimal},
  currencyId: {string, mandatory, INR},
  currencyFormat: {string, mandatory, Rupee symbol},
  isFreeShipping: {boolean, default: false},
  productImage: {string, mandatory},  // s3 link
  style: {string},
  availableSizes: {array of string, at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},
  installments: {number},
  deletedAt: {Date, when the document is deleted}, 
  isDeleted: {boolean, default: false},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```


## Products API (_No authentication required_)
### POST /products
- Create a product document from request body.
- Upload product image to S3 bucket and save image public url in document.
- __Response format__
  - _**On success**_ - Return HTTP status 201. Also return the product document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### GET /products
- Returns all products in the collection that aren't deleted.
  - __Filters__
    - Size (The key for this filter will be 'size')
    - Product name (The key for this filter will be 'name'). You should return all the products with name containing the substring recieved in this filter
    - Price : greater than or less than a specific value. The keys are 'priceGreaterThan' and 'priceLessThan'. 
    
> **_NOTE:_** For price filter request could contain both or any one of the keys. For example the query in the request could look like { priceGreaterThan: 500, priceLessThan: 2000 } or just { priceLessThan: 1000 } )
    
  - __Sort__
    - Sorted by product price in ascending or descending. The key value pair will look like {priceSort : 1} or {priceSort : -1}
  _eg_ /products?size=XL&name=Nit%20grit
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the product documents. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### GET /products/:productId
- Returns product details by product id
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the product documents. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### PUT /products/:productId
- Updates a product by changing at least one or all fields
- Check if the productId exists (must have isDeleted false and is present in collection). If it doesn't, return an HTTP status 404 with a response body like [this](#error-response-structure)
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated product document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### DELETE /products/:productId
- Deletes a product by product id if it's not already deleted
- __Response format__
  - _**On success**_ - Return HTTP status 200. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)



## FEATURE III - Cart
### Models
- Cart Model
```yaml
{
  userId: {ObjectId, refs to User, mandatory, unique},
  items: [{
    productId: {ObjectId, refs to Product model, mandatory},
    quantity: {number, mandatory, min 1}
  }],
  totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
  totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```


## Cart APIs (_authentication required as authorization header - bearer token_)
### POST /users/:userId/cart (Add to cart)
- Create a cart for the user if it does not exist. Else add product(s) in cart.
- Get cart id in request body.
- Get productId in request body.
- Make sure that cart exist.
- Add a product(s) for a user in the cart.
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Make sure the product(s) are valid and not deleted.
- Get product(s) details in response body.
- __Response format__
  - _**On success**_ - Return HTTP status 201. Also return the cart document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### PUT /users/:userId/cart (Remove product / Reduce a product's quantity from the cart)
- Updates a cart by either decrementing the quantity of a product by 1 or deleting a product from the cart.
- Get cart id in request body.
- Get productId in request body.
- Get key 'removeProduct' in request body. 
- Make sure that cart exist.
- Key 'removeProduct' denotes whether a product is to be removed({removeProduct: 0}) or its quantity has to be decremented by 1({removeProduct: 1}).
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Get product(s) details in response body.
- Check if the productId exists and is not deleted before updating the cart.
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated cart document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### GET /users/:userId/cart
- Returns cart summary of the user.
- Make sure that cart exist.
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Get product(s) details in response body.
- __Response format__
  - _**On success**_ - Return HTTP status 200. Return the cart document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### DELETE /users/:userId/cart
- Deletes the cart for the user.
- Make sure that cart exist.
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- cart deleting means array of items is empty, totalItems is 0, totalPrice is 0.
- __Response format__
  - _**On success**_ - Return HTTP status 204. Return a suitable message. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)



## FEATURE IV - Order
### Models
- Order Model
```yaml
{
  userId: {ObjectId, refs to User, mandatory},
  items: [{
    productId: {ObjectId, refs to Product model, mandatory},
    quantity: {number, mandatory, min 1}
  }],
  totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
  totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
  totalQuantity: {number, mandatory, comment: "Holds total number of items in the cart"},
  cancellable: {boolean, default: true},
  status: {string, default: 'pending', enum[pending, completed, cancled]},
  deletedAt: {Date, when the document is deleted}, 
  isDeleted: {boolean, default: false},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```


## Checkout/Order APIs (Authentication and authorization required)
### POST /users/:userId/orders
- Create an order for the user
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Get cart details in the request body
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the order document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## PUT /users/:userId/orders
- Updates an order status
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Get order id in request body
- Make sure the order belongs to the user
- Make sure that only a cancellable order could be canceled. Else send an appropriate error message and response.
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated order document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## Testing 
- To test these apis create a new collection in Postman named Project 5 Shopping Cart
- Each api should have a new request in this collection
- Each request in the collection should be rightly named. Eg Create user, Create product, Get products etc
- Each member of each team should have their tests in running state

Refer below sample
 ![A Postman collection and request sample](assets/Postman-collection-sample.png)

## Response

### Successful Response structure
```yaml
{
  status: true,
  message: 'Success',
  data: {

  }
}
```
### Error Response structure
```yaml
{
  status: false,
  message: ""
}
```

## Collections
## users
```yaml
{
  _id: ObjectId("88abc190ef0288abc190ef02"),
  fname: 'John',
  lname: 'Doe',
  email: 'johndoe@mailinator.com',
  profileImage: 'http://function-up-test.s3.amazonaws.com/users/user/johndoe.jpg', // s3 link
  phone: 9876543210,
  password: '$2b$10$O.hrbBPCioVm237nAHYQ5OZy6k15TOoQSFhTT.recHBfQpZhM55Ty', // encrypted password
  address: {
    shipping: {
      street: "110, Ridhi Sidhi Tower",
      city: "Jaipur",
      pincode: 400001
    }, {mandatory}
    billing: {
      street: "110, Ridhi Sidhi Tower",
      city: "Jaipur",
      pincode: 400001
    }
  },
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```
### products
```yaml
{
  _id: ObjectId("88abc190ef0288abc190ef55"),
  title: 'Nit Grit',
  description: 'Dummy description',
  price: 23.0,
  currencyId: 'INR',
  currencyFormat: '₹',
  isFreeShipping: false,
  productImage: 'http://function-up-test.s3.amazonaws.com/products/product/nitgrit.jpg',  // s3 link
  style: 'Colloar',
  availableSizes: ["S", "XS","M","X", "L","XXL", "XL"],
  installments: 5,
  deletedAt: null, 
  isDeleted: false,
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```

### carts
```yaml
{
  "_id": ObjectId("88abc190ef0288abc190ef88"),
  userId: ObjectId("88abc190ef0288abc190ef02"),
  items: [{
    productId: ObjectId("88abc190ef0288abc190ef55"),
    quantity: 2
  }, {
    productId: ObjectId("88abc190ef0288abc190ef60"),
    quantity: 1
  }],
  totalPrice: 50.99,
  totalItems: 2,
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```

### orders
```yaml
{
  "_id": ObjectId("88abc190ef0288abc190ef88"),
  userId: ObjectId("88abc190ef0288abc190ef02"),
  items: [{
    productId: ObjectId("88abc190ef0288abc190ef55"),
    quantity: 2
  }, {
    productId: ObjectId("88abc190ef0288abc190ef60"),
    quantity: 1
  }],
  totalPrice: 50.99,
  totalItems: 2,
  totalQuantity: 3,
  cancellable: true,
  status: 'pending'
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```
