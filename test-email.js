#!/usr/bin/env node

// Email Configuration Test Script
// Run this script to test your email configuration: node test-email.js

require('dotenv').config();
const EmailService = require('./services/EmailService');

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'Not set (defaulting to gmail)');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set (using default)');
  console.log('');
  
  // Test email service initialization
  const emailService = new EmailService();
  
  // Test connection
  console.log('🔌 Testing email connection...');
  const connectionTest = await emailService.verifyConnection();
  
  if (connectionTest.success) {
    console.log('✅ Email connection successful!');
    console.log('💡 Your email service is properly configured.');
    
    // Offer to send a test email
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`\n📧 Sending test email to ${testEmail}...`);
      
      try {
        const testResult = await emailService.sendInvitation({
          recipientEmail: testEmail,
          recipientName: 'Test User',
          senderName: 'Email Configuration Test',
          roomId: 'test-room-123',
          joinLink: 'https://example.com/join/test'
        });
        
        if (testResult.success) {
          console.log('✅ Test email sent successfully!');
          console.log('💡 Check your inbox to confirm delivery.');
        } else {
          console.log('❌ Test email failed:', testResult.error);
        }
      } catch (error) {
        console.log('❌ Test email error:', error.message);
      }
    } else {
      console.log('\n💡 To send a test email, run:');
      console.log('   node test-email.js your-email@example.com');
    }
  } else {
    console.log('❌ Email connection failed:', connectionTest.error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your .env file has the correct EMAIL_USER and EMAIL_PASS');
    console.log('2. For Gmail, ensure you use an App Password (not your regular password)');
    console.log('3. Verify your email service allows SMTP connections');
    console.log('4. Check firewall settings');
    console.log('\n📚 See ENV_SETUP.md for detailed configuration instructions');
  }
}

// Run the test
testEmailConfiguration().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});