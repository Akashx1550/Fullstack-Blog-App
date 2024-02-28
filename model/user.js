const mongoose = require('mongoose');

const {Schema} = mongoose;

let userSchema = new mongoose.Schema({
    username : String,
    email: String,
    password : String,
    isVerified: {
        type : Boolean,
        Default : false
    },

    verificationToken: String,

    blog:[
        {
            type : Schema.Types.ObjectId,
            ref:"Blog"
        }
    ]
})

module.exports = mongoose.model('User', userSchema);