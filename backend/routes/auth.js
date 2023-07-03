const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'doingdev@hard$sucks#funendresult';
//creating a user using : Post "/api/auth/createuser". Doesnt req. auth no login requires

router.post('/createuser',[
    body('name','Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
],async(req, res)=>{
    //if err return err 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //check if user with this email exist already
    try {
    let user = await User.findOne({email: req.body.email});
    if(user){
        return res.status(400).json({error: "Sorry a user with this email already exists"})
    }

    const salt = await bcrypt.genSalt(10);
    secPass = await bcrypt.hash(req.body.password, salt);

     user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      })
      const data = {
        user : {
            id : user.id
        }
      }
      const authtoken=jwt.sign(data,JWT_SECRET);
      
      res.json({authtoken})
    } catch (error){
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
   
})

//Route 2: authenticate a user using : Post "/api/auth/login".  no login requires
router.post('/login',[
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
],async(req, res)=>{
     //if err return err 
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     const {email, password} = req.body;
     try{
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error: "Please try to login with correct credentials"})
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            return res.status(400).json({error: "Please try to login with correct credentials"})
        }

        const data = {
            user : {
                id : user.id
            }
          }
          const authtoken=jwt.sign(data,JWT_SECRET);
          
          res.json({authtoken})
     } catch (error){
        console.error(error.message);
        res.status(500).send("Internal Server Error");
     }
})

//Route 2: get loggedin user detail using : Post "/api/auth/getuser".  login required
router.post('/getuser',fetchuser,async(req, res)=>{

    try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router;  