const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      // Gmail SMTP configuration
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'aniketkorwa@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      this.isConfigured = true;
      console.log('📧 Email service configured successfully');
    } catch (error) {
      console.error('❌ Email service configuration failed:', error.message);
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection verified' };
    } catch (error) {
      console.error('Email verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  generateInviteEmailTemplate(senderName, roomId, joinLink, recipientName = null) {
    const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're invited to collaborate on ColabDev!</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #2FA1FF 0%, #1E90FF 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .join-button { 
              background: #2FA1FF; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block; 
              font-weight: bold; 
              margin: 20px 0; 
              font-size: 16px;
            }
            .session-code { 
              background: #e9ecef; 
              padding: 10px 15px; 
              border-radius: 5px; 
              font-family: monospace; 
              font-size: 14px; 
              border-left: 4px solid #2FA1FF; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 12px; 
              color: #666; 
            }
            .logo { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🚀 ColabDev</div>
            <h1>You're invited to collaborate!</h1>
          </div>
          
          <div class="content">
            <p>${greeting}</p>
            
            <p><strong>${senderName}</strong> has invited you to join their collaborative coding room on ColabDev!</p>
            
            <p>ColabDev is a powerful platform for real-time collaborative coding where you can:</p>
            <ul>
              <li>✨ Code together in real-time</li>
              <li>🎯 Share and edit files instantly</li>
              <li>💬 Communicate through integrated chat</li>
              <li>🖥️ Run code in shared terminal</li>
            </ul>
            
            <p>Click the button below to join the coding session:</p>
            
            <div style="text-align: center;">
              <a href="${joinLink}" class="join-button">🚀 Join Coding Room</a>
            </div>
            
            <p>Or manually enter this session code when you visit <a href="https://cloud-based-collborative-code-editor.vercel.app">ColabDev</a>:</p>
            
            <div class="session-code">
              <strong>Session Code:</strong> ${roomId}
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Click the join button or visit the link</li>
              <li>Sign up or sign in to your ColabDev account</li>
              <li>Start collaborating immediately!</li>
            </ol>
            
            <p>Happy coding! 🎉</p>
            
            <p>
              Best regards,<br>
              The ColabDev Team
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${senderName} through ColabDev.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>© 2025 ColabDev - Collaborative Code Editor</p>
          </div>
        </body>
      </html>
    `;
  }

  async sendInviteEmail({ recipientEmail, recipientName, senderName, roomId, joinLink }) {
    if (!this.isConfigured || !this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const htmlContent = this.generateInviteEmailTemplate(senderName, roomId, joinLink, recipientName);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"ColabDev" <noreply@colabdev.com>',
        to: recipientEmail,
        subject: `🚀 ${senderName} invited you to collaborate on ColabDev!`,
        html: htmlContent,
        text: `Hi ${recipientName || 'there'},

${senderName} has invited you to join their collaborative coding room on ColabDev!

Join the session by visiting: ${joinLink}

Or use session code: ${roomId}

Visit https://cloud-based-collborative-code-editor.vercel.app to get started.

Happy coding!
The ColabDev Team`
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Invitation email sent successfully'
      };

    } catch (error) {
      console.error('Error sending invite email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWelcomeEmail({ recipientEmail, recipientName }) {
    if (!this.isConfigured || !this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to ColabDev!</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2FA1FF 0%, #1E90FF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { padding: 30px; }
              .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2FA1FF; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚀 Welcome to ColabDev!</h1>
              <p>Your collaborative coding journey starts here</p>
            </div>
            
            <div class="content">
              <p>Hi ${recipientName || 'there'},</p>
              
              <p>Welcome to ColabDev! We're excited to have you join our community of collaborative developers.</p>
              
              <div class="feature">
                <h3>🎯 Real-time Collaboration</h3>
                <p>Code together with your team in real-time, see changes instantly.</p>
              </div>
              
              <div class="feature">
                <h3>💬 Integrated Communication</h3>
                <p>Chat with your teammates without leaving the editor.</p>
              </div>
              
              <div class="feature">
                <h3>🖥️ Shared Terminal</h3>
                <p>Run commands and see output together in a shared terminal.</p>
              </div>
              
              <p>Get started by creating your first project or joining a coding session!</p>
              
              <p>Happy coding!</p>
              <p>The ColabDev Team</p>
            </div>
          </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"ColabDev" <noreply@colabdev.com>',
        to: recipientEmail,
        subject: '🚀 Welcome to ColabDev - Start Collaborating!',
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Welcome email sent successfully'
      };

    } catch (error) {
      console.error('Error sending welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testEmailConfiguration() {
    if (!this.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      // Send a test email
      const testResult = await this.sendInviteEmail({
        recipientEmail: process.env.EMAIL_USER || 'test@example.com',
        recipientName: 'Test User',
        senderName: 'ColabDev System',
        roomId: 'test-room-123',
        joinLink: 'https://cloud-based-collborative-code-editor.vercel.app/editor/test-room-123'
      });

      return testResult;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
