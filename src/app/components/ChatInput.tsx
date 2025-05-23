"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;
    
    onSendMessage(message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full"
    >
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="bg-gray-800/30 border border-gray-700/50 focus-visible:ring-1 focus-visible:ring-purple-500/50 text-white placeholder:text-gray-400 rounded-lg py-6"
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-colors rounded-lg p-2 aspect-square h-12 w-12"
          disabled={message.trim() === "" || disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
