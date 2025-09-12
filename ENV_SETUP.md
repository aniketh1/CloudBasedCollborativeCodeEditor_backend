# Environment Configuration Guide

## Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your actual configuration

## Email Service Setup

### Option 1: Gmail SMTP (Recommended for development)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
3. Update your `.env` file:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM="Your App Name <noreply@yourapp.com>"
   ```

### Option 2: SendGrid API

1. Create a SendGrid account
2. Generate an API key
3. Update your `.env` file:
   ```
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourapp.com
   ```

### Option 3: AWS SES

1. Configure AWS SES
2. Verify your domain/email
3. Update your `.env` file:
   ```
   EMAIL_SERVICE=ses
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_SES_FROM_EMAIL=noreply@yourapp.com
   ```

## Database Setup

### MongoDB Connection

For development, you can use:
- Local MongoDB: `mongodb://localhost:27017/collaborative-code-editor`
- MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/collaborative-code-editor`

Update your `.env` file:
```
MONGODB_URI=your-mongodb-connection-string
DATABASE_NAME=collaborative_code_editor
```

## Authentication (Clerk)

1. Create a Clerk account at https://clerk.dev
2. Create a new application
3. Get your keys from the dashboard
4. Update your `.env` file:
   ```
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## Frontend URL Configuration

Update the frontend URL to match your deployment:

For development:
```
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

For production:
```
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

## Security Notes

- Never commit your `.env` file to version control
- Use strong, unique passwords for all services
- Rotate secrets regularly in production
- Use environment-specific configurations for development/staging/production

## Testing Email Configuration

After setting up your email service, you can test it by:

1. Starting the server: `npm run dev`
2. Making a POST request to `/api/invites/send` with valid data
3. Checking the server logs for email sending confirmation

## Troubleshooting

### Email not sending:
- Check your email service credentials
- Verify firewall settings allow SMTP/API connections
- Check service-specific rate limits

### Database connection issues:
- Verify MongoDB is running (for local setup)
- Check connection string format
- Ensure database user has proper permissions

### CORS issues:
- Verify FRONTEND_URL matches your frontend domain exactly
- Check that both HTTP and HTTPS protocols match
- Ensure no trailing slashes in URLs