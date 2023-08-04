//                                          users.js
var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb+srv://r8:namanjain@cluster0.dhxx6yr.mongodb.net/?retryWrites=true&w=majority')

var userSchema = mongoose.Schema({
  username : String,
  password : String,
  email : String , 
  fullname : String,
  profilePic : {
    type : String , 
    default : "shery.png"
  },
  sentMails : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "mail"
  }],
  receivedMails : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "mail"
  }],
  expireAt: {
    type : Date,
    default : Date.now() + 24*60*60*1000
  },
   otp : String
})
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('user' , userSchema);
