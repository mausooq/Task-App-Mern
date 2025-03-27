const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const PasswordResetToken = require('../models/PasswordResetToken')
const authMiddleware = require('../middleware/authMiddleware');
const { upload,deleteImage } = require('../config/cloudinary');
const sendMail = require('../config/sendEmail');

const router = express.Router();

router.post('/signup',
  [
    body('firstName').notEmpty().withMessage('First Name is required'),
    body('lastName').notEmpty().withMessage('Last Name is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, username, email } = req.body;

    try {
      let userExists = await User.findOne({$or: [{email},{username}]});

      if (userExists) {
        const message = userExists.email === email
         ? "Email already exists"
         : "Username is already taken! Please choose another."
        return res.status(409).json({ message }); 
      }

   
      const user = new User({ firstName, lastName, username, email });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

      const resetToken = new PasswordResetToken({
        userId: user._id,
        token:token,
        expiresAt: new Date(Date.now() +15 * 60 *1000),
      })

      await resetToken.save();

      const setupLink = `${process.env.FRONTEND_URL}/setup-password?token=${token}`

      sendMail(email,"Set Up Your Password",`Click here to setup your password : ${setupLink}`)
      .then(() => console.log("Email sent successfully!"))
           .catch((err) => console.error("Error:", err));

      return res.status(201).json({ message: "Signup successful. Please check your email to set your password." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.post('/set-password', async (req, res) => {

  if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing!" });
  }

  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token, password, and confirm password are required" });
  }

  if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const resetToken = await PasswordResetToken.findOne({ userId: decoded.id, token });

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (resetToken.expiresAt < new Date()) {
        await PasswordResetToken.deleteOne({ userId: decoded.id });
        return res.status(400).json({ message: "Token has expired. Please request a new password reset link." });
      }

      const user = await User.findById(decoded.id);
      user.password = password; 
      await user.save();

      await PasswordResetToken.deleteOne({ userId: decoded.id });

      return res.status(200).json({ message: "Password set successfully. You can now log in." });
  } catch (error) {
      console.error("Error:", error);
      return res.status(400).json({ message: "Invalid token" });
  }
});


router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message:"Email does not exist"});
            
        const isMatch = await user.matchPassword(password);
        if(!isMatch) return res.status(400).json({ message: "Invalid password"});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
        
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 3600000
        });
        
        res.json({ 
            message: 'Login successful',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({message: "Server error"});
    }
});

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

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
   
    const resetToken = new PasswordResetToken({
      userId: user._id,
      token: token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), 
    });
    await resetToken.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendMail(
      email,
      "Password Reset Request",
      `Click here to reset your password: ${resetLink}`
    );
    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const resetToken = await PasswordResetToken.findOne({ 
      userId: decoded.id,
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findById(decoded.id);
    user.password = newPassword;
    await user.save();

    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid token" });
  }
});

module.exports = router;
