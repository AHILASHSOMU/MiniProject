const mongoose = require("./util/database");
const admin_route = require("./routes/adminRoute");
const user_route = require("./routes/userRoute");

const express = require("express");
const app = express();
const path = require("path");
const dbpath = require("./config/connection");
const session = require("express-session");
const config = require("./config/config");


// mongoose.connect(dbpath.dbpath, () => {
//   console.log("Database Connected.");
// });

app.use(session({ secret: config.sessionSecret }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", user_route);
app.use("/admin", admin_route);

app.set("view engine", "ejs");
admin_route.set("views", "./views/admin");
user_route.set("views", "./views/users");

app.use("/", express.static("public"));
app.use("/", express.static("public/assets"));
app.use("/admin", express.static("public/admin"));

app.listen(3000, function () {
  console.log("server is running");
});
