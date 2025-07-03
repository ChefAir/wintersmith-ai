import nodemailer from 'nodemailer'

// Vercel Serverless entrypoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const {
    name, email, phone,
    journey, referral,
    industry, position,
    services, comments, token
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

  // 2️⃣ Send email via Nodemailer
  //    (configure SMTP_ environment vars in Vercel)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // upgrade with STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  const mailHtml = `
    <h2>New Wintersmith.AI Inquiry</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Journey:</strong> ${journey}</p>
    <p><strong>Referral:</strong> ${referral}</p>
    <p><strong>Industry:</strong> ${industry}</p>
    <p><strong>Position:</strong> ${position}</p>
    <p><strong>Services:</strong> ${services.join(', ')}</p>
    <p><strong>Comments:</strong> ${comments || '—'}</p>
  `

  try {
    await transporter.sendMail({
      from: `"Wintersmith.AI" <${process.env.SMTP_USER}>`,
      to: 'pdf98-2023@yahoo.com',
      subject: '📩 New Contact Form Submission',
      html: mailHtml
    })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Mail error:', err)
    return res.status(500).json({ error: 'Email delivery failed' })
  }
}
