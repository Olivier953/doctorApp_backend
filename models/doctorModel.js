const mongoose = require("mongoose")

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const doctorSchema = new Schema(
    {
        userId : {
            type: String,
            required: false
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        adress: {
            type: String,
            required: false
        },
        specialization: {
            type: String,
            required: true
        },
        experience : {
            type: String,
            required: true
        },
        feePerConsultation: {
            type: Number,
            required: true
        },
        startTimings : {
            type: Array,
            required: true,
        },
        endTimings : {
            type: Array,
            required: true,
        },
        status: {
            type: String,
            default: "pending"
        }
    },
    {
        timestamps : true
    }
)

module.exports =
    mongoose.models.doctors || mongoose.model('doctors', doctorSchema)
