const express = require("express")
const router=express.Router()

const {login,getAllActive,getAllHistory,listUsers}= require("../controllers/adminController")

router.post('/login',login)
router.get('/allactive/emergency',getAllActive)
router.get("/emergencies",getAllHistory)
router.get("/users",listUsers)

 
module.exports=router