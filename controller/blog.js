const User = require('../model/user');      //await Save, find,findOne -> return in form of array , findByIdAndUpdate
const Admin = require('../model/admin');
const Blog = require('../model/blog');
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'drfam5mgv',
    api_key: '967581581334764',
    api_secret: 'Xm4W0eQZOaX6nVDmIZuB__w1BGo'
});


const { transporter, generateVerificationToken } = require('../Utils/nodemailer');


module.exports.checkIsLoggedIn = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

module.exports.checkIsLoggedInAdmin = (req, res, next) => {
    if (req.session.isLoggedInAdmin) {
        next();
    } else {
        res.render('adminLogin');
    }
};

module.exports.checkAdminForBlog = (req, res, next) => {
    if (req.session.isLoggedInAdmin) {
        next();
    } else if (req.session.isLoggedIn) {
        next();
    }
    else {
        res.render('login');
    }
}


module.exports.getHome = async (req, res) => {
    const latestBlog = await Blog.find().populate('user').exec();
    // console.log(latestBlog)
    res.render('home', { latestBlog, isLoggedIn: req.session.isLoggedIn, isLoggedInAdmin: req.session.isLoggedInAdmin });
};

module.exports.getLogin = (req, res) => {
    res.render("login");
};

module.exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    let user = await User.findOne({ username: username });

    if (user && user.isVerified) {
        if (user.password != password) {
            res.send("Invalid password!")
        } else {

            if (req.session.isLoggedInAdmin) {
                req.session.isLoggedInAdmin = false;
                req.session.admin = null;
            }
            req.session.isLoggedIn = true;
            req.session.user = user;
            res.redirect('/');
        }
    } else if (user && !user.isVerified) {
        res.send("User not verified! To continue using your account, please verify your email.")
    }
    else {
        res.send("User not found")
    }
};

module.exports.getRegister = (req, res) => {
    res.render("register");
};

module.exports.postRegister = async (req, res) => {
    const { username, email, password } = req.body;
    let newUser = new User({ username, email, password, verificationToken: generateVerificationToken() }); //If both keys in schema are different then we have to separely pass key and values and if same name then store only values directly
    await newUser.save();   //Asynchronous
    // res.send("User successfully registered")
    // const verificationLink = `http://localhost:3334/verify?token=${newUser.verificationToken}`;
    const verificationLink = `https://fullstack-blog-app-v3k0.onrender.com/verify?token=${newUser.verificationToken}`;

    const mailOptions = {
        from: 'akashx1550@gmai.com',
        to: newUser.email,
        subject: 'Email Verification',
        html: `Click <a href="${verificationLink}">here</a> to verify your email.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    // Send response with registration message and login page link
    const registrationMessage = "User successfully registered. Please check your mail and verify your account";
    const loginPageLink = "https://fullstack-blog-app-v3k0.onrender.com/login"; // Replace with your actual login page URL
    const responseMessage = `${registrationMessage}.Go to <a href="${loginPageLink}">login</a> page.`;

    res.send(responseMessage);

    // res.send("User successfully registered");
};

module.exports.getVerification = async (req, res) => {
    const token = req.query.token;

    try {
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).send('Invalid verification token.');
        }

        // Update user's isVerified field
        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();

        return res.status(200).send('Email verified successfully.');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error verifying email.');
    }
};

module.exports.getAdmin = async (req, res) => {

    const latestBlog = await Blog.find().populate('user').exec();
    // console.log(latestBlog);
    res.render('admin', { latestBlog });
};

module.exports.postAdmin = async (req, res) => {
    const { username, password } = req.body;
    let admin = await Admin.findOne({ username: username });

    if (admin) {
        if (admin.password != password) {
            res.send("Invalid password!")
        } else {
            if (req.session.isLoggedIn) {
                req.session.isLoggedIn = false;
                req.session.user = null;
            }
            req.session.isLoggedInAdmin = true;
            req.session.admin = admin;
            res.redirect('/admin');
        }
    } else {
        res.send("Not an admin!")
    }
};


module.exports.getApproveBlog = async (req, res) => {
    const { blogId } = req.params;
    try {
        const blog = await Blog.findByIdAndUpdate(blogId, { $set: { approved: true } }, { new: true }); //The new: true option specifies that the method should return the modified document rather than the original document. 
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.getRejectBlog = async (req, res) => {
    const { blogId } = req.params;
    // Add logic to handle blog rejection
    try {
        const blog = await Blog.findByIdAndDelete(blogId);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log("Blog Rejected with ID: " + blogId);
};

module.exports.getAddBlog = (req, res) => {
    res.render("addBlog");
};

module.exports.postAddBlog = async (req, res) => {

    if (req.session.user && req.session.user._id) {
        // let { imageURL, title, desc } = req.body;
        const { title, desc } = req.body;
        const { path } = req.file;
        console.log(req.file);
        // console.log(imageURL);

        try {
            let result = await cloudinary.uploader.upload(path, { public_id: "olympic_flag" });
            console.log(result);

            let newBlog = new Blog({ imageURL: result.url, title, desc, user: req.session.user._id, approved: false });
            await newBlog.save();

            const user = await User.findById(req.session.user._id);
            user.blog.push(newBlog._id);
            await user.save();

            res.redirect('/');
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    } else if (req.session.admin) {

        const adminUser = await User.findOne({ email: "akashx1550@gmail.com" });
        if (!adminUser) {
            return res.send("Admin user not found.");
        }

        const { title, desc } = req.body;
        const { path } = req.file;

        try {
            let result = await cloudinary.uploader.upload(path, { public_id: "olympic_flag" });
            console.log(result);

            let newBlog = new Blog({ imageURL: result.url, title, desc, user: adminUser._id, approved: true });
            await newBlog.save();

            adminUser.blog.push(newBlog._id);
            await adminUser.save();

            // console.log(newBlog);

            res.redirect('/');
        } catch (error) {
            console.error("Error uploading image:", error);
        }

    }

    else {

        res.render('login');
    }
};

module.exports.getMyBlogs = async (req, res) => {
    const user = await User.findById(req.session.user._id).populate('blog');
    // console.log(user);

    res.render('myBlog', { blogs: user.blog })
};

module.exports.getLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.redirect('/');
        }
    });
};


module.exports.getReadMore = async (req, res) => {
    const { blogId } = req.params;
    // console.log(blogId);

    const blog = await Blog.findOne({ _id: blogId }).populate('user');
    // console.log(blog)
    if (!blog) {
        return res.status(404).send("Blog not found");
    }

    res.render('readMore', { blog });
}
