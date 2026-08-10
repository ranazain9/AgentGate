import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-bg relative overflow-hidden selection:bg-primary/30">
      {/* Global Background Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Global Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none z-0" />
      
      {/* Subtle Floating Decor */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[10%] w-64 h-64 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[4rem] backdrop-blur-3xl z-0 pointer-events-none" 
      />

      {/* Sidebar - z-10 to stay above background */}
      <div className="relative z-10 flex shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto relative z-10">
        <div className="max-w-[1600px] mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}