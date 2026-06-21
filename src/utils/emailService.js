// Dummy email notification service.
// This simulates sending emails by logging nicely formatted messages to the console.
// In a real production app, this would be replaced with nodemailer + a real SMTP provider
// (or a service like SendGrid/Resend), but for this project a console log is sufficient
// to demonstrate the notification flow.

function sendPurchaseEmail({ buyerEmail, buyerName, artistEmail, artistName, artworkTitle, amount }) {
  console.log('\n========== 📧 EMAIL NOTIFICATION (SIMULATED) ==========');
  console.log(`To: ${buyerEmail}`);
  console.log(`Subject: Your ArtHub purchase is confirmed! 🎉`);
  console.log('---------------------------------------------------------');
  console.log(`Hi ${buyerName || 'there'},`);
  console.log(`Thank you for your purchase! You now own "${artworkTitle}".`);
  console.log(`Amount paid: $${amount}`);
  console.log(`You can view your purchase in your ArtHub dashboard.`);
  console.log('===========================================================\n');

  if (artistEmail) {
    console.log('\n========== 📧 EMAIL NOTIFICATION (SIMULATED) ==========');
    console.log(`To: ${artistEmail}`);
    console.log(`Subject: Your artwork "${artworkTitle}" just sold! 💰`);
    console.log('---------------------------------------------------------');
    console.log(`Hi ${artistName || 'there'},`);
    console.log(`Great news — your artwork "${artworkTitle}" has been sold for $${amount}.`);
    console.log(`Check your Sales History in the ArtHub artist dashboard for details.`);
    console.log('===========================================================\n');
  }
}

function sendSubscriptionEmail({ userEmail, userName, tier, amount }) {
  console.log('\n========== 📧 EMAIL NOTIFICATION (SIMULATED) ==========');
  console.log(`To: ${userEmail}`);
  console.log(`Subject: Welcome to ArtHub ${tier?.charAt(0).toUpperCase()}${tier?.slice(1)}! ⭐`);
  console.log('---------------------------------------------------------');
  console.log(`Hi ${userName || 'there'},`);
  console.log(`Your subscription has been upgraded to the ${tier} plan.`);
  console.log(`Amount paid: $${amount}/month`);
  console.log(`Enjoy your new purchase limits on ArtHub!`);
  console.log('===========================================================\n');
}

module.exports = { sendPurchaseEmail, sendSubscriptionEmail };
