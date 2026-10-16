import nodemailer from "nodemailer"

import { SMTP_PASS, SMTP_USER } from "~~/server/config/env.js"

let transporter = null

export function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set")
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }

  return transporter
}
