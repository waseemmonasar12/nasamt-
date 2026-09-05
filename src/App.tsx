import React, { useState, useEffect } from 'react';
import { WinterCanvas } from './components/winter/WinterCanvas.js';
import { PublicHeader } from './components/public/PublicHeader.js';
import { PublicHomeView } from './components/public/PublicHomeView.js';
import { PostDetailView } from './components/public/PostDetailView.js';
import { VisitorGateModal } from './components/public/VisitorGateModal.js';
import { AboutModal, PrivacyModal, TermsModal } from './components/public/InfoModals.js';
import { AdminLoginView } from './components/admin/AdminLoginView.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { apiRequest } from './utils/api.js';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'posts' | 'post' | 'login' | 'admin'>('home');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(true);

  // Visitor identity state
  const [visitorName, setVisitorName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nesmat_visitor_name') || null;
    } catch {
      return null;
    }
  });
  const [isVisitorGateOpen, setIsVisitorGateOpen] = useState(() => {
    try {
      return !localStorage.getItem('nesmat_visitor_name');
    } catch {
      return false;
    }
  });

  // Modals state
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Auth state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Track initial visit on mount (sends alert to Telegram bot)
  useEffect(() => {
    apiRequest('/api/public/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: window.location.pathname }),
    }).catch(() => {});

    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setAuthChecking(true);
    try {
      const res = await apiRequest<{ authenticated: boolean }>('/api/admin/check-auth');
      if (res.authenticated) {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
    } catch {
      setIsAdminAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };

  const navigateTo = (view: string, postId?: string) => {
    if (view === 'post' && postId) {
      setActivePostId(postId);
      setCurrentView('post');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'login') {
      if (isAdminAuthenticated) {
        setCurrentView('admin');
      } else {
        setCurrentView('login');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'admin') {
      if (isAdminAuthenticated) {
        setCurrentView('admin');
      } else {
        setCurrentView('login');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'posts') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('writings-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      setCurrentView('home');
      setActivePostId(null);
      setIsReadingMode(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView('home');
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Immersive UI Ambient Glowing Blur Orbs */}
      <div className="fixed inset-0 opacity-40 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-400/10 rounded-full blur-[100px]" />
      </div>

      {/* Immersive UI Subtle Radial Dots Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Immersive UI Vertical Accent Lines */}
      <div className="fixed top-20 left-1/4 w-[1px] h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none z-0 hidden lg:block" />
      <div className="fixed bottom-40 right-1/4 w-[1px] h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none z-0 hidden lg:block" />

      {/* Background Snow Particles Canvas */}
      <WinterCanvas enabled={snowEnabled} intensity="normal" />

      {/* When in Admin Dashboard */}
      {currentView === 'admin' && isAdminAuthenticated ? (
        <AdminDashboard
          onLogout={handleLogout}
          onNavigatePublic={(v, pid) => navigateTo(v, pid)}
        />
      ) : currentView === 'login' ? (
        <AdminLoginView
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => navigateTo('home')}
        />
      ) : (
        /* Visitor public website experience */
        <div className="relative z-10 flex min-h-screen flex-col justify-between">
          <PublicHeader
            currentView={currentView}
            onNavigate={navigateTo}
            isReadingMode={isReadingMode}
            onToggleReadingMode={() => setIsReadingMode(!isReadingMode)}
            snowEnabled={snowEnabled}
            onToggleSnow={() => setSnowEnabled(!snowEnabled)}
            visitorName={visitorName}
            onOpenVisitorGate={() => setIsVisitorGateOpen(true)}
          />

          <main className="flex-1">
            {currentView === 'post' && activePostId ? (
              <PostDetailView
                postId={activePostId}
                onBack={() => navigateTo('home')}
                isReadingMode={isReadingMode}
                onToggleReadingMode={() => setIsReadingMode(!isReadingMode)}
              />
            ) : (
              <PublicHomeView
                onSelectPost={(id) => navigateTo('post', id)}
                onNavigateLogin={() => navigateTo('login')}
                onOpenAbout={() => setIsAboutOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
                onOpenTerms={() => setIsTermsOpen(true)}
              />
            )}
          </main>
        </div>
      )}

      {/* Visitor Gate Modal (Requires visitor to register their name/alias) */}
      <VisitorGateModal
        isOpen={isVisitorGateOpen && currentView !== 'admin' && currentView !== 'login'}
        onRegistered={(name) => {
          setVisitorName(name);
          setIsVisitorGateOpen(false);
        }}
      />

      {/* Info Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
