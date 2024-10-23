import cron from 'node-cron';
import knex from '../../config/knex.js';
import { getAllEmailsByRole } from './getEmails.js';
import { SendBulkEmails } from '../../config/emailService.js';

// Schedule a job to run every hour
cron.schedule('0 * * * *', async () => {
    console.log('Checking for scheduled campaigns to send...');
    await sendScheduledCampaigns();
});

async function sendScheduledCampaigns() {
    const now = new Date().toISOString();
    try {
        const campaigns = await knex('Campaign')
            .where('DontSendBeforeDateUtc', '<=', now)
            .andWhere('Sent', false);

        console.log(campaigns)

        for (const campaign of campaigns) {
            const emails = await getAllEmailsByRole(campaign.CustomerRoleId)
            console.log(emails);
            const testEmails = ['shahryar2k3@gmail.com', 'kshahryar21@gmail.com']
            await SendBulkEmails(testEmails, campaign.Subject, campaign.Body)
            console.log(`Campaign ${campaign.Id} emails sent successfully.`);

            await knex('Campaign')
                .where('Id', campaign.Id)
                .update({ Sent: true });
        }
    } catch (error) {
        console.error('Error sending scheduled campaigns:', error);
    }
}