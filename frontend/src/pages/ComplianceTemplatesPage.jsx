import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Download, FileText, Shield, CheckCircle, Copy, Check } from 'lucide-react';

const ComplianceTemplates = () => {
  const { darkMode } = useTheme();
  const [copiedId, setCopiedId] = useState(null);

  const templates = [
    {
      id: 'privacy-policy',
      title: 'Privacy Policy Template',
      subtitle: 'GDPR & CCPA Compliant',
      icon: Shield,
      color: 'from-ember to-cyan-500',
      content: `PRIVACY POLICY

Last Updated: ${new Date().toLocaleDateString()}

1. INFORMATION WE COLLECT
We collect information you provide directly to us, including:
- Contact information (name, email, phone number)
- Payment information (processed securely via Stripe)
- Usage data and communications

2. HOW WE USE YOUR INFORMATION
- To provide and maintain our virtual number services
- To process transactions and send notifications
- To comply with legal obligations
- To improve our services

3. MOBILE INFORMATION SHARING
NO MOBILE INFORMATION WILL BE SHARED WITH THIRD PARTIES/AFFILIATES FOR MARKETING/PROMOTIONAL PURPOSES. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.

4. YOUR RIGHTS
You have the right to:
- Access your personal data
- Request deletion of your data
- Opt-out of marketing communications
- Data portability

5. DATA SECURITY
We implement industry-standard security measures to protect your information, including encryption and secure storage.

6. CONTACT US
For privacy concerns, contact: privacy@calliotel.com

This policy complies with GDPR (EU), CCPA (California), and telecommunications regulations.`
    },
    {
      id: 'sms-terms',
      title: 'SMS Terms of Service',
      subtitle: 'Carrier-Approved Language',
      icon: FileText,
      color: 'from-ember to-ember-light/50',
      content: `SMS TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString()}

1. SERVICE DESCRIPTION
Calliotel provides virtual phone numbers for SMS and voice communication. By using our service, you agree to these terms.

2. ACCEPTABLE USE
You agree to use our services only for lawful purposes and in compliance with:
- TCPA (Telephone Consumer Protection Act)
- CAN-SPAM Act
- CTIA Messaging Principles and Best Practices

3. PROHIBITED ACTIVITIES
You may NOT use our services for:
- Spam or unsolicited marketing messages
- Phishing or fraudulent activities
- Harassment or threatening communications
- Any illegal activities

4. MESSAGE RATES
Standard message and data rates may apply. Your carrier may charge for messages received.

5. OPT-OUT
Recipients of your messages must have an easy way to opt-out. Include "Reply STOP to unsubscribe" in your messages.

6. CARRIER LIABILITY
We are not responsible for message delivery failures due to carrier issues or device limitations.

7. 10DLC REGISTRATION
For business messaging, you may need to complete 10DLC brand and campaign registration with carriers.

8. TERMINATION
We reserve the right to suspend or terminate service for violations of these terms.

9. CONTACT
For questions: support@calliotel.com`
    },
    {
      id: '10dlc-checklist',
      title: '10DLC Registration Checklist',
      subtitle: 'Step-by-Step Compliance Guide',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      content: `10DLC REGISTRATION CHECKLIST

What is 10DLC?
10DLC (10 Digit Long Code) is a system that allows businesses to send Application-to-Person (A2P) messages via standard 10-digit phone numbers.

REGISTRATION REQUIREMENTS:

✓ Business Information:
  - Legal business name
  - Business type (Corporation, LLC, Sole Proprietor, etc.)
  - EIN (Employer Identification Number)
  - Business address
  - Business website

✓ Website Requirements:
  - Active, working website
  - Privacy Policy (use our template!)
  - Terms of Service (use our template!)
  - Contact information clearly visible
  - Business description

✓ Campaign Information:
  - Use case (e.g., "Customer notifications", "2FA codes", "Marketing")
  - Sample messages (provide 3-5 examples)
  - Monthly message volume estimate
  - Opt-in process description

✓ Compliance Checklist:
  □ Privacy Policy posted on website
  □ Terms of Service posted on website
  □ Clear opt-in process for recipients
  □ Opt-out mechanism (STOP keyword)
  □ No third-party data sharing statement
  □ Contact information visible

REGISTRATION PROCESS:
1. Register your brand (business) with The Campaign Registry (TCR)
2. Wait for brand approval (1-3 business days)
3. Register your campaign (use case)
4. Wait for campaign approval (1-7 business days)
5. Associate your phone numbers with the approved campaign

APPROVAL TIPS:
- Use a professional business email (not Gmail/Yahoo)
- Ensure your website matches your business name
- Provide detailed, honest use case descriptions
- Keep message samples professional and clear

TRUST SCORE:
Your brand receives a Trust Score (0-100) based on:
- Business verification
- Website quality
- Domain age
- Business reputation

Higher trust scores = Better deliverability & higher throughput

Need help? Contact Calliotel support: support@calliotel.com`
    }
  ];

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadTemplate = (template) => {
    const element = document.createElement('a');
    const file = new Blob([template.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${template.id}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#FAFAF8]'} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
              darkMode 
                ? 'bg-gradient-to-r from-green-500/20 to-ember-light/20 text-green-300' 
                : 'bg-gradient-to-r from-green-100 to-ember-light/10 text-green-700'
            }`}>
              <Shield className="w-4 h-4" />
              <span>LEGAL TOOLKIT</span>
            </span>
          </div>
          
          <h1 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Compliance <span className="bg-gradient-to-r from-green-500 to-ember-light bg-clip-text text-transparent">Templates</span>
          </h1>
          
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Pre-written, carrier-approved templates. Copy, customize, and paste to your website. 
            <span className="font-bold text-green-600"> Pass 10DLC registration in minutes.</span>
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className={`rounded-3xl overflow-hidden shadow-2xl ${
                  darkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
                }`}
              >
                {/* Card Header */}
                <div className={`p-6 bg-gradient-to-r ${template.color}`}>
                  <Icon className="w-12 h-12 text-white mb-4" />
                  <h3 className="text-2xl font-black text-white mb-2">
                    {template.title}
                  </h3>
                  <p className="text-white/90 text-sm font-semibold">
                    {template.subtitle}
                  </p>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className={`p-4 rounded-xl mb-4 font-mono text-xs overflow-y-auto max-h-48 ${
                    darkMode ? 'bg-gray-900 text-gray-300' : 'bg-[#F9F9F7] text-gray-800'
                  }`}>
                    <pre className="whitespace-pre-wrap">{template.content.substring(0, 300)}...</pre>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={() => downloadTemplate(template)}
                      className={`w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Full Template</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(template.content, template.id)}
                      className={`w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                        copiedId === template.id
                          ? 'bg-green-500 text-white'
                          : darkMode
                          ? 'bg-ember hover:bg-ember-light text-white'
                          : 'bg-ember hover:bg-ember text-white'
                      }`}
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className={`p-8 rounded-3xl ${
          darkMode 
            ? 'bg-gradient-to-r from-olive/30 to-ember/20 border-2 border-ember/30' 
            : 'bg-gradient-to-r from-ember/5 to-ember-light/5 border-2 border-blue-200'
        }`}>
          <h3 className={`text-2xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How to Use These Templates
          </h3>
          <ol className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li className="flex items-start space-x-3">
              <span className="font-bold text-ember">1.</span>
              <span>Download or copy the template you need</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold text-ember">2.</span>
              <span>Customize with your business information (company name, contact email, etc.)</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold text-ember">3.</span>
              <span>Post to your website (create /privacy or /terms pages)</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold text-ember">4.</span>
              <span>Submit your 10DLC registration with confidence</span>
            </li>
          </ol>
          <p className={`mt-6 text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            💡 <strong>Pro Tip:</strong> Carriers check that your Privacy Policy includes the phrase "NO MOBILE INFORMATION WILL BE SHARED WITH THIRD PARTIES." 
            Our template already includes this critical language.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceTemplates;
