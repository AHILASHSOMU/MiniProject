const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require('../models/ordersModel');
const Banner = require('../models/bannerModel')
const Offer = require('../models/offerModel')

// const securePassword = async(password)=>{
//   try{
//       const passwordHash = await bcrypt.hash(password,10)
//       return passwordHash

//   }catch(error){
//       console.log(error.message);
//   }
// };

let isAdminLoggedin;
isAdminLoggedin = false;
let adminSession = false || {};
let orderType = 'all'

const path = require("path");
const multer = require("multer");
let Storage = multer.diskStorage({
  destination: "./public/assets/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});


let upload = multer({
  storage: Storage,
}).single("gImage");

const adminhome = async (req, res) => {
  try {
    adminSession = req.session;
    if (isAdminLoggedin) {
      const xxx = await Order.aggregate([
        {
            $group: {
                _id: { $dayOfWeek: { date: "$createdAt" } },
                amount: { $sum: "$sellingPrice" },
            },
      },
    ]);

      const count = await Order.find().count()
      const products = await Product.count()
      const users = await User.count()
      const productData = await Product.find();
      const userData = await User.find();
      choice = "none";

      const a = xxx.map((x) => x._id);
        const amount = xxx.map((x)=>x.amount);
      res.render("home", {
        products: productData,
        users: userData,
        choices: choice,
        amounts:amount,
        counts:count,
        product:products,
        user:users
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};



const adminload = async (req, res) => {
  res.render("login");
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login");
        } else {
          adminSession = req.session;
          isAdminLoggedin = true;
          adminSession.adminId = userData._id;
          console.log("Admin logged in");
          res.redirect("/admin");
        }
      } else {
        res.render("login");
      }
    } else {
      res.render("login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadAdminBanners = async (req, res) => {
  try {
    const banner = await Banner.find()
    console.log(banner);
    res.render('banner', {
      banners: banner
    })
  } catch (error) {
    console.log(error.message)
  }
}

const addBanner = async (req, res) => {
  try {
    const newBanner = req.body.bannername
    const a = req.files

    const banner = new Banner({
      banner: newBanner,
      banerimage:a.map((x) => x.filename)
      
    })

    const bannerData = await banner.save()

    if (bannerData) {
      res.redirect('/admin/banners')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const currentBanner = async (req, res) => {
  try {
    const id = req.query.id
    await Banner.findOneAndUpdate({isActive:1},{$set:{isActive:0}})

    await Banner.findByIdAndUpdate({ _id: id },{$set:{isActive:1}})
    res.redirect('/admin/banners')
  } catch (error) {
    console.log(error.message)
  }
}

const viewUser = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });
    res.render("adminUser", { users: userData });
  } catch (error) {
    console.log(error.message)
  }

};

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData.isVerified) {
      await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 0 } });
    } else {
      await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 1 } });
    }
    res.redirect("/admin/adminUsers");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({_id: id});
    if (productData.isAvailable){
      await Product.findByIdAndUpdate({ _id: id }, { $set: { isAvailable: 0 } });
    }else{
      await Product.findByIdAndUpdate({ _id: id }, { $set: { isAvailable: 1 } });
    }
    res.redirect("/admin/adminProductlist");
  } catch (error) {
    console.log(error.message);
  }
};

const viewProduct = async (req, res) => {
  try {
    const productData = await Product.find();
    res.render("adminProductlist", { products: productData });
  } catch (error) {
    console.log(error.message);
  }

};

