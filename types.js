const zod = require("zod");

const createCourse = zod.object({
    user_id: zod.number(),
    before_you_begin:zod.string(),
    fullname: zod.string(),
    email: zod.string().email(),
    ldtype:zod.string(),
    specification: zod.string(),
    title: zod.string(),
    date: zod.string().refine(value => {
        // Check if the value matches the 'YYYY-MM-DD' format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(value);
    }, { message: 'Invalid date format. Expected format: YYYY-MM-DD' }),
    totalhours: zod.string()
})

module.exports={
    createCourse: createCourse
}