import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
    user: process.env.USER_EMAIL!,
    pass: process.env.PASS!,
  },
});

export const sendMail=async(to:string,subject:string,html:string)=>{
    await transporter.sendMail({
        from:`  "Kirana" <${process.env.USER_EMAIL}>`,
        to,
        subject,
        html
    })
}