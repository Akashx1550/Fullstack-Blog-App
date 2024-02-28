const mongoose = require('mongoose');

const {Schema} = mongoose;

let blogSchema = new mongoose.Schema({
    imageURL: String,
    title : String,
    desc : String,

    user : {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    approved :{
        type : Boolean,
        default : false
    }
})

module.exports = mongoose.model('Blog', blogSchema);