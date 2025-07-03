// api/create-invoice.js

import Stripe from 'stripe'
import nodemailer from 'nodemailer'

// Validate environment variables
const {
  STRIPE_SECRET_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS
} = process.env
if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) throw new Error('Missing SMTP configuration')

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' })

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host:     SMTP_HOST,
  port:     Number(SMTP_PORT),
  secure:   Number(SMTP_PORT) === 465,  // SSL for 465, STARTTLS for others
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  requireTLS: Number(SMTP_PORT) === 587,
})

// Verify SMTP on cold start
transporter.verify()
  .then(() => console.log('✅ SMTP transporter ready'))
  .catch(err => console.error('❌ SMTP transporter error', err))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { name, email, items, due_date } = req.body
  // Basic validation
  if (!name || !email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: name, email, items' })
  }

  try {
    // 1️⃣ Retrieve or create Stripe customer
    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer = existing.data[0] || await stripe.customers.create({ name, email })

    // 2️⃣ Create invoice items
    for (const item of items) {
      if (!item.description || typeof item.unit_amount !== 'number' || typeof item.quantity !== 'number') {
        throw new Error('Invalid item format')
      }
      await stripe.invoiceItems.create({
        customer:    customer.id,
        description: item.description,
        unit_amount: item.unit_amount,
        quantity:    item.quantity,
        currency:    'usd',
      })
    }

    // 3️⃣ Create the invoice
    const daysUntilDue = due_date
      ? Math.max(0, Math.floor((new Date(due_date) - Date.now()) / (1000 * 60 * 60 * 24)))
      : 30
    const invoice = await stripe.invoices.create({
      customer:          customer.id,
      collection_method: 'send_invoice',
      days_until_due:    daysUntilDue,
    })

    // 4️⃣ Finalize the invoice to get hosted link
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
    const link = finalized.hosted_invoice_url

    // 5️⃣ Email the invoice link
    const mailOptions = {
      from:    `"Wintersmith.AI" <${SMTP_USER}>`,
      to:      email,
      subject: 'Your Wintersmith.AI Invoice',
      html:    `
        <p>Hi ${name},</p>
        <p>Your Wintersmith.AI invoice is ready. You can view and pay it securely here:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Thanks for your business!</p>
      `,
    }
    await transporter.sendMail(mailOptions)

    // 6️⃣ Respond with link
    return res.status(200).json({ success: true, url: link })
  } catch (err) {
    console.error('Invoice generation error:', err)
    return res.status(500).json({ error: err.message || 'Invoice generation failed' })
  }
}
