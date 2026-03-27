import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import GlassmorphismCard from './GlassmorphismCard';

const PremiumServicesSection = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // Simple Lottie animation data (pulse effect for phone)
  const phonePulseLottie = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Phone Pulse",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Phone",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [100, 100, 100] },
              { t: 30, s: [110, 110, 100] },
              { t: 60, s: [100, 100, 100] }
            ]
          }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 0, k: [30, 50] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 8 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  };

  const envelopeLottie = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Envelope",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Envelope",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: [
            { t: 0, s: [0] },
            { t: 30, s: [10] },
            { t: 60, s: [0] }
          ]},
          p: { a: 0, k: [50, 50, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 0, k: [50, 35] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 4 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  };

  const soundWaveLottie = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Sound Wave",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Wave",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 1, k: [
                  { t: 0, s: [4, 20] },
                  { t: 15, s: [4, 40] },
                  { t: 30, s: [4, 20] },
                  { t: 45, s: [4, 40] },
                  { t: 60, s: [4, 20] }
                ]},
                p: { a: 0, k: [-15, 0] },
                r: { a: 0, k: 2 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          },
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 1, k: [
                  { t: 0, s: [4, 30] },
                  { t: 15, s: [4, 50] },
                  { t: 30, s: [4, 30] },
                  { t: 45, s: [4, 50] },
                  { t: 60, s: [4, 30] }
                ]},
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 2 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          },
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 1, k: [
                  { t: 0, s: [4, 25] },
                  { t: 15, s: [4, 45] },
                  { t: 30, s: [4, 25] },
                  { t: 45, s: [4, 45] },
                  { t: 60, s: [4, 25] }
                ]},
                p: { a: 0, k: [15, 0] },
                r: { a: 0, k: 2 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  };

  const chartLottie = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Chart",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Bars",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 1, k: [
                  { t: 0, s: [8, 15] },
                  { t: 30, s: [8, 30] },
                  { t: 60, s: [8, 15] }
                ]},
                p: { a: 0, k: [-15, 5] },
                r: { a: 0, k: 2 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          },
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 1, k: [
                  { t: 0, s: [8, 25] },
                  { t: 30, s: [8, 40] },
                  { t: 60, s: [8, 25] }
                ]},
                p: { a: 0, k: [0, -2] },
                r: { a: 0, k: 2 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          },
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 1, k: [
                  { t: 0, s: [8, 20] },
                  { t: 30, s: [8, 35] },
                  { t: 60, s: [8, 20] }
                ]},
                p: { a: 0, k: [15, 2] },
                r: { a: 0, k: 2 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  };

  const services = [
    {
      title: 'Virtual Numbers',
      description: 'Get instant phone numbers from 50+ countries. Perfect for verification, business, or personal use.',
      features: [
        '50+ countries available',
        'Instant activation',
        'Starting at $1.99/month',
        'SMS & Voice capable'
      ],
      lottieData: phonePulseLottie,
      gradient: 'rgb(249, 115, 22), rgb(234, 88, 12)',
      badge: 'POPULAR',
      ctaText: 'Browse Numbers',
      onCTAClick: () => navigate('/browse-numbers')
    },
    {
      title: 'SMS API',
      description: 'Send and receive SMS at scale. Reliable delivery, competitive pricing, and simple integration.',
      features: [
        'Global SMS coverage',
        'Real-time delivery reports',
        '99.9% uptime SLA',
        'Developer-friendly API'
      ],
      lottieData: envelopeLottie,
      gradient: 'rgb(59, 130, 246), rgb(37, 99, 235)',
      badge: 'ENTERPRISE',
      ctaText: 'View API Docs',
      onCTAClick: () => navigate('/help')
    },
    {
      title: 'Voice Routing',
      description: 'Intelligent call routing with AI-powered features. Voice cloning, filters, and advanced analytics.',
      features: [
        'AI voice cloning',
        '7 voice effects',
        'Call recording',
        'Smart routing rules'
      ],
      lottieData: soundWaveLottie,
      gradient: 'rgb(168, 85, 247), rgb(147, 51, 234)',
      badge: 'AI-POWERED',
      ctaText: 'Learn More',
      onCTAClick: () => navigate('/help')
    },
    {
      title: 'Call Analytics',
      description: 'Real-time insights into your communication. Track usage, costs, and performance metrics.',
      features: [
        'Real-time dashboards',
        'Cost optimization',
        'Usage predictions',
        'Export reports'
      ],
      lottieData: chartLottie,
      gradient: 'rgb(34, 197, 94), rgb(22, 163, 74)',
      badge: 'INSIGHTS',
      ctaText: 'View Analytics',
      onCTAClick: () => navigate('/analytics')
    }
  ];

  return (
    <div className={`py-24 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Premium Communication Services
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Enterprise-grade solutions with a beautiful, modern interface. Built for scale, designed for simplicity.
          </p>
        </div>

        {/* Glassmorphism Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <GlassmorphismCard key={index} {...service} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            ✨ Trusted by thousands of businesses worldwide • 99.9% uptime guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumServicesSection;