const addProduct = async (req, res) => {
  try {
    const categoryData = await Category.find();
    console.log(categoryData);
    res.render("addProduct", { category: categoryData });
  } catch (error) {
    console.log(error.message);
  }

};

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    const categoryData = await Category.find();
    if (productData) {
      res.render("edit-product", { product: productData,category: categoryData  });
    } else {
      res.redirect("/admin/view-product");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateAddProduct = async (req, res) => {
  try {
    // const spassword = await securePassword(req.body.password)
    const files=req.files
    const categoryData = await Category.find();
    const product = Product({
      productname: req.body.gproductName,
      // category: req.body.gCategory,
      // category: req.body.gCategory,
      price: req.body.gPrice,
      stock: req.body.gStock,
      rating: req.body.gRating,
      image: files.map((x)=>x.filename),
    });
    // console.log(req.body.gtype);
    //   await Product.updateOne({name:req.body.name},{$push:{genre:{genreName:req.body.genre}}})
    product.category = req.body.gCategory;
    console.log(product);
    const productData = await product.save();
    if (productData) {
      res.render("addProduct", {
        message: "Your registration was successfull.",
        category: categoryData,
      });
    } else {
      res.render("addProduct", { message: "Your registration was a failure" });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const updateEditProduct = async (req, res) => {
  try {
    const files=req.files
    const productData = await Product.findByIdAndUpdate({ _id: req.body.id },
      {
        $set: {
          productname: req.body.gproductName,
          category: req.body.gCategory,
          // dresstype: req.body.gtype,
          price: req.body.gPrice,
          stock: req.body.gStock,
          rating: req.body.gRating,
          image: files.map((x)=>x.filename),
        },
      }
    );
   
    await productData.save();
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log(error.message);
  }
};

const viewCategory = async (req, res) => {
  const categoryData = await Category.find();
  res.render("adminCategory", { category: categoryData });
};

const addCategory = async (req, res) => {
  try {
    const reqcategory = req.body.category
    const allCategory = await Category.find()
    const categoryat = await Category.findOne({ name: reqcategory })
   if(categoryat){
    res.render('adminCategory',{category:allCategory, message: 'category already exists..' })
   }else{
    const category = new Category({
      name: req.body.category
    })
    const categoryData = await category.save()
    res.redirect('/admin/adminCategory')
  }} catch (error) {
    console.log(error.message)
  }

};

const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById({ _id: id });
    if(categoryData.isAvailable){
      await Category.findByIdAndUpdate({_id: id},{ $set: { isAvailable: 0}})
    }else{
      await Category.findByIdAndUpdate({_id: id},{ $set: { isAvailable: 1}})
    }
   
    res.redirect("/admin/adminCategory");
  } catch (error) {
    console.log(error.message);
  }
};

const adminLoadOffer = async(req,res)=>{
  const offerData = await Offer.find()
  res.render('adminOffer',{offer:offerData})
};

const adminStoreOffer = async(req,res)=>{
  try {
    const offer =Offer({
      name:req.body.name,
      type:req.body.type,
      discount:req.body.discount
  })
  await offer.save()
  res.redirect('/admin/adminOffer')

  } catch (error) {
    console.log(error.message);
  }
 
}

const deleteOffer = async (req,res) =>{
  try {
    const id = req.query.id;
    await Offer.deleteOne({ _id: id});
    res.redirect("/admin/adminOffer");
  } catch (error) {
    console.log(error.message);
  }
}



const viewOrder = async (req, res) => {
  try {
      const productData = await Product.find();
      const userData = await User.find({ is_admin: 0 });
      const orderData = await Order.find().sort({ createdAt: -1 });
      for(let key of orderData){
        
        await key.populate('products.item.productId');
        await key.populate('userId');
      }
      if (orderType == "undefined") {
        res.render('adminOrder', {
          users: userData,
          product: productData,
          order: orderData,
        });
      } else {
        id = req.query.id;

        res.render('adminOrder', {
          users: userData,
          product: productData,
          order: orderData,
          id: id,
        });
      }
  } catch (error) {
    console.log(error.message);
  }
};

const adminOrderDetails= async(req,res)=>{
  try {
   
      const id = req.query.id
      const orderData = await Order.findById({_id:id});
      await orderData.populate('products.item.productId');
      await orderData.populate('userId')
 res.render('adminViewOrder',{
  order:orderData,
 })  
  } catch (error) {
    console.log(error.message);
  }
}

const adminCancelOrder = async (req, res) => {
  const id = req.query.id;
  await Order.deleteOne({ _id: id });
  res.redirect('/admin/adminOrder');
};

const adminConfirmorder = async (req, res) => {
  const id = req.query.id;
  await Order.updateOne({ _id: id }, { $set: { status: 'Comfirmed' } });
  res.redirect('/admin/adminOrder');
};

const adminDeliveredorder = async (req, res) => {
  const id = req.query.id;
  await Order.updateOne({ _id: id }, { $set: { status: 'Delivered' } });
  res.redirect('/admin/adminOrder');
};

const salesReport = async(req,res)=>{
  try {
    const productData = await Product.find()
    res.render('adminSalesSheet',{product:productData,admin:true})
  } catch (error) {
    console.log(error.message);
}
}

const adminLogout = async (req, res) => {
  try {
    adminSession = req.session;
    adminSession.userId = false;
    isAdminLoggedin = false;
    console.log("Admin logged out");
    res.redirect("/admin");
    
  } catch (error) {
    console.log(error.message);
  }
 
};

module.exports = {
  adminload,
  verifyLogin,
  adminhome,
  viewUser,
  blockUser,
  viewProduct,
  addProduct,
  updateAddProduct,
  upload,
  deleteProduct,
  updateEditProduct,
  editProduct,
  viewCategory,
  addCategory,
  deleteCategory,
  adminLoadOffer,
  adminStoreOffer,
  deleteOffer,
  loadAdminBanners,
  addBanner,
  currentBanner,
  viewOrder,
  adminCancelOrder,
  adminConfirmorder,
  adminDeliveredorder,
  adminOrderDetails,
  salesReport,
  adminLogout,
};
