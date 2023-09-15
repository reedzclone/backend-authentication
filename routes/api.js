const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken")
const db =
  "mongodb+srv://angular-auth:Futurebest@cluster0.coll1.mongodb.net/angular-auth?retryWrites=true&w=majority";

async function connect() {
  try {
    await mongoose.connect(db);
    console.log("connected to MongoDb");
  } catch (error) {
    console.error(error);
  }
}

connect();

function verifyToken(req, res, next) {
    if(!req.headers.authorization) {
        return res.status(401).send('Unauthorized Request')
    }
    let token = req.headers.authorization.split(' ')[1];
    if(token === 'null') {
        return res.status(401).send('Unauthorized Request')
    }
    let payload = jwt.verify(token, 'secretKey')
    if(!payload) {
        return res.status(401).send('Unauthorized Request')
    }
    req.userId = payload.subject
    next()
}


router.get("/", (req, res) => {
  res.send("From API Route");
});
//SIGNUP
router.post("/signup", async (req, res) => {
  let userData = req.body;
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    let user = new User(userData);
    await user.save();
    delete user.password;
    let payload = {subject: user._id}
    let token = jwt.sign(payload, 'secretKey')
    res.status(200).json({token});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Login
router.post("/login", async (req, res) => {
  let userData = req.body;
  const { email, password } = userData;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    //Checking if Password matches the stored password
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Crendetials" });
    }
    let payload = {subject: user._id}
    let token = jwt.sign(payload, 'secretKey')
    res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//GET ALL USERS
router.get("/users", async (req, res) => {
    
    try {
        const users = await User.find();

        res.json(users);
    } catch (error) {
        console.error("Error fetching user information", error);
        res.status(500).json({message: "Internal server error"})
    }
})

module.exports = router;
