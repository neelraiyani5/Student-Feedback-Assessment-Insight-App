import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    family: 4,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
});


export const sendCredentials = async (email, name, userId, password) => {
    const mailOptions = {
        from: `"AcadOne" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Account Credentials - AcadOne",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">Welcome to AcadOne, ${name}!</h2>
                <p>Hello,</p>
                <p>An account has been created for you on the <b>AcadOne</b> platform. Here are your login credentials:</p>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 5px solid #3498db; margin: 25px 0;">
                    <p style="margin: 5px 0;"><strong>User ID:</strong> <span style="font-family: monospace; font-size: 1.1em;">${userId}</span></p>
                    <p style="margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em;">${password}</span></p>
                </div>
                <p>Please login to the app and change your password immediately after your first login.</p>
                <p style="margin-top: 30px;">Best regards,<br><strong>AcadOne Team</strong></p>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                <p style="font-size: 0.8em; color: #888; text-align: center;">This is an automated system email, please do not reply.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
        return { success: true };
    } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        return { success: false, error };
    }
};
