/**
 * SEO-optimized service metadata for 804+ verification services
 * Generates unique titles and descriptions for better search rankings
 */

export const generateServiceSEO = (serviceName, country = "Global") => {
  const cleanName = serviceName.replace(/[^a-zA-Z0-9\s]/g, '');
  
  return {
    title: `${cleanName} SMS Verification Number | Instant Code | Calliotel`,
    description: `Get instant ${cleanName} verification codes. Buy temporary ${cleanName} numbers for account verification. ${country} available. Delivered in seconds. No SIM required.`,
    keywords: `${cleanName} verification, ${cleanName} sms, ${cleanName} number, ${cleanName} verification code, buy ${cleanName} number, temporary ${cleanName} number`,
    url: `/verification?service=${serviceName.toLowerCase().replace(/\s+/g, '-')}`
  };
};

export const serviceSEOData = {
  whatsapp: {
    title: "WhatsApp SMS Verification Number | Instant Activation | Calliotel",
    description: "Get instant WhatsApp verification codes. Buy temporary WhatsApp numbers for business or personal use. 193 countries available. SMS delivered in 30 seconds.",
    keywords: "whatsapp verification, whatsapp number, whatsapp sms code, buy whatsapp number, temporary whatsapp number, whatsapp verification code"
  },
  telegram: {
    title: "Telegram SMS Verification Number | Instant Code | Calliotel",
    description: "Get instant Telegram verification codes. Buy temporary Telegram numbers for account creation. 194 countries available. Fast SMS delivery.",
    keywords: "telegram verification, telegram number, telegram sms, buy telegram number, telegram verification code, temporary telegram number"
  },
  discord: {
    title: "Discord SMS Verification Number | Phone Verification | Calliotel",
    description: "Get instant Discord phone verification numbers. Buy temporary Discord numbers for account verification. 191 countries available.",
    keywords: "discord verification, discord number, discord phone verification, buy discord number, discord sms verification"
  },
  instagram: {
    title: "Instagram SMS Verification Number | Account Verification | Calliotel",
    description: "Get instant Instagram verification codes. Buy temporary Instagram numbers for account creation. 192 countries available.",
    keywords: "instagram verification, instagram number, instagram sms code, buy instagram number, instagram verification code"
  },
  google: {
    title: "Google SMS Verification Number | Gmail & YouTube | Calliotel",
    description: "Get instant Google verification codes for Gmail, YouTube, and Google accounts. 183 countries available. Fast SMS delivery.",
    keywords: "google verification, gmail verification, youtube verification, google sms code, buy google number"
  }
};

export const homeSEO = {
  title: "Calliotel - Virtual Phone Numbers & SMS Verification | 804+ Services",
  description: "Get instant SMS verification numbers for WhatsApp, Telegram, Discord, and 800+ services. Bulk SMS, Virtual Numbers, and Ghost Verification. 250+ countries worldwide.",
  keywords: "virtual phone number, sms verification, bulk sms, ghost verification, temporary number, whatsapp verification, telegram number, discord verification, buy phone number"
};

export const verificationSEO = {
  title: "Ghost Verification - 804+ Services | SMS Verification Numbers | Calliotel",
  description: "Browse 804+ verification services including WhatsApp, Telegram, Discord, Instagram, Facebook, TikTok, and more. Instant SMS delivery. 250+ countries.",
  keywords: "verification services, sms verification numbers, temporary phone numbers, account verification, buy verification number"
};
