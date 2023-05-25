const {
  email_auto,
  email_password,
  node_env,
  nodemailer,
  userCollection,
  uuidv4,
} = require("../setup/config.js");

function createTransporter(email, password) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: email, // generated ethereal user
      pass: password, // generated ethereal password
    },
  });
}

function getResetUrl(env, resetToken) {
  let url = "";
  if (env === "development") {
    url = `http://localhost:4420/reset/${resetToken}`;
  } else if (env === "production") {
    url = `http://fwurnptkem.eu09.qoddiapp.com/reset/${resetToken}`;
  }
  return url;
}

function getEmailContent(user, url) {
  const textBody = `Dear ${user},

You have requested to reset your password. To proceed with the password reset process, please click on the following link:

Reset Password: ${url}

If you did not initiate this request, please ignore this email. Your current password will remain unchanged.

Thank you,
The Support Team`;

  const htmlBody = `<p>Dear ${user},</p>
<p>You have requested to reset your password. To proceed with the password reset process, please click on the following link:</p>
<p><a href="${url}">Reset Password</a></p>
<p>If you did not initiate this request, please ignore this email. Your current password will remain unchanged.</p>
<p>Thank you,<br>
The MovieMate Support Team</p>`;

  return { textBody, htmlBody };
}

async function sendEmail(email, resetToken, user) {
  const transporter = createTransporter(email_auto, email_password);
  const url = getResetUrl(node_env, resetToken);
  const { textBody, htmlBody } = getEmailContent(user, url);

  try {
    const info = await transporter.sendMail({
      from: `"MovieMate" <${email_auto}>`, // sender address
      to: email, // list of receivers
      subject: "Password Reset", // Subject line
      text: textBody, // plain text body
      html: htmlBody, // html body
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

async function resetPassword(req, res) {
  try {
    // 1. Get the user's email from the request body
    const { email } = req.body;

    // 2. Check if the email exists in the database
    const user = await userCollection.findOne({ email });
    console.log(email);
    if (!user) {
      // Render a different page when email doesn't exist
      return res.render("email-not-found", { login: "/login" });
    }

    // 3. Generate a unique password reset token (you can use a library like uuid or crypto)
    const resetToken = uuidv4();

    // Store the reset token securely in the user's document in the database
    await userCollection.findOneAndUpdate(
      { email: email }, // Replace with the user's email for whom the reset token is generated
      { $set: { resetToken: resetToken } }
    );
    // 4. Store the reset token securely in the user's document in the database and send the email
    sendEmail(email, resetToken, user && user.username); // Pass user.username only if user exists

    // 5. Handle successful email sending
    res.render("post-recover-password", { login: "/login" });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).send("An error occurred while sending the password reset email.");
  }
}


module.exports = { resetPassword };
