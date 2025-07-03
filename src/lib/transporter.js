// src/lib/transporter.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,           // use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// (Optional) verify connection configuration early
transporter.verify()
  .then(() => console.log('✅ SMTP ready'))
  .catch(err => console.error('❌ SMTP error', err));

export default transporter;
