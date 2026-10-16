import { APP_BASE_URL, SMTP_USER } from '~~/server/config/env.js'
import { isEmail, isNonEmptyString } from '~~/server/lib/utils.js'
import { getTransporter } from '~~/server/services/mailer.js'

const DUMMY_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'mailinator.com',
  'tempmail.com',
  'yopmail.com',
  'fakeinbox.com',
  'guerrillamail.com',
  'invalid.local',
  'localhost',
])

const DUMMY_EMAIL_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'dummy',
  'example',
  'sample',
  'fake',
  'noreply',
  'no-reply',
])

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeCandidatePortalBaseUrl() {
  const fromPublicEnv = process.env.NUXT_PUBLIC_HRD_PINTU_URL
  const normalizedPublicUrl = String(fromPublicEnv ?? '')
    .trim()
    .replace(/\/$/, '')
  if (/^https?:\/\//i.test(normalizedPublicUrl)) {
    return normalizedPublicUrl
  }

  const normalizedAppBase = String(APP_BASE_URL ?? '')
    .trim()
    .replace(/\/$/, '')
  return /^https?:\/\//i.test(normalizedAppBase) ? normalizedAppBase : ''
}

function buildCandidateLoginLink() {
  const baseUrl = normalizeCandidatePortalBaseUrl()
  return baseUrl ? `${baseUrl}/login` : ''
}

function isDummyEmail(email) {
  const normalizedEmail = String(email ?? '')
    .trim()
    .toLowerCase()
  if (!normalizedEmail.includes('@')) {
    return true
  }

  const [localPart, domain] = normalizedEmail.split('@')
  if (!localPart || !domain) {
    return true
  }

  if (DUMMY_EMAIL_DOMAINS.has(domain)) {
    return true
  }

  if (domain.startsWith('example.') || domain.startsWith('test.') || domain.endsWith('.invalid')) {
    return true
  }

  const normalizedLocalPart = localPart.replace(/\+.*/, '')
  if (DUMMY_EMAIL_LOCAL_PARTS.has(normalizedLocalPart)) {
    return true
  }

  return false
}

function shouldSendCredentialEmail(email) {
  return isEmail(email) && !isDummyEmail(email)
}

function buildCandidateCredentialEmailHtml({ candidateName, email, password, loginLink }) {
  const safeName = escapeHtml(candidateName || 'Candidate')
  const safeEmail = escapeHtml(email)
  const safePassword = escapeHtml(password)
  const safeLoginLink = escapeHtml(loginLink)
  const hasLoginLink = Boolean(safeLoginLink)

  return `
    <div style="margin:0; padding:32px 18px; background:#f4efe4; background-image:radial-gradient(circle at top left, rgba(214,181,140,0.32), transparent 30%), radial-gradient(circle at top right, rgba(186,90,49,0.12), transparent 24%), radial-gradient(circle at bottom right, rgba(186,90,49,0.16), transparent 28%); font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif; color:#1f2a30; line-height:1.65;">
      <div style="max-width:680px; margin:0 auto; border:1px solid rgba(47,62,70,0.12); border-radius:24px; overflow:hidden; background:rgba(255,255,255,0.94); box-shadow:0 24px 64px rgba(31,42,48,0.12);">
        <div style="padding:20px 28px; background:linear-gradient(135deg, #ba5a31 0%, #8f4424 100%); color:#fff8f4;">
          <p style="margin:0; font-size:12px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase;">HRD Pintu</p>
        </div>
        <div style="padding:30px 28px 28px;">
          <p style="margin:0 0 12px; font-size:16px; font-weight:600; color:#1f2a30;">Dear ${safeName},</p>
          <p style="margin:0 0 18px; font-size:14px; color:#5b6b73;">
            We would like to provide you with the login credentials for your candidate account.
            Please use the following information to access the HRD Pintu.
          </p>
          <p style="margin:0 0 18px; font-size:14px; color:#5b6b73;">
            You are receiving this email because a candidate account has been created for you as part of the recruitment process.
            This account will be used to complete the required candidate information and supporting documents.
          </p>
          <div style="border:1px solid rgba(47,62,70,0.12); background:#fffaf6; border-radius:18px; padding:18px 18px 16px;">
            <div style="margin:0 0 12px;">
              <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#8f4424;">Email</p>
              <p style="margin:0; font-size:15px; color:#1f2a30; word-break:break-word;">${safeEmail}</p>
            </div>
            <div style="margin:0;">
              <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#8f4424;">Password</p>
              <p style="margin:0; font-size:15px; font-weight:600; color:#1f2a30; word-break:break-word;">${safePassword}</p>
            </div>
          </div>
          ${
            hasLoginLink
              ? `<div style="margin:22px 0 0;">
            <a href="${safeLoginLink}" style="display:inline-block; border-radius:14px; background:#ba5a31; color:#fff8f4; text-decoration:none; padding:12px 18px; font-size:14px; font-weight:700; box-shadow:0 12px 24px rgba(186,90,49,0.22);">
              Access HRD Pintu
            </a>
          </div>
          <div style="margin:18px 0 0; border-top:1px solid rgba(47,62,70,0.12); padding-top:16px;">
            <p style="margin:0 0 6px; font-size:12px; color:#5b6b73;">If the button above does not work, please use the following link:</p>
            <p style="margin:0; font-size:13px; word-break:break-all;">
              <a href="${safeLoginLink}" style="color:#8f4424; text-decoration:underline;">${safeLoginLink}</a>
            </p>
          </div>`
              : `<div style="margin:22px 0 0; border:1px solid rgba(186,90,49,0.18); background:rgba(186,90,49,0.12); border-radius:16px; padding:12px 14px; font-size:13px; color:#8f4424;">
            The login link is not available in the current environment. Please contact the administrator to obtain the HRD Pintu URL.
          </div>`
          }
        </div>
      </div>
    </div>
  `
}

function buildCandidateCredentialSubject(mainPosition) {
  const normalizedMainPosition = String(mainPosition ?? '').trim()
  return normalizedMainPosition
    ? `[HRD Pintu] Login Credentials - ${normalizedMainPosition}`
    : '[HRD Pintu] Candidate Account Login Credentials'
}

export async function sendCandidateCredentialEmailIfEligible({
  email,
  password,
  candidateName,
  mainPosition,
}) {
  const normalizedEmail = String(email ?? '').trim()
  const normalizedPassword = String(password ?? '').trim()

  if (!shouldSendCredentialEmail(normalizedEmail) || !isNonEmptyString(normalizedPassword)) {
    return { sent: false }
  }

  try {
    await getTransporter().sendMail({
      from: `"Recruitment" <${SMTP_USER}>`,
      to: normalizedEmail,
      subject: buildCandidateCredentialSubject(mainPosition),
      html: buildCandidateCredentialEmailHtml({
        candidateName,
        email: normalizedEmail,
        password: normalizedPassword,
        loginLink: buildCandidateLoginLink(),
      }),
    })
    return { sent: true }
  } catch (error) {
    console.warn('Failed to send candidate credential email:', error)
    return { sent: false }
  }
}
