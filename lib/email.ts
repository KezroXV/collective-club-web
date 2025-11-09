/**
 * 📧 Email Utilities
 * Fonctions pour envoyer des emails (RGPD, notifications, etc.)
 */

import { UserDataExport } from './gdpr';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Configuration email depuis les variables d'environnement
 */
interface EmailConfig {
  provider: 'console' | 'resend' | 'sendgrid' | 'webhook';
  apiKey?: string;
  from: string;
  webhookUrl?: string;
}

/**
 * Récupère la configuration email depuis les variables d'environnement
 */
function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'console') as EmailConfig['provider'];

  return {
    provider,
    apiKey: process.env.EMAIL_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@collectiveclub.com',
    webhookUrl: process.env.EMAIL_WEBHOOK_URL,
  };
}

/**
 * Envoie un email avec les données RGPD
 * @param toEmail - Email du destinataire
 * @param userData - Données utilisateur exportées
 * @param textReport - Rapport texte lisible
 * @param jsonReport - Rapport JSON complet
 */
export async function sendGDPRDataEmail(
  toEmail: string,
  userData: UserDataExport,
  textReport: string,
  jsonReport: string
): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();

  try {
    switch (config.provider) {
      case 'console':
        return sendViaConsole(toEmail, textReport, jsonReport);

      case 'resend':
        return sendViaResend(config, toEmail, userData, textReport, jsonReport);

      case 'sendgrid':
        return sendViaSendGrid(config, toEmail, userData, textReport, jsonReport);

      case 'webhook':
        return sendViaWebhook(config, toEmail, userData, textReport, jsonReport);

      default:
        console.error(`Unknown email provider: ${config.provider}`);
        return { success: false, error: 'Unknown email provider' };
    }
  } catch (error) {
    console.error('Error sending GDPR email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Provider: Console (pour développement)
 * Log l'email dans la console au lieu de l'envoyer
 */
async function sendViaConsole(
  toEmail: string,
  textReport: string,
  jsonReport: string
): Promise<{ success: boolean }> {
  console.log('\n========================================');
  console.log('📧 GDPR EMAIL (DEV MODE - CONSOLE)');
  console.log('========================================');
  console.log(`To: ${toEmail}`);
  console.log(`Subject: Vos données personnelles - Export RGPD`);
  console.log('\n--- TEXT REPORT ---');
  console.log(textReport);
  console.log('\n--- JSON SIZE ---');
  console.log(`${Buffer.byteLength(jsonReport, 'utf8')} bytes`);
  console.log('========================================\n');

  // Sauvegarder le JSON dans un fichier temporaire (optionnel)
  const tempDir = path.join(process.cwd(), 'temp', 'gdpr-exports');

  try {
    await fs.mkdir(tempDir, { recursive: true });
    const filename = `gdpr-export-${toEmail.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
    const filepath = path.join(tempDir, filename);
    await fs.writeFile(filepath, jsonReport, 'utf8');
    console.log(`✅ JSON saved to: ${filepath}`);
  } catch (err) {
    console.error('Could not save JSON to file:', err);
  }

  return { success: true };
}

/**
 * Provider: Resend (https://resend.com)
 * Service moderne et simple pour l'envoi d'emails
 */
async function sendViaResend(
  config: EmailConfig,
  toEmail: string,
  userData: UserDataExport,
  textReport: string,
  jsonReport: string
): Promise<{ success: boolean; error?: string }> {
  if (!config.apiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: toEmail,
        subject: 'Vos données personnelles - Export RGPD',
        text: textReport,
        attachments: [
          {
            filename: `donnees-personnelles-${Date.now()}.json`,
            content: Buffer.from(jsonReport).toString('base64'),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { success: false, error: `Resend error: ${error}` };
    }

    console.log('✅ GDPR email sent via Resend to:', toEmail);
    return { success: true };
  } catch (error) {
    console.error('Resend error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Provider: SendGrid (https://sendgrid.com)
 * Service populaire d'envoi d'emails
 */
async function sendViaSendGrid(
  config: EmailConfig,
  toEmail: string,
  userData: UserDataExport,
  textReport: string,
  jsonReport: string
): Promise<{ success: boolean; error?: string }> {
  if (!config.apiKey) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
          },
        ],
        from: { email: config.from },
        subject: 'Vos données personnelles - Export RGPD',
        content: [
          {
            type: 'text/plain',
            value: textReport,
          },
        ],
        attachments: [
          {
            content: Buffer.from(jsonReport).toString('base64'),
            filename: `donnees-personnelles-${Date.now()}.json`,
            type: 'application/json',
            disposition: 'attachment',
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid API error:', error);
      return { success: false, error: `SendGrid error: ${error}` };
    }

    console.log('✅ GDPR email sent via SendGrid to:', toEmail);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Provider: Webhook
 * Envoie les données vers un webhook personnalisé
 * Utile si vous avez votre propre système d'envoi d'emails
 */
async function sendViaWebhook(
  config: EmailConfig,
  toEmail: string,
  userData: UserDataExport,
  textReport: string,
  jsonReport: string
): Promise<{ success: boolean; error?: string }> {
  if (!config.webhookUrl) {
    return { success: false, error: 'Webhook URL not configured' };
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'gdpr_data_export',
        to: toEmail,
        from: config.from,
        subject: 'Vos données personnelles - Export RGPD',
        textReport,
        jsonReport,
        metadata: userData.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Webhook error:', error);
      return { success: false, error: `Webhook error: ${error}` };
    }

    console.log('✅ GDPR data sent to webhook for:', toEmail);
    return { success: true };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envoie un email de notification simple
 * @param toEmail - Email du destinataire
 * @param subject - Sujet de l'email
 * @param message - Message de l'email
 */
export async function sendNotificationEmail(
  toEmail: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();

  try {
    switch (config.provider) {
      case 'console':
        console.log(`\n📧 EMAIL: ${subject}\nTo: ${toEmail}\n${message}\n`);
        return { success: true };

      case 'resend':
        if (!config.apiKey) {
          return { success: false, error: 'API key not configured' };
        }
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            from: config.from,
            to: toEmail,
            subject,
            text: message,
          }),
        });
        return resendResponse.ok
          ? { success: true }
          : { success: false, error: await resendResponse.text() };

      case 'sendgrid':
        if (!config.apiKey) {
          return { success: false, error: 'API key not configured' };
        }
        const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: toEmail }] }],
            from: { email: config.from },
            subject,
            content: [{ type: 'text/plain', value: message }],
          }),
        });
        return sgResponse.ok
          ? { success: true }
          : { success: false, error: await sgResponse.text() };

      case 'webhook':
        if (!config.webhookUrl) {
          return { success: false, error: 'Webhook URL not configured' };
        }
        const webhookResponse = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'notification', to: toEmail, subject, message }),
        });
        return webhookResponse.ok
          ? { success: true }
          : { success: false, error: await webhookResponse.text() };

      default:
        return { success: false, error: 'Unknown email provider' };
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
