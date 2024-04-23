const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const middleware = require('../middlewares/auth')

//User's APIs -> Authentication required.
router.post('/register', userController.userCreation)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile', middleware.userAuth, userController.getProfile)
router.put('/user/:userId/profile', middleware.userAuth, userController.updateProfile)

//Product's APIs -> No Authentication required.
router.post('/products', productController.productCreation)
router.get('/products', productController.getAllProducts)
router.get('/products/:productId', productController.getProductsById)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteProduct)

//Cart's APIs -> Authentication required.
router.post('/users/:userId/cart', middleware.userAuth, cartController.cartCreation)
router.put('/users/:userId/cart', middleware.userAuth, cartController.updateCart)
router.get('/users/:userId/cart', middleware.userAuth, cartController.getCart)
router.delete('/users/:userId/cart', middleware.userAuth, cartController.deleteCart)

//Order's APIs -> Authentication required.
router.post('/users/:userId/orders', middleware.userAuth, orderController.orderCreation)
router.put('/users/:userId/orders', middleware.userAuth, orderController.updateOrder)

module.exports = router;