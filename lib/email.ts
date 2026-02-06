import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  const from = process.env.EMAIL_FROM ?? "Sellar <no-reply@sellar.local>";
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    // Dev stub: keep behavior visible without requiring an email provider.
    console.log("\n--- EMAIL (dev stub) ---\nTo:", to, "\nSubject:", subject, "\n\n" + text + "\n------------------------\n");
    return;
  }

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from,
    to,
    subject,
    text,
  });
}
