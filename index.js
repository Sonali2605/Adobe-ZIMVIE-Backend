const express = require("express");
const cors = require("cors");
const { createCourse } = require("./types");
const { course, token } = require("./db");
const axios = require("axios")
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

const base_adobe_url= "https://learningmanager.adobe.com";
const clientId="eabb3668-a036-45c5-ba10-7a4160827517";
const clientSecret="5ec25713-5718-4d71-91bd-c18f703b3407";
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
 // Array to store results of API calls for each user
 const reports = [];
 const token = await getToken();
 // Iterate over each user's courses
 for (const user of coursesByUser) {
     const userId = user._id; // Assuming user_id is stored in _id field
     // Make API call to Adobe API for each user ID
     const userDataResponse = await axios.get(`${base_adobe_url}/primeapi/v2/users/${userId}/enrollments?include=learningObject&page[limit]=10&sort=dateEnrolled`,  {
        headers: {
            Authorization: `oauth ${token}`
        }
        });
    let almDuration = 0;
    if (userDataResponse && userDataResponse.data && userDataResponse.data.data) {
        // Filter learning objects with state "COMPLETED"
        const completedLearningObjects = userDataResponse.data.data.filter(item => item.attributes.state === "COMPLETED");
        // Iterate over completed learning objects
        completedLearningObjects.forEach(completedObject => {
            // Extract ID of completed learning object
            const completedObjectId = completedObject.id.split('_')[0];
            // Search for the completed object in included array
            const includedObject = userDataResponse.data.included.find(item => item.id === completedObjectId);
    
            // If included object with completedObjectId is found
            if (includedObject) {
                // Extract duration if available
                const durationHours = includedObject.attributes.duration / 3600;
                almDuration += durationHours;
            }
    })
    }
    user.almCourseDuration = almDuration;

     // Push the user data to reports array
     reports.push(user);
 }
 // Send the reports as response
 res.json(reports)
// res.json(coursesByUser)
});

async function getToken() {
    try {
        // Find any existing token
        let existingToken = await token.findOne();
        if (!existingToken) {
            // If no token exists, create a new token document in the database
            existingToken = await createToken();
        } else{
            // Check if the existing token is expired
            const check = await checkToken(existingToken.access_token);
            if (existingToken.expires_in < new Date() || check.error ) {
                // If expired, refresh the token
                const refreshedToken = await refreshAccessToken(existingToken.refresh_token);
                // Update the token document with the new access token and refresh token
                existingToken.access_token = refreshedToken.access_token;
                existingToken.refresh_token = refreshedToken.refresh_token;
                existingToken.expires_in = calculateExpiryTime(refreshedToken.expires_in);
                await existingToken.save();
            }
        }
        // Return the access token
        return existingToken.access_token;
    } catch (error) {
        console.error('Error fetching or refreshing token:');
         throw new Error('Failed to fetch or refresh token');
    }
}

async function checkToken(token) {
    try {
        const url =  `${base_adobe_url}/oauth/token/check?access_token=${token}`;
        const response = await axios.get(
            `${url}`
        );
        // Extract the refresh token from the response
        const tokenData = response.data;
        // Create a new token document in the database
        return tokenData;
    } catch (error) {
        console.error('Error creating token:', error.response.data);
        throw new Error('Failed to create token');
    }
}


async function createToken() {
    try {
        const client_id = clientId;
        const client_secret = clientSecret;
        const refresh_token = '371390c98a8c3a4a24922adf11fb6b08';

        const params = new URLSearchParams({
            client_id,
            client_secret,
            refresh_token
        });
        const url =  `${base_adobe_url}/oauth/token/refresh`;
        const response = await axios.post(
            `${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        // Extract the refresh token from the response
        const tokenData = response.data;
        // Create a new token document in the database
        if(tokenData){
             await token.create({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: calculateExpiryTime(tokenData.expires_in)
            });
        }
        return tokenData;
    } catch (error) {
        console.error('Error creating token:', error.response.data);
        throw new Error('Failed to create token');
    }
}


async function refreshAccessToken(refreshToken) {
    try {
        const params = new URLSearchParams({
            client_id : clientId,
            client_secret : clientSecret,
            refresh_token: refreshToken
        });

        const response = await axios.post(`${base_adobe_url}/oauth/token/refresh`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data;
    } catch (error) {
        console.error('Error refreshing token:', error.response.data);
        throw new Error('Failed to refresh token');
    }
}

// Function to calculate expiry time based on expiresIn value
function calculateExpiryTime(expiresIn) {
    const now = new Date();
    now.setSeconds(now.getSeconds() + expiresIn);
    return now;
}


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