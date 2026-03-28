import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import XPToast from './components/XPToast';
import AchievementCelebration from './components/AchievementCelebration';
import SoundFeedback from './components/SoundFeedback';
import BirthdayCelebrationPopup from './components/BirthdayCelebrationPopup';
import LiveInventoryWidget from './components/LiveInventoryWidget';
import LiveActivityFeed from './components/LiveActivityFeed';  // 🏛️ Empire Social Proof
import SMMToastManager from './components/SMMToastManager';  // 🔥 SMM Order Notifications
import SMMGrandOpeningBanner from './components/SMMGrandOpeningBanner';  // 🏛️ SMM Launch Announcement
import Navbar from './components/Navbar';
import UtilityBar from './components/UtilityBar';
import HeroSection from './components/HeroSection';
import TrustedByBar from './components/TrustedByBar';
import PremiumServicesSection from './components/PremiumServicesSection';
import HowItWorksSection from './components/HowItWorksSection';
import VerificationShowcase from './components/VerificationShowcase';
import GlobalReachVisualization from './components/GlobalReachVisualization';
import StayConnectedSection from './components/StayConnectedSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import WebDialerSection from './components/WebDialerSection';
import DownloadSection from './components/DownloadSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';
import ProfessionalFooter from './components/ProfessionalFooter';
import InteractivePricingCalculator from './components/InteractivePricingCalculator';
import InteractiveAPISandbox from './components/InteractiveAPISandbox';
import AgenticServiceSelector from './components/AgenticServiceSelector';
import NumberPortabilityTool from './components/NumberPortabilityTool';
import OmnichannelFeature from './components/OmnichannelFeature';
import VisualCallFlow from './components/VisualCallFlow';
import InteractiveNetworkPing from './components/InteractiveNetworkPing';
import DailySpinWheel from './components/DailySpinWheel';
import ComplianceScoreTool from './components/ComplianceScoreTool';
import SDKShowcase from './components/SDKShowcase';
import CommandPalette from './components/CommandPalette';
import InstallPWA from './components/InstallPWA';
import SupportChatWidget from './components/SupportChatWidget';
import ExploreNetworkSection from './components/ExploreNetworkSection';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import BrowseNumbersPage from './pages/BrowseNumbersPage';
import MyNumbersPage from './pages/MyNumbersPage';
import SMSPage from './pages/SMSPage';
import CallHistoryPage from './pages/CallHistoryPage';
import WalletPage from './pages/WalletPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import USDTPaymentPage from './pages/USDTPaymentPage';
import HelpPage from './pages/HelpPage';
import ContactsPage from './pages/ContactsPage';
import AccountPage from './pages/AccountPage';
import KeypadPage from './pages/KeypadPage';
import ReferralsPage from './pages/ReferralsPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/EnhancedAnalyticsPage';
import GamificationPage from './pages/GamificationPage';
import TeamsPage from './pages/TeamsPage';
import VoicemailPage from './pages/VoicemailPage';
import ChatWrappedPage from './pages/ChatWrappedPage';
import FeedPage from './pages/FeedPage';
import ChannelsPage from './pages/ChannelsPage';
import ChannelDiscoveryPage from './pages/ChannelDiscoveryPage';
import CreateChannelPage from './pages/CreateChannelPage';
import ChannelDetailPage from './pages/ChannelDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import StickerCreatorPage from './pages/StickerCreatorPage';
import MyStickersPage from './pages/MyStickersPage';
import StoryCreatorPage from './pages/StoryCreatorPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import AISettingsPage from './pages/AISettingsPage';
import VoiceChangerPage from './pages/VoiceChangerPageV2';
import ScheduledMessagesPage from './pages/ScheduledMessagesPage';
import StoryEmpirePage from './pages/StoryEmpirePage';
import MusicGeneratorPage from './pages/MusicGeneratorPage';
import KidsModePage from './pages/KidsModePage';
import VoiceMarketplacePage from './pages/VoiceMarketplacePage';
import VirtualNumberMarketplace from './pages/VirtualNumberMarketplace';
import SMMMarketplacePage from './pages/SMMMarketplacePage';
import MySMMOrdersPage from './pages/MySMMOrdersPage';
import TimeMachinePage from './pages/TimeMachinePage';
import VideoChatPage from './pages/VideoChatPage';
import LiveStreamingPage from './pages/LiveStreamingPage';
import AvatarCreatorPage from './pages/AvatarCreatorPage';
import HologramMessagesPage from './pages/HologramMessagesPage';
import VideoAnalyticsPage from './pages/VideoAnalyticsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EmpireAnalyticsDashboard from './pages/EmpireAnalyticsDashboard';
import BirthdayWishesPage from './pages/BirthdayWishesPage';
import NotificationsPage from './pages/NotificationsPage';
import DailyChallengePage from './pages/DailyChallengePage';
import TeamChallengePage from './pages/TeamChallengePage';
import SpeedDialerGame from './pages/SpeedDialerGame';
import DuelHub from './pages/DuelHub';
import DuelRaceInterface from './pages/DuelRaceInterface';
import PhishFinderGame from './pages/PhishFinderGame';
import CoOpStackGame from './pages/CoOpStackGame';
import GameLobby from './components/GameLobby';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import EnhancedLeaderboard from './pages/EnhancedLeaderboard';
import GlobalSquare from './pages/GlobalSquare';
import CoveragePage from './pages/CoveragePage';
import PricingPage from './pages/PricingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ComplianceTemplatesPage from './pages/ComplianceTemplatesPage';
import MaintenancePage from './pages/MaintenancePage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import SMSSettingsPage from './pages/SMSSettingsPage';
import AdminSMSCommandCenter from './pages/AdminSMSCommandCenter';
import PremiumNumbersPage from './pages/PremiumNumbersPage';
import GlobalPricingPage from './pages/GlobalPricingPage';
import ResellerProgramPage from './pages/ResellerProgramPage';
import AuthCallback from './components/AuthCallback';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmailVerificationSuccessPage from './pages/EmailVerificationSuccessPage';
import PlatformVerification from './pages/PlatformVerification';
import VirtualNumbersHub from './pages/VirtualNumbersHub';
import VerificationCheckout from './pages/VerificationCheckout';
import AIHubPage from './pages/AIHubPage';
import BulkSMSPage from './pages/BulkSMSPage';
import WalletTopUp from './pages/WalletTopUp';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import LandingPage from './pages/LandingPage';

