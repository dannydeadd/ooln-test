"use client";

import { useState } from "react";
import ChatInterface from "./ChatInterface";
import { Button } from "@/app/components/ui/button";
import { LoginForm, SignupForm } from "./AuthForms";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { user, continueAsGuest } = useAuth();

  if (user) {
    return <ChatInterface />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16082f] to-[#0e0320] text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
            Ooln
          </h1>
          <p className="text-gray-400">Your AI companion for meaningful conversations</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={continueAsGuest}
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-colors py-6"
          >
            Continue as Guest
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#16082f] text-gray-400">or</span>
            </div>
          </div>

          <Button 
            onClick={() => setShowLogin(true)}
            className="w-full bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 text-white transition-colors py-6"
          >
            Sign In
          </Button>
          
          <Button 
            onClick={() => setShowSignup(true)}
            className="w-full bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 text-white transition-colors py-6"
          >
            Create Account
          </Button>
        </div>
      </div>

      <Modal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        title="Sign In"
      >
        <LoginForm onClose={() => setShowLogin(false)} />
      </Modal>

      <Modal 
        isOpen={showSignup} 
        onClose={() => setShowSignup(false)}
        title="Create Account"
      >
        <SignupForm onClose={() => setShowSignup(false)} />
      </Modal>
    </div>
  );
};

export default Home;
