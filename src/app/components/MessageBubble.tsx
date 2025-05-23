"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export type MessageType = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

interface MessageBubbleProps {
  message: MessageType;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.sender === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[80%] gap-3">
        {!isUser && (
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-700/30 text-purple-300">
              <Bot size={16} />
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <div
            className={cn(
              "px-4 py-3 rounded-2xl",
              isUser
                ? "bg-purple-600/20 text-white"
                : "bg-gray-800/50 text-white prose prose-invert max-w-none text-sm"
            )}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>

          <div
            className={cn(
              "mt-1 text-xs text-gray-400",
              isUser ? "text-right pr-2" : "text-left pl-2"
            )}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-700/30 text-pink-300">
              <User size={16} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default MessageBubble;
