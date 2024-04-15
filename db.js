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

const tokenSchema = mongoose.Schema({
    access_token: String,
    refresh_token: String,
    expires_in: Date
});

const courseQuestionSchema =  mongoose.Schema({
  courseId: {
    type: String, // Assuming the course ID is a string
    required: true
  },
  questions: [{
    question: { type: String, required: true },
    options: {
      true: { type: String, required: true },
      false: { type: String, required: true }
    }
  }]
});


const course = mongoose.model('courses', courseSchema);
const token = mongoose.model('tokens', tokenSchema);
const course_question = mongoose.model('course_question', courseQuestionSchema);

module.exports = {course, token, course_question}