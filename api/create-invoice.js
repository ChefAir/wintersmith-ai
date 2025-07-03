// api/create-invoice.js

import Stripe from 'stripe'
import nodemailer from 'nodemailer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

// ——— Configure Nodemailer transporter once ———
const transporter = nodemailer.createTransport({
  host:     process.env.SMTP_HOST,
  port:     Number(process.env.SMTP_PORT) || 587,
  secure:   false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// (Optional) Verify SMTP connection
transporter.verify()
  .then(() => console.log('✅ SMTP transporter ready'))
  .catch(err => console.error('❌ SMTP transporter error', err))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { name, email, items, due_date } = req.body
  // items: [{ description: string, unit_amount: number (cents), quantity: number }]

  try {
    // 1️⃣ Create or fetch customer
    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer = existing.data[0] ||
      await stripe.customers.create({ name, email })

    // 2️⃣ Create invoice items
    await Promise.all(items.map(item =>
      stripe.invoiceItems.create({
        customer:    customer.id,
        description: item.description,
        unit_amount: item.unit_amount,
        quantity:    item.quantity,
        currency:    'usd',
      })
    ))

    // 3️⃣ Create the invoice
    const invoice = await stripe.invoices.create({
      customer:         customer.id,
      collection_method:'send_invoice',
      days_until_due:   due_date
        ? Math.floor((new Date(due_date) - Date.now()) / (1000*60*60*24))
        : 30,
    })

    // 4️⃣ Finalize & get hosted URL
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
    const link      = finalized.hosted_invoice_url

    // 5️⃣ Email the link
    const html = `
      <p>Hi ${name},</p>
      <p>Your Wintersmith.AI invoice is ready. You can view and pay it securely here:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Thanks for your business!</p>
    `

    await transporter.sendMail({
      from:    `"Wintersmith.AI" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Your Wintersmith.AI Invoice',
      html,
    })

    return res.status(200).json({ success: true, url: link })
  } catch (err) {
    console.error('Invoice error:', err)
    return res.status(500).json({ error: 'Invoice generation failed' })
  }
}
