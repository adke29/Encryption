//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
require('dotenv').config();
const encrypt = require('mongoose-encryption');
//const bcrypt = require('bcrypt');
//const saltRounds = 10;


//setup express
const app = express();
app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


//setup mongoose
const dbName = "userDB";
mongoose.connect("mongodb://127.0.0.1:27017/" + dbName);
const userSchema = new mongoose.Schema({
    username: {type:String, required:true},
    password: {type:String, required:true}
})

//encrypt
userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password']});
//userSchema.plugin(passportLocalMongoose)                                                    //add plugin to schema
const User = mongoose.model("users", userSchema);


app.get("/", (req,res)=>{
    res.render("home");
})

//login
app.route("/login")
.get((req,res)=>{
    res.render("login",{inputError:""});
})
.post((req,res) =>{
    User.findOne({username: req.body.username}).then(function (user){
        if(user.password === req.body.password){
            res.render("secrets");
        }else{
            res.render("login",{inputError:"Wrong Password"});
        }
    }).catch((err) =>{
        res.render("login",{inputError:"username Not Found"});
    })
})

    // User.findOne({username: req.body.username}).then((user)=>{
    //     bcrypt.compare(req.body.password, user.password, function(err, result) {
    //         if(result){
    //             res.render("secrets");
    //         }else{
    //             res.render("login",{inputError:"Wrong Password"});
    //         }
    //     });
        
        
    


//register
app.route("/register")
.get( (req,res)=>{
    res.render("register",{inputError:""});
})
.post( (req,res)=>{
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    })
    newUser.save().then(()=>{
        res.render("secrets");
    }).catch((err)=>{
        res.render("register",{inputError:"Error Register"})
    })
        
})
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         username: req.body.username,
    //         password: hash
    //     })
    //     newUser.save().then(()=>{
    //         res.render("secrets");
    //     }).catch((err) =>{
    //         console.log(err);
    //     })
    // });
    





app.get("/register",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})



app.listen(process.env.PORT || 3000, () =>{
    console.log("Server is running");
})