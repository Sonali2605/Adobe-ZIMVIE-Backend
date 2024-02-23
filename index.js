const express = require("express");
const cors = require("cors");
const { createCourse } = require("./types");
const { course } = require("./db");
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;


app.get('/userReport',async(req,res) =>{
    const {user_id} = req.query;
    const courses = await course.find({user_id: user_id});
    const user = {
        user_id: user_id,
        fullname: courses.length > 0 ? courses[0].fullname : "",
        email: courses.length > 0 ? courses[0].email : ""
    };
    const courseData = courses.map(course => ({
        before_you_begin: course.before_you_begin,
        ldtype: course.ldtype,
        specification: course.specification,
        title: course.title,
        date: course.date,
        totalhours: course.totalhours
    }));
    res.json({ user: user, courses: courseData });
})
app.get('/adminReport', async (req, res) => {
    const coursesByUser = await course.aggregate([
        {
            $group: {
                _id: '$user_id',
                fullname: { $first: '$fullname' }, // Common firstname for the user
                email: { $first: '$email' },   // Common lastname for the user
                courses: {
                    $push: {
                        before_you_begin: '$before_you_begin',
                        ldtype: '$ldtype',
                        specification: '$specification',
                        title: '$title',
                        date: '$date',
                        totalhours: '$totalhours'
                    }
                }
            }
        }
    ]);

    // Send the grouped courses as response
    res.json(coursesByUser);
});

app.post('/cpdData',async (req,res) =>{
    const createPayload = req.body;
    const parsePayload= createCourse.safeParse(createPayload);
    if(!parsePayload.success){
        res.status(411).json({
            msg:"You send wrong inputs"
        })
        return;
    }
    await course.create({
        user_id: createPayload.user_id,
        before_you_begin:createPayload.before_you_begin,
        fullname: createPayload.fullname,
        email: createPayload.email,
        ldtype:createPayload.ldtype,
        specification: createPayload.specification,
        title: createPayload.title,
        date: createPayload.date,
        totalhours: createPayload.totalhours
    })
    res.json({
        msg: "Course created"
    })
})

app.listen(port,()=>{
    console.log(`App is running on ${port}`)
})