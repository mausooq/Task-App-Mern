const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
    userId : {type:mongoose.Schema.Types.ObjectId,ref:'User',require:true},
    token : {type:String,require:true},
    expiresAt : {type:Date,require:true,default:Date.now}

}) 

module.exports = mongoose.model('PasswordResetToken',PasswordResetTokenSchema);