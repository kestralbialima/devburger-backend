import nodemailer from 'nodemailer';
import 'dotenv/config'; // Importe isso para ler o arquivo .env

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAIL_USER, // 👈 Pega do "cofre"
    pass: process.env.MAIL_PASS   // 👈 Pega do "cofre"
  }
});

export default transporter;