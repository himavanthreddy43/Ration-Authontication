import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Users, ScanFace, LayoutDashboard } from 'lucide-react';
import RegisterPage from './pages/RegisterPage';
import RecognizePage from './pages/RecognizePage';
import DashboardPage from './pages/DashboardPage';
import FamiliesPage from './pages/FamiliesPage';
import AIChatbot from './components/AIChatbot';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pb-2">
          Smart Ration <br /><span className="text-4xl md:text-6xl text-zinc-800">Distribution</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto font-medium">
          Secure, lightning-fast, and transparent grain distribution powered by advanced facial recognition technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full px-4 mb-12">
        <Link to="/register" className="group">
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col items-center text-center space-y-5 h-full transform hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner">
              <Users size={36} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Register Family</h2>
            <p className="text-zinc-500 font-medium pb-2">Register a new family card and capture their faces securely in the database.</p>
          </div>
        </Link>
        <Link to="/recognize" className="group">
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 flex flex-col items-center text-center space-y-5 h-full transform hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-inner">
              <ScanFace size={36} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Scan & Distribute</h2>
            <p className="text-zinc-500 font-medium pb-2">Scan a family member's face to verify identity and mark monthly ration collected.</p>
          </div>
        </Link>
        <Link to="/dashboard" className="group">
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col items-center text-center space-y-5 h-full transform hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner">
              <LayoutDashboard size={36} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Staff Dashboard</h2>
            <p className="text-zinc-500 font-medium pb-2">View real-time analytics, daily distribution stats, and manage secure family records.</p>
          </div>
        </Link>
        <Link to="/families" className="group">
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col items-center text-center space-y-5 h-full transform hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-inner">
              <Users size={36} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Family Directory</h2>
            <p className="text-zinc-500 font-medium pb-2">View, edit, and delete registered families and their members.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="border-b border-zinc-200/50 bg-white/70 backdrop-blur-lg sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <ScanFace className="text-white" size={24} />
          </div>
          <span className="font-extrabold text-2xl text-zinc-900 tracking-tight">Ration<span className="text-blue-600">App</span></span>
        </Link>
        <div className="flex space-x-1 sm:space-x-2 bg-zinc-100/80 p-1.5 rounded-full border border-zinc-200/50">
          <Link to="/register" className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-600 hover:text-blue-600 hover:bg-white focus:bg-white focus:shadow-sm transition-all">Register</Link>
          <Link to="/recognize" className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-600 hover:text-green-600 hover:bg-white focus:bg-white focus:shadow-sm transition-all">Scan</Link>
          <Link to="/families" className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-600 hover:text-indigo-600 hover:bg-white focus:bg-white focus:shadow-sm transition-all">Directory</Link>
          <Link to="/dashboard" className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-600 hover:text-purple-600 hover:bg-white focus:bg-white focus:shadow-sm transition-all">Dashboard</Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] text-zinc-900 font-sans relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 -left-64 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob pointer-events-none"></div>
        <div className="absolute top-0 -right-64 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-64 left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000 pointer-events-none"></div>

        <Navbar />
        <main className="max-w-7xl mx-auto relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/recognize" element={<RecognizePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/families" element={<FamiliesPage />} />
          </Routes>
        </main>

        {/* Global Chatbot */}
        <AIChatbot />
      </div>
    </BrowserRouter>
  );
}
