const express = require('express'); //Express js is a backend web application framework for building RESTFUL APIs with Node.js.
const app = express();
const path = require('path');
const mongoose = require('mongoose');   //Mongoose is an object data library for mongoDB and node JS
const session = require('express-session')      //express-session is a middleware package i,e used to impement sessions in express
app.use(express.static('views/images/'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads" , express.static(path.join(__dirname , 'uploads')));

app.use(session({
    secret: 'secret'
}))
app.use(express.urlencoded({ extended: true }));    //To parse url encoded data
app.use(express.json());    //To parse json data

app.set('view engine', 'hbs');

const port = 3334;

app.use('/', require('./routes/blog'));

mongoose.connect('mongodb://127.0.0.1:27017/G17Session').then(() => {
    app.listen(port, () => {
        console.log(`Server started on ${port}`);
    })
})


