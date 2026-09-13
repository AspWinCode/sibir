/**
 * SMS provider abstraction. Without SMS_PROVIDER_API_KEY configured, codes are
 * logged to the server console so local development works without an account.
 * Swap sendViaHttpProvider's implementation for the chosen provider (e.g. sms.ru)
 * once credentials are available - callers never need to change.
 */

const SMS_PROVIDER_API_KEY = process.env.SMS_PROVIDER_API_KEY;
const SMS_PROVIDER_URL = process.env.SMS_PROVIDER_URL;
const DEV_FALLBACK_CODE = "123456";

export function generateSmsCode(): string {
  if (!SMS_PROVIDER_API_KEY || !SMS_PROVIDER_URL) {
    // No SMS provider configured yet: use a fixed demo code so testers can log
    // in without relaying one-time codes out of the server console each time.
    return DEV_FALLBACK_CODE;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  if (!SMS_PROVIDER_API_KEY || !SMS_PROVIDER_URL) {
    // eslint-disable-next-line no-console
    console.log(`[sms:dev-fallback] code for ${phone}: ${code}`);
    return;
  }
  await sendViaHttpProvider(phone, code);
}

async function sendViaHttpProvider(phone: string, code: string): Promise<void> {
  const url = new URL(SMS_PROVIDER_URL!);
  url.searchParams.set("api_id", SMS_PROVIDER_API_KEY!);
  url.searchParams.set("to", phone);
  url.searchParams.set("msg", `Код подтверждения: ${code}`);
  url.searchParams.set("json", "1");
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`SMS provider responded with ${response.status}`);
  }
}
