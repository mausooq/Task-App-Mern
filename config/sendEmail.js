const nodemailer = require('nodemailer');


const sendMail = async (to , subject , text) =>{
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, 
            },
        })

        await transporter.sendMail({
            from : `"Task Manager" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        },(error, info) => {
            if (error) {
                console.error("Error sending mail:", error);
            } else {
                console.log("Email sent:", info.response);
            }
        });
        
    } catch (error) {
        console.error("error sending mail" , error)
    }
}

module.exports = sendMail;