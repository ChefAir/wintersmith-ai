// api/webhooks/stripe.js

import Stripe from 'stripe'
import nodemailer from 'nodemailer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host:     process.env.SMTP_HOST,
  port:     Number(process.env.SMTP_PORT) || 587,
  secure:   process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object
      try {
        // Retrieve customer details
        const customer = await stripe.customers.retrieve(invoice.customer)

        // Send thank-you email
        await transporter.sendMail({
          from:    `"Wintersmith.AI" <${process.env.SMTP_USER}>`,
          to:      customer.email,
          subject: 'Payment Received – Thank You!',
          html: `
            <p>Hi ${customer.name || ''},</p>
            <p>We’ve received your payment of <strong>$${(invoice.amount_paid/100).toFixed(2)}</strong>.</p>
            <p>Thank you for choosing Wintersmith.AI—let’s build something amazing!</p>
          `
        })
        console.log('✅ Thank-you email sent to', customer.email)
      } catch (emailErr) {
        console.error('❌ Error sending thank-you email:', emailErr)
      }
      break
    }
    // ... handle other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 to acknowledge receipt of the event
  res.json({ received: true })
}
