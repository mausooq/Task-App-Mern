const jwt = require('jsonwebtoken');

const authMiddleware = (req,res,next) => {
    const token = req.cookies.token;
    
    if(!token) return res.status(401).json({ message: "Access Denied" })
    try {
        const verified = jwt.verify(token,process.env.JWT_SECRET)
        req.user = verified;
        // console.log(req.user)
        next();
    } catch (error) {
        return res.status(400).json({message : "invalid token"})
    }
}

module.exports = authMiddleware;