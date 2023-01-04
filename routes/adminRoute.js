const express = require("express");
const admin_route = express();

// admin_route.use('/',express.static('public'))
// const Product = require('../models/productModel')
// const User = require('../models/userModel')
// const Order = require('../models/ordersModel')
const adminController = require("../controllers/adminController");
const adminMiddleware = require('../middleware/adminMiddleware')

const multer = require('../util/multer')


admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))


admin_route.use("/", express.static("public/admin"));
admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

let isAdminLoggedin = false



admin_route.get("/", adminController.adminhome);
admin_route.get("/adminProductlist",adminMiddleware.isLogin, adminController.viewProduct);
admin_route.get("/adminUsers",adminMiddleware.isLogin, adminController.viewUser);

admin_route.get("/login",adminMiddleware.isLogout, adminController.adminload);
admin_route.post("/login", adminController.verifyLogin);


admin_route.get("/adminaddProduct",adminMiddleware.isLogin, adminController.addProduct);
admin_route.post("/addProduct", multer.upload.array("uploaded_file"), adminController.updateAddProduct);

admin_route.get("/blockUsers",adminMiddleware.isLogin, adminController.blockUser);

admin_route.get("/delete-product",adminMiddleware.isLogin, adminController.deleteProduct);
admin_route.get("/view-product",adminMiddleware.isLogin, adminController.viewProduct);

admin_route.get('/adminOrder', adminController.viewOrder);
admin_route.get('/adminCancelOrder', adminController.adminCancelOrder);
admin_route.get('/adminConfirmOrder', adminController.adminConfirmorder);
admin_route.get('/adminDeliveredOrder', adminController.adminDeliveredorder);
admin_route.get('/adminOrderView', adminController.adminOrderDetails);

admin_route.get("/edit-product",adminMiddleware.isLogin, adminController.editProduct);
admin_route.post("/edit-product",multer.upload.array("uploaded_file"),adminController.updateEditProduct);

admin_route.get('/adminOffer',adminMiddleware.isLogin,adminController.adminLoadOffer)
admin_route.post('/adminOffer',adminMiddleware.isLogin,adminController.adminStoreOffer)
admin_route.get('/delete-offer',adminController.deleteOffer)

admin_route.get('/banners', adminMiddleware.isLogin, adminController.loadAdminBanners)
admin_route.post('/banners', multer.upload.array('bannerimage',3), adminController.addBanner)
admin_route.get('/current-banner',adminMiddleware.isLogin, adminController.currentBanner)

admin_route.get('/adminCategory',adminMiddleware.isLogin,adminController.viewCategory)
admin_route.post('/adminCategory',adminMiddleware.isLogin,adminController.addCategory)
admin_route.get('/delete-category',adminMiddleware.isLogin,adminController.deleteCategory)

admin_route.get('/salesSheet',adminMiddleware.isLogin,adminController.salesReport)



admin_route.get('/adminlogout',adminMiddleware.isLogin,adminController.adminLogout)

module.exports = admin_route;
