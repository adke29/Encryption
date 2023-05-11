//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
require('dotenv').config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//setup express
const app = express();

app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret: "Some keyword for session",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

//setup mongoose
const dbName = "userDB";
mongoose.connect("mongodb://127.0.0.1:27017/" + dbName);
const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

userSchema.plugin(passportLocalMongoose);
                                                 
const User = mongoose.model("users", userSchema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res)=>{
    res.render("home");
})

//login
app.get("/login", (req,res)=>{
    res.render("login",{inputError:""});
})

//register
app.get("/register", (req,res)=>{
    res.render("register",{inputError:""});
})

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/register");
    }
})



//post request
app.post("/login",(req,res) =>{
    



})
app.post("/register",(req,res)=>{
   User.register({username:req.body.username},req.body.password,function (err,user){
    if(err){
        console.log(err);
        res.redirect('/register',{inputError:"Error"});
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })
    }
   })
        
})


app.listen(process.env.PORT || 3000, () =>{
    console.log("Server is running yes");
})