const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { sendEmail } = require('../backend/utils/sendEmail');

async function test() {
    try {
        console.log('Testing email transport...');
        console.log('GMAIL_USER:', process.env.GMAIL_USER);
        // We don't need to actually send an email to test the transporter creation
        const oAuth2Client = require('../backend/utils/oauth');
        const { token } = await oAuth2Client.getAccessToken();
        console.log('Access Token acquired successfully!');
    } catch (error) {
        console.error('Email test failed:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Detailed Error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

test();
