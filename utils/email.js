const htmlToText = require('html-to-text');
const nodemailer = require('nodemailer');
const pug = require('pug');

// new Email(user,url).sendWelcome()

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Dev Patel <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid', // no need to set host or port etc.
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //send Actual email
  async send(template, subject) {
    //1)Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2)Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    //3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

// const sendEmail = async (options) => {
//   //transporter is someone wo actually sends email node itself dont send email for example gmail who sends email...
//   //1) Create a Transporter
//   const transporter = nodemailer.createTransport({
//     // service: 'Gmail',
//     // auth: {
//     //   user: process.env.EMAIL_USERNAME,
//     //   password: process.env.EMAIL_PASSWORD,
//     // },
//     // //Active in gmail 'less secure app' option
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   //2)Define the email options

//   const mailOptions = {
//     from: 'Dev Patel',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html :
//   };

//   //3)send email with node mailer
//   await transporter.sendMail(mailOptions);
// };

// // module.exports = sendEmail;