import useVersionCheck from './hooks/useVersionCheck';  // Version check for cookie/storage cleanup

function App() {
  // 🔄 Version check - clears stale cookies/storage on update (fixes incognito-only bug)
  useVersionCheck();

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          {/* 🏛️ Live Activity Feed - Empire Social Proof */}
          <LiveActivityFeed />
          
          {/* 🔥 SMM Order Notifications - Ember Toast System */}
          <SMMToastManager />
          
          <SoundFeedback />
          <XPToast />
          <AchievementCelebration />
          <InstallPWA />
          <BirthdayCelebrationPopup />
          <LiveInventoryWidget />
          <DailySpinWheel />
          <CommandPalette />
          <SupportChatWidget />
          <Routes>
          <Route path="/" element={
            <>
              <Navbar />
              <LandingPage />
              <ProfessionalFooter />
            </>
          } />
          <Route path="/global-pricing" element={<GlobalPricingPage />} />
          <Route path="/reseller-program" element={<ResellerProgramPage />} />
          <Route path="/premium-numbers" element={<PremiumNumbersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/compliance-templates" element={<ComplianceTemplatesPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/verification" element={<VirtualNumbersHub />} />
          <Route path="/verification/purchase/:serviceSlug" element={<VerificationCheckout />} />
          <Route path="/verification/old" element={<PlatformVerification />} />
          <Route path="/virtual-numbers" element={<VirtualNumbersHub />} />
          <Route path="/ai-hub" element={<AIHubPage />} />
          <Route path="/bulk-sms" element={<BulkSMSPage />} />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute requireVerification={false}>
                <WalletTopUp />
              </ProtectedRoute>
            } 
          />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPage />} />
          <Route path="/verify-email" element={<EmailVerificationSuccessPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireVerification={false}>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/browse-numbers" 
            element={
              <ProtectedRoute requireVerification={false}>
                <BrowseNumbersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-numbers" 
            element={
              <ProtectedRoute requireVerification={false}>
                <MyNumbersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sms" 
            element={
              <ProtectedRoute requireVerification={false}>
                <SMSPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/call-history" 
            element={
              <ProtectedRoute requireVerification={false}>
                <CallHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute requireVerification={false}>
                <WalletPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verification" 
            element={<PlatformVerification />} 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute requireVerification={false}>
                <PaymentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment-success" 
            element={
              <ProtectedRoute requireVerification={false}>
                <PaymentSuccessPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/usdt-payment" 
            element={
              <ProtectedRoute requireVerification={false}>
                <USDTPaymentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/smm-marketplace" 
            element={<SMMMarketplacePage />}
          />
          <Route 
            path="/my-smm-orders" 
            element={
              <ProtectedRoute requireVerification={false}>
                <MySMMOrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/help" 
            element={<HelpPage />} 
          />
          <Route 
            path="/contacts" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ContactsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute requireVerification={false}>
                <AccountPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/keypad" 
            element={
              <ProtectedRoute requireVerification={false}>
                <KeypadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/referrals" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ReferralsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scheduled-messages" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ScheduledMessagesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute requireVerification={false}>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/empire-analytics" 
            element={
              <ProtectedRoute requireVerification={false}>
                <EmpireAnalyticsDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/achievements" 
            element={
              <ProtectedRoute requireVerification={false}>
                <GamificationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute requireVerification={false}>
                <EnhancedLeaderboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/global-square" 
            element={
              <ProtectedRoute requireVerification={false}>
                <GlobalSquare />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gamification" 
            element={
              <ProtectedRoute requireVerification={false}>
                <GamificationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/settings" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ProfileSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sms-settings" 
            element={
              <ProtectedRoute requireVerification={false}>
                <SMSSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/sms-command-center" 
            element={
              <ProtectedRoute requireVerification={false}>
                <AdminSMSCommandCenter />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/games/speed-dialer" 
            element={
              <ProtectedRoute requireVerification={false}>
                <SpeedDialerGame />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/duel" 
            element={
              <ProtectedRoute requireVerification={false}>
                <DuelHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/duel/race/:duelId" 
            element={
              <ProtectedRoute requireVerification={false}>
                <DuelRaceInterface />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/phish-finder" 
            element={
              <ProtectedRoute requireVerification={false}>
                <PhishFinderGame />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/coop-stack/lobby/:roomId" 
            element={
              <ProtectedRoute requireVerification={false}>
                <GameLobby />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/coop-stack/play/:roomId" 
            element={
              <ProtectedRoute requireVerification={false}>
                <CoOpStackGame />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teams" 
            element={
              <ProtectedRoute requireVerification={false}>
                <TeamsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voicemail" 
            element={
              <ProtectedRoute requireVerification={false}>
                <VoicemailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wrapped" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ChatWrappedPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute requireVerification={false}>
                <FeedPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/channels" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ChannelsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/channels/discovery" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ChannelDiscoveryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/channels/create" 
            element={
              <ProtectedRoute requireVerification={false}>
                <CreateChannelPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/channels/create-post" 
            element={
              <ProtectedRoute requireVerification={false}>
                <CreatePostPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/channels/:channelId" 
            element={
              <ProtectedRoute requireVerification={false}>
                <ChannelDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/posts/:postId" 
            element={
              <ProtectedRoute requireVerification={false}>
                <PostDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stickers/create" 
            element={
              <ProtectedRoute requireVerification={false}>
                <StickerCreatorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stickers/my" 
            element={
              <ProtectedRoute requireVerification={false}>
                <MyStickersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stories/create" 
            element={
              <ProtectedRoute requireVerification={false}>
                <StoryCreatorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/notifications" 
            element={
              <ProtectedRoute requireVerification={false}>
                <NotificationSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/ai" 
            element={
              <ProtectedRoute requireVerification={false}>
                <AISettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/privacy" 
            element={
              <ProtectedRoute requireVerification={false}>
                <PrivacySettingsPage />
              </ProtectedRoute>
            } 

          />
          <Route 
            path="/voice-changer" 
            element={
              <ProtectedRoute requireVerification={false}>
                <VoiceChangerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/story-empire" 
            element={
              <ProtectedRoute requireVerification={false}>
                <StoryEmpirePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/music-generator" 
            element={
              <ProtectedRoute requireVerification={false}>
                <MusicGeneratorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kids-mode" 
            element={
              <ProtectedRoute requireVerification={false}>
                <KidsModePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voice-marketplace" 
            element={
              <ProtectedRoute requireVerification={false}>
                <VoiceMarketplacePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/time-machine" 
            element={
              <ProtectedRoute requireVerification={false}>
                <TimeMachinePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/video-chat" 
            element={
              <ProtectedRoute requireVerification={false}>
                <VideoChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/live-streaming" 
            element={
              <ProtectedRoute requireVerification={false}>
                <LiveStreamingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/avatar-creator" 
            element={
              <ProtectedRoute requireVerification={false}>
                <AvatarCreatorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hologram-messages" 
            element={
              <ProtectedRoute requireVerification={false}>
                <HologramMessagesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/video-analytics" 
            element={
              <ProtectedRoute requireVerification={false}>
                <VideoAnalyticsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireVerification={false}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/birthday-wishes" 
            element={
              <ProtectedRoute requireVerification={false}>
                <BirthdayWishesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute requireVerification={false}>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/daily-challenge" 
            element={
              <ProtectedRoute requireVerification={false}>
                <DailyChallengePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/team-challenge" 
            element={
              <ProtectedRoute requireVerification={false}>
                <TeamChallengePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coverage" 
            element={
              <ProtectedRoute requireVerification={false}>
                <CoveragePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  </AuthProvider>
);
}

export default App;
