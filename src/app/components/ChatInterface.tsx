// ChatInterface.tsx
"use client";
import { useState } from "react";
import MessageBubble, { MessageType } from "./MessageBubble";
import ChatInput from "./ChatInput";
import { Bot, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";

const initialMessages: MessageType[] = [
  {
    id: "1",
    content: "Hello! I'm Ooln. How can I help you today?",
    sender: "ai",
    timestamp: new Date(Date.now() - 60000),
  },
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSendMessage = async (content: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/trading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userMessage: content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze trading data");
      }

      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: data.aiResponse || "Sorry, I couldn't analyze the trading data.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#16082f] to-[#0e0320] text-white">
      <header className="border-b border-gray-800/40 py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300 cursor-pointer hover:opacity-80 transition-opacity"
          >
            Ooln
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-transparent">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-700/30 text-purple-300 hover:bg-purple-700/40 transition-colors">
                  <User size={16} strokeWidth={2.5} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#16082f] border-gray-700/50" align="end">
              <div className="px-2 py-1.5 text-sm text-gray-400">
                {user?.email}
              </div>
              <DropdownMenuItem className="text-gray-300 focus:bg-gray-800/50 focus:text-white cursor-pointer" onClick={() => {}}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 focus:bg-gray-800/50 focus:text-white cursor-pointer" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800/40 py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;