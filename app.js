//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');
require('dotenv').config();

//setup express
const app = express();
app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//setup mongoose
const dbName = "userDB";
mongoose.connect("mongodb://127.0.0.1:27017/" + dbName);
const userSchema = new mongoose.Schema({
    email: {type:String, required:true},
    password: {type:String, required:true}
})

//encrypt
userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password']});
const Users = mongoose.model("users", userSchema);



app.get("/", (req,res)=>{
    res.render("home");
})

//login
app.route("/login")
.get((req,res)=>{
    res.render("login",{inputError:""});
}).post((req,res) =>{
    Users.findOne({email: req.body.email}).then((user)=>{
        if(user.password === req.body.password){
            res.render("secrets");
        }else{
            res.render("login",{inputError:"Wrong Password"});
        }
    }).catch((err) =>{
        res.render("login",{inputError:"Email Not Found"});
    })
})

//register
app.route("/register")
.get( (req,res)=>{
    res.render("register");
})
.post(async (req,res)=>{
    const newUser = new Users({
        email: req.body.email,
        password: req.body.password
    })
    newUser.save().then(()=>{
        res.render("secrets");
    }).catch((err) =>{
        console.log(err);
    })
})



app.listen(process.env.PORT || 3000, () =>{
    console.log("Server is running");
})