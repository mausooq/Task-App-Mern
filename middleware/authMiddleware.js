const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ 
                message: "Authentication required. Please log in." 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.clearCookie('token');
            return res.status(401).json({ 
                message: "Invalid or expired token. Please log in again." 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: "Authentication error" 
        });
    }
};

module.exports = authMiddleware;