const nodemailer = require('nodemailer');
const crypto = require('crypto');


module.exports.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'akashx1550@gmail.com',
        pass: 'lyxq pzoi idlv gjcb'
    }
});


// Generate a random verification token
module.exports.generateVerificationToken = () => {
    return crypto.randomBytes(20).toString('hex');  //crypto is used to generate verification token for the user
};