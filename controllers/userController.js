const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Orders = require("../models/ordersModel");
const Banners = require("../models/bannerModel");
const Offer = require("../models/offerModel");
const Address = require("../models/addressModel");
const mongoose = require("mongoose");
const fast2sms = require("fast-two-sms");

const Razorpay = require("razorpay");

const express = require("express");
const { query } = require("express");
const app = express();

const { ObjectId } = require("mongodb");

const cors = require("cors");
const { ObjectID } = require("bson");
app.use(cors());

let offer = {
  name: "None",
  type: "None",
  discount: 0,
  usedBy: false,
};

let couponTotal = 0;
let nocoupon;

let isLoggedin;
isLoggedin = false;


const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtp = async (req, res) => {
  try {
    const userData = await User.findById({ _id: newUser });
    const otp = sendMessage(userData.mobile, res);
    newOtp = otp;
    console.log("otp:", otp);
    res.render("../otpVerify", { otp: otp, user: newUser });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = newOtp;
    const userData = await User.findById({ _id: req.body.user });
    if (otp == req.body.otp) {
      userData.isVerified = 1;
      const user = await userData.save();
      if (user) {
        res.redirect("/login");
      }
    } else {
      res.render("../otpVerify", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const sendMessage = function (mobile, res) {
  let randomOTP = Math.floor(Math.random() * 10000);
  var options = {
    authorization:
      "MSOj0bTnaP8phCARmWqtzkgEV4ZN2Ff9eUxXI7iJQ5HcDBKsL1vYiamnRcMxrsjDJboyFEXl0Sk37pZq",
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile],
  };
  
  fast2sms
    .sendMessage(options)
    .then((response) => {
      console.log("otp sent successfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return randomOTP;
};

const insertuser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();
    newUser = userData._id;

    if (userData) {
      res.redirect("/verifyOtp");
    } else {
      res.render("registration", { message: "registration failed" });
    }
  } catch (error) {
    console.log("error1");
  }
};

const userDashboard = async (req, res) => {
  try {
    const orderData = await Orders.find({ userId: userSession.userId });
    const userData = await User.findById({ _id: userSession.userId });
    res.render("dashboard", {
      isLoggedin,
      user: userData,
      userOrders: orderData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      console.log("came");
      const addressData = Address({
        userId: userSession.userId,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        country: req.body.country,
        address: req.body.streetAddress,
        city: req.body.city,
        state: req.body.state,
        pin: req.body.pin,
        mobileno: req.body.mobileno,
      });

      await addressData.save();
      res.redirect("/dashboard");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      id = req.query.id;
      await Address.findByIdAndDelete({ _id: id });
      res.redirect("/dashboard");
    } else {
      res.redirect("/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    res.render("editUser", { isLoggedin, user: userData });
  } catch (error) {
    console.log(error.message);
  }

};

const updateUser = async (req, res) => {
  try {
    const productData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mno,
        },
      }
    );
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
  
};

const viewOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.id;
      userSession.currentOrder = id;
      const orderData = await Orders.findById({ _id: id });
      const userData = await User.findById({ _id: userSession.userId });
      await orderData.populate("products.item.productId");
     
      res.render("viewOrder", { isLoggedin, order: orderData, user: userData });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const { id } = req.query;
      console.log(id);
      await Orders.deleteOne({ _id: id });
      res.redirect("/dashboard");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const returnProduct = async (req, res) => {
  try {
    userSession = req.session;
    if ((userSession = req.session)) {
      const id = req.query.id;
    
      const productOrderData = await Orders.findById({
        _id: ObjectId(userSession.currentOrder),
      });
      
      const productData = await Product.findById({ _id: id });
      if (productOrderData) {
        for (let i = 0; i < productOrderData.products.item.length; i++) {
          if (
            new String(productOrderData.products.item[i].productId).trim() ===
            new String(id).trim()
          ) {
            productData.stock += productOrderData.products.item[i].qty;
            productOrderData.productReturned[i] = 1;
            console.log("found!!!");
            console.log("productData.stock", typeof productData.stock);
            await productData.save().then(() => {
              console.log("productData saved");
            });
            console.log(
              "productOrderData.productReturned[i]",
              productOrderData.productReturned[i]
            );
            await productOrderData.save().then(() => {
              console.log("productOrderData saved");
            });
          } else {
            
          }
        }
        res.redirect("/dashboard");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.isVerified === 0) {
          res.render("login", { message: "user blocked" });
        } else {
          if (userData.is_admin === 1) {
            res.render("login", { message: "Not user" });
          } else {
            userSession = req.session;
            userSession.userId = userData._id;
            isLoggedin = true;
            res.redirect("/");
            console.log("logged in");
          }
        }
      } else {
        res.render("login", { message: "Password does not match" });
      }
    } else {
      res.render("login", { message: "User does not exist please register" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const banner = await Banners.find({ isActive: 1 });
    userSession = req.session;
    userSession.offer = offer;
    userSession.couponTotal = couponTotal;
    userSession.nocoupon = nocoupon;
    const productData = await Product.find();
    res.render("home", {
      banners: banner,
      isLoggedin,
      products: productData,
      id: userSession.userId,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadshop = async (req, res) => {
  userSession = req.session;


  var search = "";
  if (req.query.search) {
    search = req.query.search;
  }

  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  const limit = 3;

  const productData = await Product.find({
    isAvailable: 1,
    $or: [
      { productname: { $regex: "." + search + ".", $options: "i" } },
      { name: { $regex: "." + search + ".", $options: "i" } },
    ],
  })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Product.find({
    isAvailable: 1,
    $or: [
      { productname: { $regex: "." + search + ".", $options: "i" } },
      { name: { $regex: "." + search + ".", $options: "i" } },
    ],
  }).countDocuments();

  const categoryData = await Category.find({});

  const ID = req.query.id;

  const data = await Category.findOne({ _id: ID });

  if (data) {
    const productData = await Product.find({ category: data.name });

    res.render("shop", {
      path: "/shop",
      cat: categoryData,
      isLoggedin,
      products: productData,
      id: userSession.userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previous: new Number(page) - 1,
      next: new Number(page) + 1,
    });
  } else {
    res.render("shop", {
      path: "/shop",
      cat: categoryData,
      isLoggedin,
      products: productData,
      id: userSession.userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previous: new Number(page) - 1,
      next: new Number(page) + 1,
    });
  }
};

const viewProductPage = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await Product.find();
    const productData = await Product.findById({ _id: id });
    console.log(productData);
    if (productData) {
      res.render("viewProductPage", {
        isLoggedin,
        product: productData,
        products: products,
        userSession: userSession.userId,
      });
    } else {
      res.redirect("/shop");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadCart = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
      if (userData.cart.item.length == 0) {
        res.render("emptyCart", { isLoggedin });
      } else {
        res.render("cart", {
          isLoggedin,
          id: userSession.userId,
          cartProducts: completeUser.cart,
        });
      }
    } else {
      res.render("cart", { isLoggedin, id: userSession.userId });
    }
  } catch (error) {
    console.log(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    userSession = req.session;
    const productId = req.query.id;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const productData = await Product.findById({ _id: productId });
      userData.addToCart(productData);
      res.redirect("/shop");
    } else {
      res.render("cart", { isLoggedin, id: userSession.userId });
    }
  } catch (error) {
    console.log(error);
  }
};
const editqty = async (req, res) => {
  try {
    const id = req.query.id;

    const userData = await User.findById({ _id: userSession.userId });

    const foundProduct = userData.cart.item.findIndex((x) => x.productId == id);

    const qty = { a: parseInt(req.body.qty) };
    userData.cart.item[foundProduct].qty = qty.a;
    const price = userData.cart.item[foundProduct].price;

    userData.cart.totalPrice = 0;

    const totalPrice = userData.cart.item.reduce((acc, curr) => {
      return acc + curr.price * curr.qty;
    }, 0);

    userData.cart.totalPrice = totalPrice;
    await userData.save();

    res.json({ totalPrice, price });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCart = async (req, res, next) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    let updateprod = await userData.removefromCart(productId);
    if (updateprod) {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
  }

};

const loadCheckout = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.addressid;
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
      const addressData = await Address.find({ userId: userSession.userId });
      const selectAddress = await Address.findOne({ _id: id });
      
      console.log(userSession.offer);
      if (userSession.couponTotal == 0) {
        
        userSession.couponTotal = userData.cart.totalPrice;
      }
      res.render("checkout", {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        offer: userSession.offer,
        couponTotal: userSession.couponTotal,
        nocoupon,
        userAddress: addressData,
        addSelect: selectAddress,
      });
      nocoupon = false;
    } else {
      res.render("checkout", {
        isLoggedin,
        id: userSession.userId,
        
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const storeOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
      
      console.log(userData);
      userData.cart.totalPrice = userSession.couponTotal;

      const updatedTotal = await userData.save();

      if (completeUser.cart.totalPrice > 0) {
        const order = Orders({
          isLoggedin,
          userId: userSession.userId,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.streetAddress,
          city: req.body.city,
          state: req.body.state,
          pin: req.body.pin,
          mobileno: req.body.mobileno,
          payment: req.body.payment,
          products: completeUser.cart,
          offer: userSession.offer.name,
          discount: userSession.offer.discount,
          sellingPrice: completeUser.cart.totalPrice
        });
        let orderProductStatus = [];
        for (let key of order.products.item) {
          orderProductStatus.push(0);
        }
        order.productReturned = orderProductStatus;

        const orderData = await order.save();
        console.log("came");
        console.log(orderData);
        userSession.currentOrder = orderData._id;

        const ordern = await Orders.findById({ _id: userSession.currentOrder });
        const productDetails = await Product.find({ isAvailable: 1 });
        for (let i = 0; i < productDetails.length; i++) {
          for (let j = 0; j < ordern.products.item.length; j++) {
            if (
              productDetails[i]._id.equals(ordern.products.item[j].productId)
            ) {
              productDetails[i].sales += ordern.products.item[j].qty;
            }
          }
          productDetails[i].save();
        }

        const offerUpdate = await Offer.updateOne(
          { name: userSession.offer.name },
          { $push: { usedBy: userSession.userId } }
        );

        if (req.body.payment == "COD") {
          res.redirect("/order-success");
        } else if (req.body.payment == "RazorPay") {
          res.render("razorPay", {
            userId: userSession.userId,
            total: completeUser.cart.totalPrice,
          });
        } else {
          res.redirect("/shop");
        }
      } else {
        res.redirect("/checkout");
      }
    } else {
      res.redirect("/shop");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const razorpayCheckout = async (req, res) => {
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const completeUser = await userData.populate("cart.item.productId");
  var instance = new Razorpay({
    key_id: "rzp_test_E4dNxEaCrP0apN",
    key_secret: "xobGfG40V2MFN4weXfjiLohi",
  });
  console.log(req.body);
  console.log(completeUser.cart.totalPrice);
  let order = await instance.orders.create({
    amount: completeUser.cart.totalPrice * 100,
    currency: "INR",
    receipt: "receipt#1",
  });
  res.status(201).json({
    success: true,
    order,
  });
};

const loadSuccess = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const productData = await Product.find();
      for (let key of userData.cart.item) {
        console.log(key.productId, " + ", key.qty);
        for (let prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.stock = prod.stock - key.qty;
            await prod.save();
          }
        }
      }
      await Orders.find({
        userId: userSession.userId,
      });
      await Orders.updateOne(
        { userId: userSession.userId, _id: userSession.currentOrder },
        { $set: { status: "Build" } }
      );

      await User.updateOne(
        { _id: userSession.userId },
        { $set: { "cart.item": [], "cart.totalPrice": "0" } },
        { multi: true }
      );
      console.log("Order Built and Cart is Empty.");
    }
    userSession.couponTotal = 0;
    res.render("orderSuccess", {
      isLoggedin,
      orderId: userSession.currentOrder,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadWishlist = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("wishlist.item.productId");
      if (userData.wishlist.item.length == 0) {
        res.render("emptyWishlist", { isLoggedin });
      } else {
        res.render("wishlist", {
          isLoggedin,
          id: userSession.userId,
          wishlistProducts: completeUser.wishlist,
        });
      }
    } else {
      res.render("wishlist", { isLoggedin, id: userSession.userId });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.findById({ _id: productId });
    userData.addToWishlist(productData);
    res.redirect("/shop");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    let updatewish = await userData.removefromWishlist(productId);
    if (updatewish) {
      res.redirect("/wishlist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addCartdelWishlist = async (req, res) => {
  try {
    const productId = req.query.id;
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const productData = await Product.findById({ _id: productId });
  const add = await userData.addToCart(productData);
  if (add) {
    let update = await userData.removefromWishlist(productId);
    if (update) {
      res.redirect("/cart");
    }
  }
  } catch (error) {
    console.log(error.message);
  }
  
};

const addCoupon = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const offerData = await Offer.findOne({ name: req.body.offer });

      if (offerData) {
        if (offerData.usedBy.includes(userSession.userId)) {
          nocoupon = true;
          res.redirect("/checkout");
        } else {
          userSession.offer.name = offerData.name;
          userSession.offer.type = offerData.type;
          userSession.offer.discount = offerData.discount;
          let updatedTotal =
            userData.cart.totalPrice -
            (userData.cart.totalPrice * userSession.offer.discount) / 100;
          userSession.couponTotal = updatedTotal;
          res.redirect("/checkout");
        }
      } else {
        res.redirect("/checkout");
      }
    } else {
      res.redirect("/checkout");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  userSession = req.session;
  userSession.userId = false;
  isLoggedin = false;
  console.log("logged out");
  res.redirect("/shop");
};

module.exports = {
  loginLoad,
  insertuser,
  loadRegister,
  loadOtp,
  verifyOtp,
  verifyLogin,
  loadHome,
  loadshop,
  viewProductPage,
  loadCart,
  addToCart,
  userLogout,
  deleteCart,
  editUser,
  updateUser,
  storeOrder,
  loadSuccess,
  addToWishlist,
  loadWishlist,
  addCartdelWishlist,
  deleteWishlist,
  addCoupon,
  userDashboard,
  addAddress,
  deleteAddress,
  loadCheckout,
  viewOrder,
  cancelOrder,
  returnProduct,
  editqty,
  razorpayCheckout,
};
