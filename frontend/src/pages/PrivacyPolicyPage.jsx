import React from 'react';
import Navbar from '../components/Navbar';
import ProfessionalFooter from '../components/ProfessionalFooter';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicyPage = () => {
  const { darkMode } = useTheme();
  const lastUpdated = "March 18, 2026";

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Privacy Policy
            </h1>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
            
            {/* Introduction */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                1. Introduction
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calliotel ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our virtual 
                phone number services, website, and mobile applications (collectively, the "Services").
              </p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                By using our Services, you agree to the collection and use of information in accordance with 
                this Privacy Policy. If you do not agree with our policies and practices, do not use our Services.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                2. Information We Collect
              </h2>
              
              <h3 className={`text-xl font-bold mb-3 mt-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                2.1 Personal Information
              </h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Account Information:</strong> Name, email address, password, phone number</li>
                <li><strong>Payment Information:</strong> Credit card details, billing address (processed securely via Stripe)</li>
                <li><strong>Profile Information:</strong> Profile picture, bio, preferences</li>
                <li><strong>Identity Verification:</strong> Government-issued ID (for compliance with telecommunications regulations)</li>
              </ul>

              <h3 className={`text-xl font-bold mb-3 mt-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                2.2 Communication Data
              </h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                When you use our virtual phone number services, we collect:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Call Records:</strong> Phone numbers dialed, call duration, timestamps</li>
                <li><strong>Message Content:</strong> SMS/MMS content, media files, timestamps</li>
                <li><strong>Voicemail:</strong> Audio recordings and transcriptions</li>
                <li><strong>Contact Lists:</strong> Contacts you import or create</li>
              </ul>

              <h3 className={`text-xl font-bold mb-3 mt-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                2.3 Usage Information
              </h3>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> Pages viewed, features used, timestamps, error logs</li>
                <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                3. How We Use Your Information
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We use the information we collect to:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Provide Services:</strong> Process phone calls, SMS/MMS messages, and voicemail</li>
                <li><strong>Account Management:</strong> Create and manage your account, verify identity</li>
                <li><strong>Payment Processing:</strong> Process transactions and prevent fraud</li>
                <li><strong>Communication:</strong> Send service updates, security alerts, and customer support</li>
                <li><strong>Improve Services:</strong> Analyze usage patterns, fix bugs, develop new features</li>
                <li><strong>Marketing:</strong> Send promotional emails (you can opt-out anytime)</li>
                <li><strong>Legal Compliance:</strong> Comply with telecommunications regulations (TCPA, GDPR, CCPA)</li>
                <li><strong>Security:</strong> Detect fraud, prevent abuse, protect against security threats</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                4. How We Share Your Information
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our Services (Stripe for payments, Telnyx for phone services, AWS for hosting)</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Consent:</strong> With your explicit permission for specific purposes</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                5. Data Retention
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We retain your information for as long as necessary to provide our Services and comply with legal obligations:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Account Data:</strong> Retained until account deletion + 90 days</li>
                <li><strong>Call/Message Logs:</strong> Retained for 12 months (required by telecommunications law)</li>
                <li><strong>Payment Records:</strong> Retained for 7 years (required by tax law)</li>
                <li><strong>Support Tickets:</strong> Retained for 3 years</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                6. Your Privacy Rights
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Depending on your location, you may have the following rights:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
                <li><strong>Objection:</strong> Object to certain data processing activities</li>
              </ul>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                To exercise these rights, email us at <a href="mailto:privacy@calliotel.com" className="text-orange-500 hover:underline">privacy@calliotel.com</a>
              </p>
            </section>

            {/* Security */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                7. Data Security
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>Encryption:</strong> TLS/SSL encryption for data in transit, AES-256 encryption at rest</li>
                <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication for staff</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
                <li><strong>Audits:</strong> Regular security audits and penetration testing</li>
              </ul>
            </section>

            {/* International Transfers */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                8. International Data Transfers
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Your information may be transferred to and processed in the United States and other countries. 
                We ensure appropriate safeguards are in place to protect your data in accordance with GDPR and 
                other data protection laws.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                9. Children's Privacy
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Our Services are not intended for users under 18 years of age. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, 
                please contact us immediately.
              </p>
            </section>

            {/* Third-Party Links */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                10. Third-Party Services
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Our Services may contain links to third-party websites or integrate with third-party services 
                (e.g., WhatsApp verification). We are not responsible for the privacy practices of these 
                third parties. Please review their privacy policies.
              </p>
            </section>

            {/* Updates */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                11. Policy Updates
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We may update this Privacy Policy from time to time. We will notify you of material changes 
                via email or prominent notice on our website. Continued use of our Services after changes 
                constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                12. Contact Us
              </h2>
              <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Email:</strong> <a href="mailto:privacy@calliotel.com" className="text-orange-500 hover:underline">privacy@calliotel.com</a>
                </p>
                <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Mail:</strong> 123 Tech Avenue, Suite 500, San Francisco, CA 94105, United States
                </p>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Phone:</strong> +1 (800) 123-4567
                </p>
              </div>
            </section>

            {/* Regulatory Compliance */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                13. Regulatory Compliance
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calliotel complies with:
              </p>
              <ul className={`list-disc pl-6 mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li><strong>GDPR:</strong> General Data Protection Regulation (EU)</li>
                <li><strong>CCPA:</strong> California Consumer Privacy Act</li>
                <li><strong>TCPA:</strong> Telephone Consumer Protection Act (US)</li>
                <li><strong>COPPA:</strong> Children's Online Privacy Protection Act</li>
                <li><strong>CAN-SPAM:</strong> Email marketing regulations</li>
              </ul>
            </section>

          </div>
        </div>
      </div>

      <ProfessionalFooter />
    </div>
  );
};

export default PrivacyPolicyPage;
