const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const { upload,deleteImage } = require('../config/cloudinary');

const router = express.Router();

router.post('/signup',
  [
    body('firstName').notEmpty().withMessage('First Name is required'),
    body('lastName').notEmpty().withMessage('Last Name is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, username, email, password } = req.body;

    try {
      let userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

   
      const user = new User({ firstName, lastName, username, email, password });
      await user.save();

      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, { httpOnly: true, secure: true });

      return res.status(201).json({ message: 'User created successfully', token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.post('/login',async (req,res) => {
    const {email,password} = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message:"email does not exist discord"})
            
        const isMatch = await user.matchPassword(password);
        if(!isMatch) return res.status(400).json({ message : "invalid password"})


        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.cookie("token",token,{ httpOnly : true , secure : true })
        
        res.json({ message: 'Login successful', token })
    } catch (error) {
        return res.status(500).json({message:"server error"})
    }
    
})

router.post('/logout',(req,res) => {
  try{
    res.clearCookie("token");
    res.json({message:"logged out"})
  } catch (error){
    return res.status(500).json({message:"server error",error : error.message})
  }
    
})

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const tasks = await Task.find({ user: req.user.id });
        res.json({ user, tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/profile/update', authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { firstName, lastName, username, email } = req.body;

      if (email && email !== user.email) {
          const emailExists = await User.findOne({ email });
          if (emailExists) {
              return res.status(400).json({ message: "Email is already in use" });
          }
      }
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (username) user.username = username;
      if (email) user.email = email;

      await user.save();

      res.json({ message: "User details updated successfully", user });
  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
});

router.put('/profile/update-password', authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { oldPassword, newPassword } = req.body;

      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) return res.status(400).json({ message: "Incorrect old password" });


      if (newPassword.length < 8) {
          return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: "Password updated successfully" });
  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
});



router.put('/profile/image',authMiddleware,upload.single('profile'),async (req,res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.profile && !user.profile.includes('default.jpg')) {
          await deleteImage(user.profile);
      }
        user.profile = req.file.path; 
        await user.save();

        res.json({ message: "Profile picture updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error",error:error.message });
    }


})

module.exports = router;
