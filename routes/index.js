
//  index.js

var multer = require('multer');
var express = require('express');
var sendmail = require("../routes/nodemailer")

var router = express.Router();
const passport = require("passport");
const userModel = require("./users");
const mailModel = require("./mail");
const localStrategy = require("passport-local");
const axios = require('axios')

passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + Math.floor(Math.random() * 10000000000) + file.originalname
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

router.post('/fileimage', isLoggedIn, upload.single('image'), async function (req, res, next) {
  let loggedInUser = await userModel.findOne({ username: req.session.passport.user })
  loggedInUser.profilePic = req.file.filename;
  await loggedInUser.save();
  res.redirect(req.headers.referer);
})

router.get('/forget', function (req, res, next) {
  res.render('forget');
});

router.post('/reset', async function (req, res) {
  let user = await userModel.findOne({ email: req.body.email });
  if (user) {
    let rn = Math.floor(Math.random() * 1000000)
    sendmail(user.email, rn, user._id).then(async function () {
      user.otp = rn;
      user.expiresAt = Date.now() + 24 * 60 * 1000;
      await user.save();
      res.send("DOne");
    })
  }
  else {
    res.send("not exist!");
  }
});

router.get('/reset/password/:id/:otp', function (req, res, next) {
  userModel.findOne({ _id: req.params.id }).then(function (user) {
    if (user.expiresAt < Date.now()) {
      res.send(" itna dheehma be nahi chalna ta");
    }
    else {
      if (user.otp === req.params.otp) {
        res.render("resetPage" , {user});
      }

    }
  })
});

router.post('/setpassword/:id',async function (req, res, next) {
  let user = await userModel.findOne({_id : req.params.id});
  if(req.body.password === req.body.confirmpassword)
  {
    user.setPassword(req.body.password, async function(err, user){ 
      await user.save();
      res.send("ho gya");
    })
  }
});


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('register');
});

module.exports = router;
router.post('/register', function (req, res, next) {
  var userData = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email

  })
  userModel.register(userData, req.body.password).then(function (registerUser) {
    passport.authenticate('local')(req, res, function () {
      res.redirect('/profile')
    })
  })
    .catch(function (err) {
      console.log(err);
      res.redirect("/login");
    })
});



router.post("/login", passport.authenticate('local', {
  successRedirect: "/profile",
  failureRedirect: "/register"
}), function (req, res) { })

router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logOut(function (err) {
    if (err) throw err;
    res.redirect("/login")
  });
})

//code for /profile route

router.get("/profile", isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'receivedMails',
      populate: {
        path: 'userid'
      }
    })
    .then(function (foundUser) {
      console.log(foundUser.receivedMails)
      res.render("profile", { foundUser })
    })
})

router.get("/readmore/:id", isLoggedIn, async function (req, res) {
  let maildetails = await mailModel.findOne({ _id: req.params.id })
  let foundUser = await userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'sentMails',
      populate: {
        path: 'userid'
      }
    })
  console.log(foundUser)
  res.render("readmore", { foundUser, maildetails })

})

router.get("/sent", isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'sentMails',
      populate: {
        path: 'userid'
      }
    })
    .then(function (foundUser) {
      console.log(foundUser)
      res.render("sent", { foundUser })
    })
})



// router.get("/sent" , isLoggedIn , async function(req , res){
//   let loggedInUser = await userModel.findOne({username : req.session.passport.user}).populate({path: "sentMails"})
//   console.log(loggedInUser)

//   res.render( "sent" , {loggedInUser})
// })
//function to check if the user is logedin

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login")
}

//make route for login page

router.get("/login", function (req, res) {
  res.render("login");
})

//make login.ejs

//make a form, set its action to /login method post
// take username,password
// add input type submit


//make a /register route

router.get("/register", function (req, res) {
  res.render("register");
})

router.post("/compose", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user })
 const senderid = await userModel.findOne({email : req.body.receivemail})
  const createMail = await mailModel.create({
    userid: loggedInUser._id,
    senderid : senderid._id,
    receiver: req.body.receivemail,
    mailtext: req.body.mailtext,
    subject : req.body.subject,
    date : new Date().toLocaleString()
  })
  loggedInUser.sentMails.push(createMail._id);
  const loggedInUserUpdate = await loggedInUser.save();

  const receiverUser = await userModel.findOne({ email: req.body.receivemail });
  receiverUser.receivedMails.push(createMail._id);

  await receiverUser.save();
  res.redirect(req.headers.referer);
})


router.get('/check/:username', async function (req, res) {
  let user = await userModel.findOne({ username: req.params.username })
  res.json({ user })
});

router.get('/checkmail/:email', async function (req, res) {
  let user = await userModel.findOne({ email: req.params.email })
  res.json({ user })
});

router.get('/profile/inbox/:id' , async function(req,res){
  // const foundUser = await userModel.findOne({username : req.session.passport.user})
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user })

  const receivedMail = await mailModel.findOne({_id : req.params.id})
  // console.log(loggedInUser);
  // console.log(receivedMail);
 const userdetails = await  receivedMail.populate({path : "userid"})
 console.log(userdetails)
  res.render("inbox_readmore" , {receivedMail , foundUser:loggedInUser , userdetails});
})



router.get("/trash/:id" , async function(req, res){
  
  const loggedInUser = await mailModel.findOne({_id : req.params.id})
  if(loggedInUser.trash)
  {
    loggedInUser.trash = false;
  }
  else
  {
    loggedInUser.trash = true;
  }
  loggedInUser.save();
  
  // res.redirect( "/profile" , {message : req.flash("mail goes to trash")});
  res.redirect( req.headers.referer);

})

router.get("/spam/:id" , async function(req, res){
  
  const loggedInUser = await mailModel.findOne({_id : req.params.id})
  if(loggedInUser.spam)
  {
    loggedInUser.spam = false;
  }
  else
  {
    loggedInUser.spam = true;
  }
  loggedInUser.save();
  res.redirect( req.headers.referer);
})

router.get("/imp/:id" , async function(req, res){
  
  const loggedInUser = await mailModel.findOne({_id : req.params.id})
  if(loggedInUser.imp)
  {
    loggedInUser.imp = false;
  }
  else
  {
    loggedInUser.imp = true;
  }
  loggedInUser.save();
  res.redirect( req.headers.referer);
})

router.get("/trash", isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'receivedMails',
      populate: {
        path: 'userid'
      }
    })
    .then(function (foundUser) {
      console.log(foundUser.receivedMails)
      res.render("trash", { foundUser })
    })
})

router.get("/spam", isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'receivedMails',
      populate: {
        path: 'userid'
      }
    })
    .then(function (foundUser) {
      console.log(foundUser.receivedMails)
      res.render("spam", { foundUser })
    })
})


router.get("/imp", isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'receivedMails',
      populate: {
        path: 'userid'
      }
    })
    .then(function (foundUser) {
      console.log(foundUser.receivedMails)
      res.render("imp", { foundUser })
    })
})