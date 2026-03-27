import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What makes Calliotel different from other providers?',
      answer: 'Calliotel offers premium virtual numbers with advanced features like HD voice quality, instant activation, and competitive pricing. We provide numbers from 50+ countries with no long-term contracts and transparent pricing.'
    },
    {
      question: 'Can I use Calliotel numbers for business verification?',
      answer: 'Yes! Calliotel numbers work for most business verifications and OTP services. However, compatibility may vary by service provider. Contact our support team if you have specific verification requirements.'
    },
    {
      question: 'Do I need to live in a country to get its virtual number?',
      answer: 'No residency required! You can get virtual numbers from any of our supported countries regardless of your location. Simply sign up, choose your country, and activate your number instantly.'
    },
    {
      question: 'How many virtual numbers can I have?',
      answer: 'You can manage unlimited virtual numbers through your Calliotel account. Each number can be configured independently with custom settings, making it perfect for managing multiple projects or business lines.'
    },
    {
      question: 'What are the calling rates?',
      answer: 'Calling rates vary by destination. Incoming calls and SMS are always free. Outgoing calls start from $0.02/minute, and outgoing SMS from $0.08/message. Check our rates page for detailed pricing.'
    },
    {
      question: 'Is there a money-back guarantee?',
      answer: 'We offer a 7-day satisfaction guarantee. If you\'re not happy with our service, contact us within 7 days of activation for a full refund of your subscription fee (setup fees are non-refundable).'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Everything you need to know about Calliotel</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-ember flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;