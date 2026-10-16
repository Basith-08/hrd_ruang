import { SMTP_USER } from '~~/server/config/env.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { isAdminRole, isEmail } from '~~/server/lib/utils.js'
import { getTransporter } from '~~/server/services/mailer.js'

function buildApprovalEmailSubject(mainPosition) {
  const normalizedMainPosition = String(mainPosition ?? '').trim()
  return normalizedMainPosition
    ? `ERF Approval Notification (${normalizedMainPosition})`
    : 'ERF Approval Notification'
}

function buildApprovalEmailHtml({ approverName, chainId, appOrigin }) {
  const redirectPath = `/approval-tracking?chain=${encodeURIComponent(chainId)}`
  const loginLink = `${String(appOrigin ?? '').replace(/\/$/, '')}/login?redirect=${encodeURIComponent(redirectPath)}`

  return `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Approval Request Notification</h2>
      <p>Dear ${approverName},</p>
      <p>
        An Employee Request Form (ERF) has been submitted and is awaiting your review.
        Please sign in to the HRD Ruang using your approver email address to review the request details and provide your approval.
      </p>
      <p>
        For security and audit purposes, approval can only be completed after a successful login.
      </p>
      <a href="${loginLink}" style="display:inline-block; padding:10px 20px; background-color:#2563eb; color:white; text-decoration:none; border-radius:5px;">Sign In to Review Approval</a>
      <p style="margin-top:20px; font-size: 12px; color: #666;">If the button above does not work, please use this link:<br/>${loginLink}</p>
    </div>
  `
}

export async function sendApprovalStepEmail(context, chainId, stepOrder, appOrigin) {
  const normalizedChainId = String(chainId ?? '').trim()
  const normalizedStepOrder = Number(stepOrder)
  const normalizedAppOrigin = String(appOrigin ?? '')
    .trim()
    .replace(/\/$/, '')

  if (!normalizedChainId) {
    throw createHttpError(400, 'chain_id is required.')
  }

  if (!Number.isInteger(normalizedStepOrder) || normalizedStepOrder < 1) {
    throw createHttpError(400, 'step_order must be a positive integer.')
  }

  if (!normalizedAppOrigin) {
    throw createHttpError(400, 'app_origin is required.')
  }

  const { data: chain, error: chainError } = await context.supabase
    .from('approval_chains')
    .select(
      `
      id,
      created_by,
      employee_request_form:employee_request_form(
        main_position
      )
    `,
    )
    .eq('id', normalizedChainId)
    .maybeSingle()

  if (chainError) {
    throw new Error(chainError.message)
  }

  if (!chain) {
    throw createHttpError(404, 'Approval chain not found.')
  }

  const { data: targetStep, error: targetStepError } = await context.supabase
    .from('approval_steps')
    .select('id, approver_email, approver_name, step_order, status')
    .eq('chain_id', normalizedChainId)
    .eq('step_order', normalizedStepOrder)
    .maybeSingle()

  if (targetStepError) {
    throw new Error(targetStepError.message)
  }

  if (!targetStep) {
    throw createHttpError(404, 'Approval step not found.')
  }

  if (targetStep.status !== 'pending') {
    throw createHttpError(400, 'Only pending approval steps can be notified.')
  }

  if (normalizedStepOrder === 1) {
    if (chain.created_by !== context.userId && !isAdminRole(context.roleName)) {
      throw createHttpError(403, 'Only the ERF submitter can notify the first approver.')
    }
  } else {
    const { data: previousStep, error: previousStepError } = await context.supabase
      .from('approval_steps')
      .select('approver_email, status')
      .eq('chain_id', normalizedChainId)
      .eq('step_order', normalizedStepOrder - 1)
      .maybeSingle()

    if (previousStepError) {
      throw new Error(previousStepError.message)
    }

    if (!previousStep) {
      throw createHttpError(400, 'Previous approval step could not be resolved.')
    }

    const currentUserEmail = String(context.authUser.email ?? '')
      .trim()
      .toLowerCase()
    const previousApproverEmail = String(previousStep.approver_email ?? '')
      .trim()
      .toLowerCase()

    if (previousApproverEmail !== currentUserEmail && !isAdminRole(context.roleName)) {
      throw createHttpError(403, 'Only the active approver can trigger the next notification.')
    }
  }

  if (!isEmail(targetStep.approver_email)) {
    throw createHttpError(400, 'Approval email is missing for the current approver.')
  }

  await getTransporter().sendMail({
    from: `"Recruitment" <${SMTP_USER}>`,
    to: targetStep.approver_email.trim(),
    subject: buildApprovalEmailSubject(chain.employee_request_form?.main_position),
    html: buildApprovalEmailHtml({
      approverName: String(targetStep.approver_name ?? '').trim() || 'Approver',
      chainId: normalizedChainId,
      appOrigin: normalizedAppOrigin,
    }),
  })
}
