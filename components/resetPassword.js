const {
  email_auto,
  email_password,
  node_env,
  nodemailer,
  userCollection,
  uuidv4,
} = require("../config");

async function sendEmail(email, resetToken, user) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: email_auto, // generated ethereal user
      pass: email_password, // generated ethereal password
    },
  });
  let url = "";
  console.log("resetToken ", resetToken);
  if (node_env === "development") {
    url = `http://localhost:4420/reset/${resetToken}`;
  } else if (node_env === "production") {
    url = `http://fwurnptkem.eu09.qoddiapp.com/reset/${resetToken}`;
  }
  // Plain text body
  const textBody = `Dear ${user},

You have requested to reset your password. To proceed with the password reset process, please click on the following link:

Reset Password: ${url}

If you did not initiate this request, please ignore this email. Your current password will remain unchanged.

Thank you,
The Support Team`;

  // HTML body
  const htmlBody = `<p>Dear ${user},</p>
<p>You have requested to reset your password. To proceed with the password reset process, please click on the following link:</p>
<p><a href="${url}">Reset Password</a></p>
<p>If you did not initiate this request, please ignore this email. Your current password will remain unchanged.</p>
<p>Thank you,<br>
The MovieMate Support Team</p>`;

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"MovieMate 👻" <${email_auto}>`, // sender address
    to: email, // list of receivers
    subject: "Password Reset", // Subject line
    text: textBody, // plain text body
    html: htmlBody, // html body
  });

  // console.log("Message sent: %s", info.messageId);
  // // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  console.log("Message sent: %s", info.messageId);
  console.log("resetToken ", resetToken);
  console.log("Preview URL: %s", url);
}

async function resetPassword(req, res) {
  try {
    // 1. Get the user's email from the request body
    const { email } = req.body;

    // 2. Check if the email exists in the database
    const user = await userCollection.findOne({ email });
    console.log(email);
    console.log(user.username);
    if (!user) {
      res.status(404).send("Email not found.");
      return;
    }

    // 3. Generate a unique password reset token (you can use a library like uuid or crypto)
    const resetToken = uuidv4();

    // Store the reset token securely in the user's document in the database
    await userCollection.findOneAndUpdate(
      { email: email }, // Replace with the user's email for whom the reset token is generated
      { $set: { resetToken: resetToken } }
    );
    // 4. Store the reset token securely in the user's document in the database and send the email
    sendEmail(email, resetToken, user.username);

    // 5. Handle successful email sending
    // res.status(200).send("Password reset link has been sent to your email.");
    res.render("post-recover-password", { login: "/login" });
  } catch (error) {
    // 6. Handle error
    console.error("Error sending password reset email:", error);
    res
      .status(500)
      .send("An error occurred while sending the password reset email.");
    res.render("post-recover-password");
  }
}

module.exports = { resetPassword };
