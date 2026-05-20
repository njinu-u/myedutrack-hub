// Shared helpers for opening the admin's Gmail compose window pre-filled
// with the right invitation email body — server never sends mail.

import { toast } from "sonner";

export type InviteRole = "teacher" | "counselor" | "parent" | "student";

export interface InviteEmailInput {
  role: InviteRole;
  recipient_name: string;
  recipient_email: string;
  school_name: string;
  admin_name: string;
  invite_url: string;
  student_name?: string | null;
}

export function buildInviteEmail(input: InviteEmailInput): { subject: string; body: string } {
  const { role, recipient_name, school_name, admin_name, invite_url, student_name } = input;
  const sig = `${admin_name}\n${school_name}`;

  if (role === "teacher") {
    return {
      subject: `You have been invited to join ${school_name} on EduTrack`,
      body:
`Hello ${recipient_name},

I would like to invite you to join ${school_name} on EduTrack — our school management portal.

EduTrack gives you your own teacher portal where you can:
- Enter and manage student grades
- Mark attendance
- Write student observations
- Message parents directly
- Get AI-powered insights on your students

Click the link below to set up your account:
${invite_url}

This link expires in 7 days.

If you have any questions please reply to this email.

${sig}`,
    };
  }
  if (role === "counselor") {
    return {
      subject: `You have been invited to join ${school_name} on EduTrack`,
      body:
`Hello ${recipient_name},

I would like to invite you to join ${school_name} on EduTrack as our school counselor.

Your counselor portal gives you:
- Student wellbeing and mood tracking
- Intervention management tools
- Real-time alerts when students need support
- Confidential case notes

Click the link below to set up your account:
${invite_url}

This link expires in 7 days.

${sig}`,
    };
  }
  if (role === "parent") {
    const sn = student_name ?? "your child";
    return {
      subject: `Track ${sn}'s progress on EduTrack — ${school_name}`,
      body:
`Hello,

${school_name} has set up an EduTrack parent account so you can stay connected with ${sn}'s school life.

Your parent portal shows you:
- Grades and progress in real time
- Attendance records
- Teacher observations and notes
- Upcoming appointments
- Messages from teachers

Click the link below to set up your account:
${invite_url}

This link expires in 7 days.

${sig}`,
    };
  }
  // student
  return {
    subject: `Your EduTrack student account is ready — ${school_name}`,
    body:
`Hello ${recipient_name},

Your school ${school_name} has set up your EduTrack student account.

Your student portal gives you:
- Your grades and progress
- Attendance record
- Daily mood check-in
- Personal goals tracker
- Messages from your teachers

Click the link below to set up your account:
${invite_url}

This link expires in 7 days.

${sig}`,
  };
}

export function openGmailCompose(args: { to: string; subject: string; body: string }) {
  const url =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(args.to)}` +
    `&su=${encodeURIComponent(args.subject)}` +
    `&body=${encodeURIComponent(args.body)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function copyInviteLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied — you can now paste it in WhatsApp or any message");
  } catch {
    toast.error("Could not copy link");
  }
}

export const PUBLIC_APP_URL = "https://myedutrack-hub.lovable.app";

export function buildInviteUrl(token: string, originOverride?: string) {
  const origin =
    originOverride ??
    (typeof window !== "undefined" && window.location.hostname.endsWith("lovable.app")
      ? PUBLIC_APP_URL
      : (typeof window !== "undefined" ? window.location.origin : PUBLIC_APP_URL));
  return `${origin}/accept-invite?token=${token}`;
}
