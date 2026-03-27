import React from 'react';
import { Video, Mic, Sparkles, Zap } from 'lucide-react';

const StayConnectedSection = () => {
  return (
    <section id="stay-connected" className="py-20 bg-gradient-to-br from-ember/5 to-ember-light/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Seamless Communication</h2>
          <p className="text-xl text-gray-600">Everything you need to stay connected globally, all in one platform.</p>
        </div>
        
        {/* NEW: Story Empire Feature - WORLD'S FIRST! */}
        <div className="bg-obsidian border-2 border-ember/40 rounded-3xl p-8 shadow-[0_0_40px_rgba(199,78,30,0.3)] mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-ember/20 backdrop-blur-sm rounded-full px-6 py-2 mb-3 border border-ember/40">
              <span className="text-ember font-bold text-sm">🌟 WORLD'S FIRST 🌟</span>
            </div>
            <h3 className="text-4xl font-black text-white mb-3">
              📖 STORY EMPIRE 🎬
            </h3>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              Turn your stories into MOVIES! Write or let AI generate, then watch as it becomes a cinematic video with narration & scenes!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:shadow-[0_0_20px_rgba(199,78,30,0.2)] transition-all">
              <div className="text-5xl mb-3">✍️</div>
              <div className="text-white font-bold text-lg mb-2">Write Stories</div>
              <div className="text-gray-400 text-sm">Your words, your imagination!</div>
            </div>
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:shadow-[0_0_20px_rgba(199,78,30,0.2)] transition-all">
              <div className="text-5xl mb-3">🪄</div>
              <div className="text-white font-bold text-lg mb-2">AI Generates</div>
              <div className="text-gray-400 text-sm">Or let AI write for you!</div>
            </div>
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:shadow-[0_0_20px_rgba(199,78,30,0.2)] transition-all">
              <div className="text-5xl mb-3">🎬</div>
              <div className="text-white font-bold text-lg mb-2">Instant Movie</div>
              <div className="text-gray-400 text-sm">Scenes + voice + music!</div>
            </div>
          </div>
          
          <div className="text-center">
            <a 
              href="/story-empire"
              className="inline-flex items-center space-x-2 bg-ember hover:bg-ember-light text-white px-8 py-4 rounded-full font-black text-lg hover:shadow-[0_0_30px_rgba(199,78,30,0.6)] hover:scale-105 transition-all"
            >
              <span>✨ Try Story Empire FREE!</span>
            </a>
            <p className="text-gray-400 text-sm mt-3">
              2 free videos/month • Premium: $2.99/mo for 20 videos
            </p>
          </div>
        </div>
        
        {/* Video Empire - 69 FUNNY FILTERS */}
        <div className="bg-obsidian border-2 border-ember/40 rounded-3xl p-8 shadow-[0_0_40px_rgba(199,78,30,0.3)]">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-black text-white mb-2">
              🎬 VIDEO EMPIRE - THE FUNNIEST FILTERS ON EARTH! 🤪
            </h3>
            <p className="text-gray-300 text-lg">
              Send videos with CRAZY filters + HILARIOUS voices! 😂
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* 69 FILTERS with FUNNY icon */}
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:scale-105 hover:shadow-[0_0_20px_rgba(199,78,30,0.3)] transition-all">
              <div className="text-6xl mb-3">🤪</div>
              <div className="text-5xl font-black text-ember mb-2">69</div>
              <div className="text-white font-semibold">FUNNY FILTERS</div>
              <div className="text-gray-400 text-sm mt-2">
                Cat, Monkey, Alien, Ghost, Zombie & MORE!
              </div>
            </div>
            
            {/* Voice Effects */}
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:scale-105 hover:shadow-[0_0_20px_rgba(199,78,30,0.3)] transition-all">
              <div className="text-6xl mb-3">🎤</div>
              <div className="text-5xl font-black text-ember mb-2">7</div>
              <div className="text-white font-semibold">VOICE EFFECTS</div>
              <div className="text-gray-400 text-sm mt-2">
                Darth Vader, Chipmunk, Robot & AI!
              </div>
            </div>
            
            {/* Scheduled Videos */}
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:scale-105 hover:shadow-[0_0_20px_rgba(199,78,30,0.3)] transition-all">
              <div className="text-6xl mb-3">📅</div>
              <div className="text-5xl font-black text-ember mb-2">∞</div>
              <div className="text-white font-semibold">SCHEDULED</div>
              <div className="text-gray-400 text-sm mt-2">
                Record now, send later!
              </div>
            </div>
            
            {/* View Once */}
            <div className="bg-olive border border-ember/20 rounded-2xl p-6 text-center hover:border-ember/40 hover:scale-105 hover:shadow-[0_0_20px_rgba(199,78,30,0.3)] transition-all">
              <div className="text-6xl mb-3">🔒</div>
              <div className="text-5xl font-black text-ember mb-2">1×</div>
              <div className="text-white font-semibold">VIEW ONCE</div>
              <div className="text-gray-400 text-sm mt-2">
                Self-destruct videos!
              </div>
            </div>
          </div>
          
          {/* Fun Examples */}
          <div className="mt-8 text-center">
            <p className="text-white text-lg font-semibold mb-3">
              🎉 Try These HILARIOUS Combos:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-olive border border-ember/30 px-4 py-2 rounded-full text-white font-medium text-sm hover:border-ember hover:shadow-[0_0_15px_rgba(199,78,30,0.2)] transition-all">
                🐵 Monkey + Chipmunk Voice
              </span>
              <span className="bg-olive border border-ember/30 px-4 py-2 rounded-full text-white font-medium text-sm hover:border-ember hover:shadow-[0_0_15px_rgba(199,78,30,0.2)] transition-all">
                👻 Ghost + Darth Vader
              </span>
              <span className="bg-olive border border-ember/30 px-4 py-2 rounded-full text-white font-medium text-sm hover:border-ember hover:shadow-[0_0_15px_rgba(199,78,30,0.2)] transition-all">
                🤡 Clown + Robot Voice
              </span>
              <span className="bg-olive border border-ember/30 px-4 py-2 rounded-full text-white font-medium text-sm hover:border-ember hover:shadow-[0_0_15px_rgba(199,78,30,0.2)] transition-all">
                🧟 Zombie + Deep Voice
              </span>
            </div>
          </div>
        </div>

        {/* 8 DEVIL IDEAS - NEW FEATURES */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full px-6 py-2 mb-3">
              <span className="text-white font-bold text-sm">🔥 NEW FEATURES 🔥</span>
            </div>
            <h3 className="text-4xl font-black text-gray-900 mb-2">
              Explore More Amazing Features!
            </h3>
            <p className="text-xl text-gray-600">
              Your communication platform just got SUPERPOWERS! ⚡
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Music Generator */}
            <a 
              href="/music-generator"
              className="group bg-gradient-to-br from-ember/10 to-ember-light/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-ember"
            >
              <div className="text-5xl mb-3">🎵</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">AI Music Generator</h4>
              <p className="text-sm text-gray-600 mb-3">
                Generate perfect background music for your videos using AI
              </p>
              <div className="text-xs text-ember font-semibold">FREE • 10 Genres</div>
            </a>

            {/* Story Empire for Kids */}
            <a 
              href="/kids-mode"
              className="group bg-gradient-to-br from-ember/10 to-ember-light/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-ember-500"
            >
              <div className="text-5xl mb-3">👶</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Kids Mode</h4>
              <p className="text-sm text-gray-600 mb-3">
                100% safe stories with fairy tale templates & cute animations
              </p>
              <div className="text-xs text-ember-600 font-semibold">$2.99/mo • Extra Safe</div>
            </a>

            {/* Voice Marketplace */}
            <a 
              href="/voice-marketplace"
              className="group bg-gradient-to-br from-indigo-100 to-ember-light/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-indigo-500"
            >
              <div className="text-5xl mb-3">🎤</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Voice Marketplace</h4>
              <p className="text-sm text-gray-600 mb-3">
                Create, sell & buy custom AI voice clones • 70% to creator!
              </p>
              <div className="text-xs text-ember font-semibold">$9.99 create • $0.99 use</div>
            </a>

            {/* Time Machine */}
            <a 
              href="/time-machine"
              className="group bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-amber-500"
            >
              <div className="text-5xl mb-3">⏰</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Time Machine</h4>
              <p className="text-sm text-gray-600 mb-3">
                Turn old photos into animated memory videos with music!
              </p>
              <div className="text-xs text-amber-600 font-semibold">$1.99/video • Ken Burns</div>
            </a>

            {/* Video Chat */}
            <a 
              href="/video-chat"
              className="group bg-gradient-to-br from-ember/10 to-indigo-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-ember"
            >
              <div className="text-5xl mb-3">📹</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">AI Video Chat</h4>
              <p className="text-sm text-gray-600 mb-3">
                1-on-1 video calls with 69 filters + voice effects!
              </p>
              <div className="text-xs text-ember font-semibold">FREE • WebRTC</div>
            </a>

            {/* Live Streaming */}
            <a 
              href="/live-streaming"
              className="group bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-red-500"
            >
              <div className="text-5xl mb-3">📡</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Live Streaming</h4>
              <p className="text-sm text-gray-600 mb-3">
                Stream with filters to unlimited viewers • Like Twitch!
              </p>
              <div className="text-xs text-red-600 font-semibold">FREE • Real-time</div>
            </a>

            {/* 3D Avatar Creator */}
            <a 
              href="/avatar-creator"
              className="group bg-gradient-to-br from-cyan-100 to-ember-light/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-cyan-500"
            >
              <div className="text-5xl mb-3">🦸</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">3D Avatar Creator</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upload selfie → Get 3D avatar for gaming & metaverse!
              </p>
              <div className="text-xs text-cyan-600 font-semibold">$9.99 • 4 Styles</div>
            </a>

            {/* Hologram Messages */}
            <a 
              href="/hologram-messages"
              className="group bg-gradient-to-br from-cyan-100 to-ember-light/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-transparent hover:border-ember"
            >
              <div className="text-5xl mb-3">👻</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Hologram Messages</h4>
              <p className="text-sm text-gray-600 mb-3">
                AR hologram videos • Star Wars style! "Help me Obi-Wan"
              </p>
              <div className="text-xs text-ember font-semibold">$4.99 • 4 Effects</div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StayConnectedSection;