//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
require('dotenv').config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create')

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
mongoose.connect(process.env.DATABASE_URI + dbName);
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
})
userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("users", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.URI+"/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id },function (user,err) {
      return cb(user,err);
    });
  }
));


app.get("/", (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/secrets");
    }else{
        res.render("home",{isAuthenticated:false});
    }
})

//login
app.get("/login", (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/secrets");
    }else{
        res.render("login",{inputError:"",isAuthenticated:false});
    }
    
})

//register
app.get("/register", (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/secrets");
    }else{
        res.render("register",{inputError:"",isAuthenticated:false});
    }
})

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        User.find({secret:{$ne:null}}).then((users)=>{
            res.render("secrets", {users: users,isAuthenticated:true})
        }).catch((err)=>{
            console.log("Error");
            console.log(err);
        })
    }else{
        res.render("login",{inputError:"Please register/login first",isAuthenticated:false})
    }
})

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if (err){ 
            console.log(err); 
        }})
    res.redirect("/");
})

app.get("/auth/google",passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get("/submit",(req,res) =>{
    if(req.isAuthenticated()){
        res.render("submit",{isAuthenticated:true});
    }else{
        res.render("login",{inputError:"Please register/login first",isAuthenticated:false});
    }
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
            res.render("login",{inputError:"Wrong Email/Password",isAuthenticated:false});
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
            res.render("register",{inputError:"Email has been used",isAuthenticated:false});
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    
      });
});

app.post("/submit",(req,res)=>{
    User.findById(req.user._id).then(function(user){
        user.secret = req.body.secret;
        user.save().then(()=>{
            res.redirect("/secrets");
        });
    }).catch(function(err){
        console.log(err);
        res.redirect("/submit");
    })
})

app.listen(process.env.PORT || 3000, () =>{
    console.log("Server is running");
})