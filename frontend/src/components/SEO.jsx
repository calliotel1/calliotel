import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Calliotel - Global Virtual Phone & SMS Verification", 
  description = "Get instant SMS verification numbers for WhatsApp, Telegram, Discord, and 800+ services. Bulk SMS, Virtual Numbers, and Ghost Verification. 250+ countries.",
  keywords = "sms verification, virtual number, ghost verification, whatsapp verification, telegram number, discord verification, bulk sms",
  image = "/og-image.png",
  url = "https://calliotel.com",
  type = "website"
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
