import { Resend } from "resend"
import { IncomingWebhook } from "@slack/webhook"
import twilio from "twilio"

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key")
const slackWebhook = process.env.SLACK_WEBHOOK_URL
  ? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
  : null

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null

interface BaseNotification {
  message: string
}

export class NotificationService {

  static async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured. Skipping email.")
      return
    }

    try {
      const data = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      })
      console.log("Email sent successfully:", data)
      return data
    } catch (error) {
      console.error("Error sending email:", error)
      throw error
    }
  }


  static async sendDiscord(message: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) {
      console.warn("DISCORD_WEBHOOK_URL not configured. Skipping Discord.")
      return
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      })

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`)
      }
      console.log("Discord notification sent!")
    } catch (error) {
      console.error("Error sending Discord message:", error)
      throw error
    }
  }

  static async sendSlack(message: string) {
    if (!slackWebhook) {
      console.warn("SLACK_WEBHOOK_URL not configured. Skipping Slack.")
      return
    }

    try {
      await slackWebhook.send({ text: message })
      console.log("Slack notification sent!")
    } catch (error) {
      console.error("Error sending Slack message:", error)
      throw error
    }
  }

  static async sendWhatsApp(toPhoneNumber: string, message: string) {
    if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM) {
      console.warn("Twilio credentials not configured. Skipping WhatsApp.")
      return
    }

    try {
      const response = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${toPhoneNumber}`,
      })
      console.log("WhatsApp message sent:", response.sid)
      return response
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      throw error
    }
  }
}
