const express = require("express");
const cors = require("cors");
const { createCourse } = require("./types");
const {course_question,user_question, user } = require("./db");
const axios = require("axios")
const app = express();
const corsOptions = {
    origin: "http://54.152.80.48:3002",
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  
app.use(express.json(corsOptions));
app.use(cors());
const port = 3001;
const path = require("path");

const base_adobe_url= "https://learningmanager.adobe.com";
const clientId="eabb3668-a036-45c5-ba10-7a4160827517";
const clientSecret="5ec25713-5718-4d71-91bd-c18f703b3407";

const _dirname = path.dirname("");
const buildpath = path.join(_dirname,"../Adobe-CPD-Frontend/dist");
app.use(express.static(buildpath));


app.post('/createCourseQuestions', async (req, res) => {
    try {
        const { courseId, questions } = req.body;

        // Check if a course with the given courseId already exists
        const existingCourse = await course_question.findOne({ courseId });

        if (existingCourse) {
            existingCourse.questions = questions;
            await existingCourse.save();
            res.status(200).json({ message: 'Questions updated successfully', course: existingCourse });
        } else {
            // If course does not exist, create a new course with the provided questions
            const newCourse = new course_question({ courseId, questions });
            await newCourse.save();
            res.status(201).json({ message: 'New course created with questions', course: newCourse });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


  app.get('/getQuestionsByCourseId', async (req, res) => {
    try {
        const { courseId } = req.query;

        // Find the course with the given course ID
        const courses = await course_question.find({ courseId });
console.log("11111111111111111111111111", courseId, courses)
        // If no course is found, return 404
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Since courseId is unique, we can assume there's only one course found
        const course = courses[0];

        // Return the questions
        res.json({ questions: course.questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/storeUserQuestions', async (req, res) => {
    try {
        const { email, courseId,courseName, questions } = req.body;

        // Check if a user with the given email and courseId already exists
        let existingUser = await user_question.findOne({ email, courseId });

        if (existingUser) {
            // Update the questions of the existing user
            existingUser.questions = questions;
            existingUser = await existingUser.save();
            res.status(200).json({ message: 'Questions updated successfully', user: existingUser });
        } else {
            // Create a new user with the provided questions
            const newUser = new user_question({ email, courseId, courseName, questions });
            await newUser.save();
            res.status(201).json({ message: 'New user created with questions', user: newUser });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.get('/getUserQuestions', async (req, res) => {
    try {
        const { courseId, email } =  req.query;

        // Find user by course ID and email
        const userData = await user_question.findOne({ courseId, email });
        console.log("_____________",userData);
        if (userData) {
            res.status(200).json(userData);
        } else {
            res.status(201).json({ message: 'User data not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/createUser' ,  async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the user already exists
      const existingUser = await user.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create a new user
      const newUser = new user({ email, password });
      await newUser.save();
  
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

  app.get('/getCoursesWithQuestions', async (req, res) => {
    try {
      // Retrieve all documents from the database
      const allUserQuestions = await user_question.find();
  
      // Initialize an empty object to store the formatted data
      const coursesData = {};
  
      // Loop through each document to format the data
      allUserQuestions.forEach((userQuestion) => {
        const { courseId, courseName, email, questions } = userQuestion;
  
        // Check if the courseId already exists in the coursesData object
        if (!coursesData[courseId]) {
          // If courseId doesn't exist, create a new entry for it
          coursesData[courseId] = { courseName, users: [] };
        }
  
        // Add user's email and questions to the respective course
        coursesData[courseId].users.push({ email, questions });
      });
  
      // Send the formatted data as the response
      res.status(200).json(coursesData);
    } catch (error) {
      // Handle any errors and send an error response
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
app.listen(port,()=>{
    console.log(`App is running on ${port}`)
})