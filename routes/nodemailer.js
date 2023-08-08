const nodemailer = require("nodemailer");
const googleApis = require("googleapis");




const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `647733329350-qhloid360lkv7mfubeokosm2j2p7pjj9.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//042ZoZTgM60KwCgYIARAAGAQSNwF-L9IrvFQRn9U1Ww89nsgNnoMDT6_rb6r0RjiwAokfv7N-2NiI_gFSsDAXCKY2LFBxdcnZ718`;

const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
REDIRECT_URI);



authClient.setCredentials({refresh_token: REFRESH_TOKEN});
async function mailer(userid,email,otp){
 try{
 const ACCESS_TOKEN = await authClient.getAccessToken();
 const transport = nodemailer.createTransport({
 service: "gmail",
 auth: {
 type: "OAuth2",
 user: "ap2638186@gmail.com",
 clientId: CLIENT_ID,
 clientSecret: CLIENT_SECRET,
 refreshToken: REFRESH_TOKEN,
 accessToken: ACCESS_TOKEN
 }
 })
 const details = {
 from: "atul patel<ap2638186@gmail.com>",
 to: email,
 subject: "kuchh bhi likh do",
 text: "asdfghjkiuytrewqazxcvbnm..!!",
 html: `<a href="http://localhost:5000/forgot/${userid}/otp/${otp}">Reset password</a>`
}

const result = await transport.sendMail(details);
return result;
}
catch(err){
    return err;
}
}
// mailer().then(res => {
//     console.log("sent mail !", res);
// })

module.exports = mailer;


