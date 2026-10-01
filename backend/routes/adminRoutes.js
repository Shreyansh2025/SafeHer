const express = require("express")
const router=express.Router()
const adminMiddleware = require("../middleware/adminMiddleware")

const {login,getAllActive,getAllHistory,listUsers}= require("../controllers/adminController")

// Login doesn't require authentication
router.post('/login',login)

// All other routes require admin authentication
router.get('/allactive/emergency', adminMiddleware, getAllActive)
router.get("/emergencies", adminMiddleware, getAllHistory)
router.get("/users", adminMiddleware, listUsers)


module.exports=router