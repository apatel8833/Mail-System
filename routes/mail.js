 mongoose = require("mongoose");
let mailSchema = mongoose.Schema({
    userid : { 
        type : mongoose.Schema.Types.ObjectId,
        ref : "user" 
    },
    senderid :
    {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"    
    },
    receiver : String , 
    mailtext : String,
    subject : String,
    date : String,
    trash : Boolean,
    spam : Boolean,
    imp : Boolean
})

module.exports = mongoose.model('mail' , mailSchema);