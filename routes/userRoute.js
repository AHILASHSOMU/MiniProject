const express = require("express");
const user_route = express();


user_route.use("/", express.static("public"));
user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

const userController = require("../controllers/userController");
const userMiddleware = require("../middleware/userMiddleware");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

let isLoggedin;
isLoggedin = false;
let userSession = false || {};

user_route.get("/register", userMiddleware.isLogout,userController.loadRegister);
user_route.post("/register", userController.insertuser);

user_route.get('/verifyOtp', userController.loadOtp)
user_route.post('/verifyOtp', userController.verifyOtp)

user_route.get("/", userController.loadHome);

user_route.get('/dashboard',userMiddleware.isLogin,userController.userDashboard)
user_route.post("/add-address", userController.addAddress);
user_route.get("/deleteaddress", userController.deleteAddress);

user_route.get("/edit-user", userMiddleware.isLogin, userController.editUser);
user_route.post("/edit-user", userController.updateUser);

user_route.get("/login", userMiddleware.isLogout, userController.loginLoad);
user_route.post("/login", userController.verifyLogin);

user_route.get("/shop", userController.loadshop);
user_route.get("/view-product", userController.viewProductPage);

user_route.get('/view-order',userMiddleware.isLogin,userController.viewOrder)
user_route.get("/cancel-order", userController.cancelOrder);
user_route.get("/returnProduct", userController.returnProduct);

user_route.get("/cart", userController.loadCart);
user_route.get("/add-to-cart",userMiddleware.isLogin,userController.addToCart);
user_route.get("/delete-cart", userController.deleteCart);
user_route.post("/edit-qty",userController.editqty);

user_route.get("/wishlist", userController.loadWishlist);
user_route.get("/add-to-wishlist",userMiddleware.isLogin,userController.addToWishlist);
user_route.get("/delete-wishlist", userController.deleteWishlist);
user_route.get("/add-to-cart-delete-wishlist",userController.addCartdelWishlist);

user_route.post('/razorpay',userMiddleware.isLogin,userController.razorpayCheckout)

user_route.post('/add-coupon',userController.addCoupon)
user_route.get("/checkout", userController.loadCheckout);
user_route.post("/payment", userMiddleware.isLogin, userController.storeOrder);
user_route.get("/order-success",userMiddleware.isLogin,userController.loadSuccess);

user_route.get("/logOut", userMiddleware.isLogin, userController.userLogout);

// user_route.use((req, res, next) => {
//     res.render('404')
// })

module.exports = user_route;
