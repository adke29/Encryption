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
    secret: "some key for session",
    resave: false,
    saveUninitialized:true
}))

app.use(passport.initialize());
app.use(passport.session());

//setup mongoose
const dbName = "userDB";
mongoose.connect("mongodb://127.0.0.1:27017/" + dbName);
const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("users", userSchema);

passport.use(User.createStrategy());
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

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.render("login",{inputError:"Please register/login first"})
    }
})

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if (err){ 
            console.log(err); 
        }else{
            console.log("logout success")
        }})
    res.redirect("/");
})


//post request
app.post("/login",(req,res) =>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
            res.render("login",{inputError:"Wrong Email/Password"});
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})
app.post("/register", (req,res)=>{
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.render("register",{inputError:"Error"});
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    
      });
})


app.listen(process.env.PORT || 3000, () =>{
    console.log("Server is running");
})