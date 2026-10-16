import { SMTP_USER } from "~~/server/config/env.js"
import { emailRx, isNonEmptyString } from "~~/server/lib/utils.js"
import { getTransporter } from "~~/server/services/mailer.js"

export function validateSendEmailBody(body) {
  const errors = []
  if (!body || typeof body !== "object") {
    return ["Invalid JSON body"]
  }

  const { to, subject, html } = body
  if (!isNonEmptyString(to) || !emailRx.test(to.trim())) {
    errors.push("to must be a valid email")
  }
  if (!isNonEmptyString(subject)) {
    errors.push("subject is required")
  }
  if (!isNonEmptyString(html)) {
    errors.push("html is required")
  }

  return errors
}

export async function sendEmail({ to, subject, html, attachments = [] }) {
  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.filter(
        (attachment) =>
          attachment &&
          typeof attachment === "object" &&
          typeof attachment.filename === "string" &&
          attachment.filename.trim(),
      )
    : []

  await getTransporter().sendMail({
    from: `"Recruitment" <${SMTP_USER}>`,
    to: to.trim(),
    subject: subject.trim(),
    html: html.trim(),
    attachments: normalizedAttachments,
  })
}
