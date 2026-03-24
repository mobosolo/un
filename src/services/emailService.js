import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  SMTP_FROM,
  RESET_PASSWORD_URL_BASE,
} = process.env;

const isEmailConfigured = () =>
  Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);

const createTransporter = () => {
  if (!isEmailConfigured()) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendResetPasswordEmail = async (to, token, expires) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured. Skipping reset password email.");
    return false;
  }

  const resetLink = RESET_PASSWORD_URL_BASE
    ? `${RESET_PASSWORD_URL_BASE}?token=${token}&email=${encodeURIComponent(to)}`
    : null;

  const subject = "MealFlavor - Reinitialisation du mot de passe";
  const textLines = [
    "Bonjour,",
    "",
    "Vous avez demande a reinitialiser votre mot de passe.",
    `Votre code: ${token}`,
    expires ? `Ce code expire le: ${new Date(expires).toLocaleString()}` : "",
    resetLink ? `Lien: ${resetLink}` : "",
    "",
    "Si vous n'etes pas a l'origine de cette demande, ignorez ce message.",
  ].filter(Boolean);

  const htmlLines = [
    "<div style=\"font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;\">",
    "<div style=\"max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #eee;\">",
    "<h2 style=\"margin:0 0 8px;color:#111;\">MealFlavor</h2>",
    "<p style=\"margin:0 0 16px;color:#555;\">Reinitialisation du mot de passe</p>",
    "<p style=\"margin:0 0 16px;\">Vous avez demande a reinitialiser votre mot de passe.</p>",
    `<p style=\"margin:0 0 12px;\"><strong>Code:</strong> ${token}</p>`,
    expires ? `<p style=\"margin:0 0 16px;color:#555;\">Ce code expire le: ${new Date(expires).toLocaleString()}</p>` : "",
    resetLink
      ? `<p style=\"margin:16px 0;\"><a href=\"${resetLink}\" style=\"display:inline-block;padding:12px 18px;background:#f15a24;color:#fff;border-radius:999px;text-decoration:none;\">Reinitialiser mon mot de passe</a></p>`
      : "",
    "<p style=\"margin:16px 0 0;color:#777;font-size:12px;\">Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>",
    "</div>",
    "</div>",
  ].filter(Boolean);

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text: textLines.join("\n"),
    html: htmlLines.join(""),
  });

  return true;
};
