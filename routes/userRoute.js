const express = require("express")
const router = express.Router()
const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const authMiddleware = require("../middleware/authMiddleware")
const dotenv = require('dotenv')
const Doctor = require("../models/doctorModel")
const Appointment = require("../models/appointmentModel")
const moment = require("moment")
dotenv.config()

router.post("/register", async (req, res) => {
    try {
        const userExist = await User.findOne({ email: req.body.email })
        if (userExist) {
            return res
                .status(400)
                .send({ message: "User already exists", success: false })
        }
        const password = req.body.password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        req.body.password = hashedPassword
        const newuser = new User(req.body)
        await newuser.save();
        res
            .status(200)
            .send({ message: "user created successfully", succes: true })
    } catch (error) {
        res
            .status(500)
            .send({ message: "error creating user", succes: false, error })
    }
})

router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            return res
                .status(200)
                .send({ message: "User doesn't exist", success: false })
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (!isMatch) {
            return res
                .status(401)
                .send({ message: "password is incorrect", success: false })
        } else {
            const token = jwt.sign({ id: user._id }, (process.env.JWT_SECRET), {
                expiresIn: "1d",
            })
            res
                .status(200)
                .send({ message: "login susccessful", success: true, data: token })
        }
    } catch (error) {
        console.log(error)
        res
            .status(500)
            .send({ message: "error logged in", success: false, error })
    }

})

router.post("/userInfo", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId })
        user.password = undefined
        if (!user) {
            return res
                .status(200)
                .send({ message: "User doesnt exist", success: false })
        } else {
            res.status(200).send({
                success: true,
                data: user,
            })
        }
    } catch (error) {
        return res.status(500)
            .send({ message: "error getting user info", success: false, error })
    }
})

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
    try {
        const newDoctor = new Doctor({ ...req.body, status: "pending" })
        // console.log(newDoctor)
        await newDoctor.save()
        const adminUser = await User.findOne({ isAdmin: true })

        const unseenNotifications = adminUser.unseenNotifications
        unseenNotifications.push({
            type: "new-doctor-request",
            message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account`,
            data: {
                doctorId: newDoctor._id,
                name: newDoctor.firstName + " " + newDoctor.lastName
            },
            onClickPath: "/admin/doctorslist"
        })
        await User.findByIdAndUpdate(adminUser._id, { unseenNotifications })
        res.status(200).send({
            success: true,
            message: "Doctor account applied successfully"
        })
    } catch (error) {
        res
            .status(500)
            .send({ message: "error applying doctor account", succes: false, error })
    }
})

router.post("/mark-all-notifications-as-seen", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId })
        const unseenNotifications = user.unseenNotifications;
        const seenNotifications = user.seenNotifications
        seenNotifications.push(...unseenNotifications)
        user.unseenNotifications = [];
        user.seenNotifications = seenNotifications;
        const updatedUser = await user.save()
        updatedUser.password = undefined;
        res.status(200).send({
            success: true,
            message: "All notifications marked as seen",
            data: updatedUser,
        })
    } catch (error) {
        res
            .status(500)
            .send({ message: "error applying doctor account", succes: false, error })
    }
})

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId })
        user.seenNotifications = []
        user.unseenNotifications = [];
        const updatedUser = await user.save()
        updatedUser.password = undefined
        res.status(200).send({
            success: true,
            message: "All notifications has been deleted",
            data: updatedUser,
        })
    } catch (error) {
        res
            .status(500)
            .send({ message: "error deleting datas", succes: false, error })
    }
})

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
    try {
        const doctors = await Doctor.find({ status: "approved" })
        res
            .status(200)
            .send({
                message: "Doctors fetched successfully",
                success: true,
                data: doctors
            })
    } catch (error) {
        console.log(error)
        res
            .status(500)
            .send({
                message: "Error applying doctor account",
                success: false,
                error
            })
    }
})

router.post("/book-appointment", authMiddleware, async (req, res) => {
    try {
        req.body.status = "pending"
         req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString()
         req.body.time = moment(req.body.time, "HH-mm").toISOString()
        const newAppointment = new Appointment(req.body)
        await newAppointment.save()
        const user = await User.findOne({ _id: req.body.doctorInfo.userId })
        user.unseenNotifications.push({
            type: "new-appointment-request",
            message: `A new appointment request has been made by ${req.body.userInfo.firstName}`,
            onClickPath: "/doctor/appointments"
        })
        await user.save()
        res.status(200).send({
            message: "Appointment booked succesfully",
            success: true
        })
    } catch (error) {
        console.log(error)
        res
            .status(500)
            .send({
                message: "Error booking appointment",
                success: false,
                error
            })
    }
})

router.post("/check-booking-availability", authMiddleware, async (req, res) => {
    try {
        const date = moment(req.body.date, "DD-MM-YYYY").toISOString()
        const fromTime = moment(req.body.time, "HH-mm")
        .subtract(1, "hours")
        .toISOString()
        const toTime = moment(req.body.time, "HH-mm")
        .add(1, "hours")
        .toISOString()
        const doctorId = req.body.doctorId
        const appointments = await Appointment.find({
            doctorId,
            date,
            time: { $gte: fromTime, $lte: toTime },
        })
        if (appointments.length > 0) {
            return res.status(200).send({
                message: "Appointment not available",
                success: false
            })
        } else {
            return res.status(200).send({
                message: "Appointments available",
                success: true
            })
        }
    } catch (error) {
        console.log(error)
        res
            .status(500)
            .send({
                message: "Error booking appointment",
                success: false,
                error
            })
    }
})

router.get("/get-appointment-by-user-id", authMiddleware, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.body.userId })
        res
            .status(200)
            .send({
                message: "appointment fetched successfully",
                success: true,
                data: appointments
            })
    } catch (error) {
        console.log(error)
        res
            .status(500)
            .send({
                message: "Error fetching appointment",
                success: false,
                error
            })
    }
})








module.exports = router
