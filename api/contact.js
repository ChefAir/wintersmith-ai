// api/contact.js

import nodemailer from 'nodemailer'

// ——— Configure Nodemailer transporter once ———
const transporter = nodemailer.createTransport({
  host:     process.env.SMTP_HOST,
  port:     Number(process.env.SMTP_PORT) || 587,
  secure:   false, // use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// (Optional) Verify SMTP connection on cold start
transporter.verify()
  .then(() => console.log('✅ SMTP transporter ready'))
  .catch(err => console.error('❌ SMTP transporter error', err))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const {
    name,
    email,
    phone,
    journey,
    referral,
    industry,
    position,
    services,
    comments,
    token
  } = req.body

  // 1️⃣ Verify reCAPTCHA
  const secret = process.env.RECAPTCHA_SECRET_KEY
  const verifyRes = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    { method: 'POST' }
  )
  const { success } = await verifyRes.json()
  if (!success) {
    return res.status(400).json({ error: 'reCAPTCHA verification failed' })
  }

  // 2️⃣ Compose email
  const mailHtml = `
    <h2>New Wintersmith.AI Inquiry</h2>
    <ul>
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Phone:</strong> ${phone}</li>
      <li><strong>Journey:</strong> ${journey}</li>
      <li><strong>Referral:</strong> ${referral}</li>
      <li><strong>Industry:</strong> ${industry}</li>
      <li><strong>Position:</strong> ${position}</li>
      <li><strong>Services:</strong> ${services.join(', ')}</li>
      <li><strong>Comments:</strong> ${comments || '—'}</li>
    </ul>
  `

  // 3️⃣ Send email
  try {
    await transporter.sendMail({
      from:    `"Wintersmith.AI" <${process.env.SMTP_USER}>`,
      to:      'pdf98-2023@yahoo.com',
      subject: '📩 New Contact Form Submission',
      html:    mailHtml,
    })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Mail error:', err)
    return res.status(500).json({ error: 'Email delivery failed' })
  }
}
