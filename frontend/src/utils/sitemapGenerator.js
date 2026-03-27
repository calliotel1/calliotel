import React from 'react';

/**
 * Sitemap Generator Component
 * Generates XML sitemap for all verification services
 */
const SitemapGenerator = () => {
  const baseURL = 'https://calliotel.com';
  
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/verification', priority: '0.9', changefreq: 'daily' },
    { url: '/signup', priority: '0.8', changefreq: 'monthly' },
    { url: '/login', priority: '0.7', changefreq: 'monthly' },
    { url: '/pricing', priority: '0.8', changefreq: 'weekly' },
    { url: '/global-pricing', priority: '0.8', changefreq: 'weekly' }
  ];

  const popularServices = [
    'whatsapp', 'telegram', 'discord', 'instagram', 'facebook',
    'twitter', 'tiktok', 'google', 'microsoft', 'amazon'
  ];

  const generateXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseURL}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Popular services (for faster indexing)
    popularServices.forEach(service => {
      xml += '  <url>\n';
      xml += `    <loc>${baseURL}/verification?service=${service}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  };

  return null; // This is a utility component
};

export const generateSitemap = () => {
  const baseURL = 'https://calliotel.com';
  
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/verification', priority: '0.9', changefreq: 'daily' },
    { url: '/signup', priority: '0.8', changefreq: 'monthly' },
    { url: '/login', priority: '0.7', changefreq: 'monthly' },
    { url: '/pricing', priority: '0.8', changefreq: 'weekly' },
    { url: '/global-pricing', priority: '0.8', changefreq: 'weekly' }
  ];

  const popularServices = [
    'whatsapp', 'telegram', 'discord', 'instagram', 'facebook',
    'twitter', 'tiktok', 'google', 'microsoft', 'amazon',
    'netflix', 'spotify', 'uber', 'airbnb', 'linkedin'
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseURL}${page.url}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  popularServices.forEach(service => {
    xml += '  <url>\n';
    xml += `    <loc>${baseURL}/verification?service=${service}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
};

export default SitemapGenerator;
