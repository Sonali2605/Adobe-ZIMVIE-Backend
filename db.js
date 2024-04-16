const mongoose = require("mongoose");
//mongodb+srv://sonali:<password>@cluster0.ttvbing.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
                 //mongodb+srv://sonali:sonali@cluster0.ttvbing.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
mongoose.connect("mongodb+srv://sonali:sonali1234@cluster0.ij3nnwp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
// const courseSchema= mongoose.Schema({
//     user_id: Number,
//     before_you_begin:String,
//     fullname: String,
//     email: String,
//     ldtype:String,
//     specification: String,
//     title: String,
//     date: Date,
//     totalhours: String
// })

// const tokenSchema = mongoose.Schema({
//     access_token: String,
//     refresh_token: String,
//     expires_in: Date
// });

const courseQuestionSchema = mongoose.Schema({
  courseId: {
    type: String,
    required: true,
    unique: true
  },
  questions: [{
    text: {
      type: String,
      required: true
    },
    options: {
      type: [String],
      enum: ['true', 'false'],
      required: true
    }
  }]
});

const userQuestionSchema = mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  questions: [{
    text: {
      type: String,
      required: true
    },
    options: {
      type: [String],
      enum: ['true', 'false'],
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true,
      enum: {
        values: ['true', 'false'],
        message: 'Selected answer must be "true" or "false"'
      }
    }
  }]
});


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  }
});
// const course = mongoose.model('courses', courseSchema);
// const token = mongoose.model('tokens', tokenSchema);
const course_question = mongoose.model('course_question', courseQuestionSchema);
const user_question = mongoose.model('user_question', userQuestionSchema);
const user = mongoose.model('user', userSchema);

module.exports = {course_question,user_question,user}