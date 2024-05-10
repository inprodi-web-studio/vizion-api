const twilio = require("twilio");
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
    async makeCall(ctx) {
        client.calls.create({
            url  : "http://demo.twilio.com/docs/voice.xml",
            to   : "523322625220",
            from : "523314328388"
        }).then(call => console.log(call.sid))
        .catch(error => console.error(error));
    },
};