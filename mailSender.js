const nodemailer = require("nodemailer");

async function sendEmail(receiver, content, subject) {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_SERVER,
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    await (async () => {
        const info = await transporter.sendMail({
            from: 'noreply@chanit.app',
            to: receiver,
            subject: subject,
            html: content,
        });

        console.log("Message sent:", info.messageId);
    })();
}

module.exports = { sendEmail };