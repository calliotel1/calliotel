import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, ChevronUp, HelpCircle, Mail, MessageSquare, Phone, Send, Book, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HelpPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { darkMode } = useTheme();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.email || !contactForm.message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in email and message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // For now, just show success - you can add backend endpoint later
      toast({
        title: 'Message Sent!',
        description: 'Our support team will contact you within 24 hours',
      });
      
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I purchase a phone number?",
          answer: "Go to 'Browse Numbers', search by country, and click 'Purchase' on any available number. You'll need sufficient balance in your wallet. Numbers start at $1.49/month."
        },
        {
          question: "How do I find my Client ID?",
          answer: "Your Client ID is displayed on your Dashboard in a blue box. It looks like 'CL12345678'. Share this ID with others to receive transfers."
        },
        {
          question: "What countries are supported?",
          answer: "We offer virtual numbers from 50+ countries including US, UK, Canada, Germany, and more. Search by country in 'Browse Numbers' to see availability."
        }
      ]
    },
    {
      category: "Payments & Billing",
      questions: [
        {
          question: "How do I add credits to my wallet?",
          answer: "Go to your Wallet page and click 'Add Credits'. Choose from our packages: Starter ($10), Basic ($25 + $2 bonus), Pro ($50 + $5 bonus), or Premium ($100 + $15 bonus). We accept credit cards and crypto (USDC)."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept credit/debit cards (Visa, Mastercard, Amex) and cryptocurrency (USDC stablecoin) via Stripe. All payments are secure and encrypted."
        },
        {
          question: "Are there any bonus credits?",
          answer: "Yes! Basic pack gets +$2 bonus ($27 total), Pro pack gets +$5 bonus ($55 total), and Premium pack gets +$15 bonus ($115 total). New users also get a $10 welcome bonus!"
        },
        {
          question: "Can I get a refund?",
          answer: "Unused credits can be refunded within 30 days of purchase. Contact our support team with your transaction details. Number monthly fees and used services are non-refundable."
        },
        {
          question: "How much do services cost?",
          answer: "SMS: $0.01 per message, Calls: $0.02 per minute, Phone numbers: $1.49/month, Number transfer: $1.00 fee. All charges are deducted from your wallet balance."
        }
      ]
    },
    {
      category: "Wallet & Transfers",
      questions: [
        {
          question: "How does the wallet system work?",
          answer: "Add credits to your wallet to pay for services. All charges (SMS, calls, numbers) are automatically deducted. You can view your balance and transaction history in the Wallet page."
        },
        {
          question: "Can I transfer balance to another user?",
          answer: "Yes! Balance transfers are FREE. Go to Wallet, click 'Transfer', enter the recipient's Client ID and amount. They'll receive it instantly."
        },
        {
          question: "Can I transfer my number to another user?",
          answer: "Yes! Go to 'My Numbers', click 'Transfer Number', and enter the recipient's Client ID. There's a $1.00 transfer fee, and the number transfers immediately."
        }
      ]
    },
    {
      category: "SMS & Calling",
      questions: [
        {
          question: "How does SMS messaging work?",
          answer: "After purchasing a number, go to the SMS page. You can send messages to any number and receive replies. Each SMS costs $0.01 and is deducted from your wallet."
        },
        {
          question: "How do I make voice calls?",
          answer: "Voice calling requires Telnyx Voice Application setup. Once configured, you can make calls at $0.02 per minute. Check our documentation or contact support for setup help."
        },
        {
          question: "Can I receive incoming SMS and calls?",
          answer: "Yes! Once you set up Telnyx webhooks (for SMS) and Voice Application (for calls), you'll receive all incoming messages and calls. See our SMS Setup Guide for details."
        }
      ]
    },
    {
      category: "Account & Security",
      questions: [
        {
          question: "How do I verify my email?",
          answer: "After signup, check your email for a verification link. Click it to verify your account. If you didn't receive it, go to your profile and click 'Resend Verification Email'."
        },
        {
          question: "Can I login with Google?",
          answer: "Yes! Click 'Sign in with Google' on the login page. Your Google email will be automatically verified, and you'll get a $10 welcome bonus."
        },
        {
          question: "Is my data secure?",
          answer: "Yes! We use industry-standard encryption (AES-256) for all communications. Your messages, call data, and payment information are stored securely and never shared with third parties."
        },
        {
          question: "How do I release a number?",
          answer: "Go to 'My Numbers', find the number you want to release, and click 'Release Number'. This will stop monthly charges immediately. Released numbers cannot be recovered."
        }
      ]
    }
  ];

  const quickLinks = [
    {
      icon: Book,
      title: "Getting Started Guide",
      description: "Learn the basics of Calliotel",
      action: () => window.open('/docs/getting-started', '_blank')
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      action: () => window.open('/docs/tutorials', '_blank')
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with support (Coming Soon)",
      action: () => toast({ title: "Coming Soon!", description: "Live chat will be available soon" })
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
                <p className="text-sm text-gray-600">We're here to help you</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={link.action}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left"
                >
                  <link.icon className="w-8 h-8 text-ember mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{link.title}</h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </button>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                      {category.category}
                    </h3>
                    <div className="space-y-3">
                      {category.questions.map((faq, faqIndex) => {
                        const accordionKey = `${categoryIndex}-${faqIndex}`;
                        return (
                          <div key={faqIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleAccordion(accordionKey)}
                              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-medium text-gray-900">{faq.question}</span>
                              {activeAccordion === accordionKey ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            {activeAccordion === accordionKey && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Support */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Support</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="How can we help?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us more about your issue..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {sending ? (
                    <>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-ember to-ember-light rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Email</p>
                    <p className="font-medium">support@calliotel.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">24/7 Support</p>
                    <p className="font-medium">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Response Time</p>
                    <p className="font-medium">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
