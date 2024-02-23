const mongoose = require("mongoose");
//mongodb+srv://sonali:<password>@cluster0.ttvbing.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
mongoose.connect("mongodb+srv://sonali:sonali@cluster0.ttvbing.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
const courseSchema= mongoose.Schema({
    user_id: Number,
    before_you_begin:String,
    fullname: String,
    email: String,
    ldtype:String,
    specification: String,
    title: String,
    date: Date,
    totalhours: String
})

const course = mongoose.model('courses', courseSchema);
module.exports = {course}