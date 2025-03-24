
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CornerDownLeft, Loader2, RefreshCw, Send, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { azureAIServices } from "@/services/azure-ai";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<"gpt-35-turbo" | "gpt-4">("gpt-35-turbo");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === "") return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      const response = await azureAIServices.gpt.chat(input, model);
      
      if (response.choices && response.choices.length > 0) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.choices[0].message.content,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error("Error getting response from GPT:", error);
      toast.error("Failed to get response", {
        description: "There was an error communicating with Azure OpenAI. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared", { description: "All messages have been cleared." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Azure OpenAI Chat</h1>
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={(value: "gpt-35-turbo" | "gpt-4") => setModel(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-35-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={clearChat} title="Clear chat">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Chat with {model === "gpt-4" ? "GPT-4" : "GPT-3.5 Turbo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Start a conversation with Azure OpenAI</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      } items-start gap-2`}
                    >
                      <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-blue-500" : "bg-green-500"}`}>
                        <AvatarFallback>
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className={`text-xs mt-1 ${
                          message.role === "user"
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                className="h-10 w-10 p-2"
                disabled={loading || input.trim() === ""}
                onClick={handleSendMessage}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Press <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-mono text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-mono text-xs">Shift</kbd> + <kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-mono text-xs">Enter</kbd> for a new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
