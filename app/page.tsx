"use client";

import type React from "react";

import { ColorPicker } from "@/components/color-picker";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import sessionId from "@/lib/sessionId";
import axios, { AxiosError } from "axios";
import {
  BedSingle,
  Bot,
  Eye,
  Heart,
  HeartPulse,
  Hospital,
  ImageIcon,
  Info,
  Mic,
  Salad,
  Send,
  Shield,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  error?: boolean;
  imageUrl?: string;
  prompt?: string;
  type?: "text" | "image";
}

interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

interface APIResponseData {
  output?: string;
  message?: string;
  imageUrl?: string;
  blob?: string;
}

interface APIResponse {
  message: string;
  success: boolean;
  data?: APIResponseData | APIResponseData[];
}

const defaultTheme: ColorTheme = {
  name: "Ocean Blue",
  primary: "from-blue-500 to-cyan-500",
  secondary: "from-green-400 to-emerald-500",
  accent: "bg-blue-500",
  gradient: "from-blue-5 via-cyan-50 to-green-50",
};

const quickActions = [
  {
    icon: HeartPulse,
    label: "Kebugaran",
    prompt: "Apa saja tips kebugaran agar tubuh tetap fit dan aktif?",
    color: "text-blue-500 dark:text-blue-400",
    available: true,
  },
  {
    icon: Salad,
    label: "Hidup Sehat",
    prompt: "Bagaimana cara memulai gaya hidup sehat yang mudah dan konsisten?",
    color: "text-green-500 dark:text-green-400",
    available: true,
  },
  {
    icon: BedSingle,
    label: "Fasilitas",
    prompt:
      "Tolong tampilkan chart ketersediaan tempat tidur dan fasilitas rawat inap saat ini di rumah sakit.",
    color: "text-emerald-500 dark:text-emerald-400",
    available: true,
  },
  {
    icon: Hospital,
    label: "Departemen",
    prompt:
      "Berikan saya chart departemen atau poli terakhir yang paling aktif dikunjungi di rumah sakit.",
    color: "text-purple-500 dark:text-purple-400",
    available: true,
  },
  {
    icon: Users,
    label: "Staf",
    prompt:
      "Tampilkan chart staf medis atau dokter yang terakhir bertugas di rumah sakit.",
    color: "text-teal-500 dark:text-teal-400",
    available: true,
  },
];

export default function HospitalChatbot() {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(defaultTheme);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    prompt: string;
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hai! 👋 Selamat datang di Asisten Virtual Rumah Sakit. Aku di sini untuk membantumu dengan berbagai hal, seperti:
  🩺 Menjawab pertanyaan seputar kesehatan dan medis
  🔍 Membantu memahami hasil pemeriksaan atau data rumah sakit
  🧘 Memberikan tips gaya hidup sehat & kebugaran
  📄 Membantu mengelola dokumen dan laporan medis
  Yuk, tanya apa saja! 😊`,
      sender: "ai",
      timestamp: new Date(),
      type: "text",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showComingSoonAlert, setShowComingSoonAlert] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("hospital-chat-theme");
    const savedDarkMode = localStorage.getItem("hospital-chat-dark-mode");

    if (savedTheme) {
      try {
        setCurrentTheme(JSON.parse(savedTheme));
      } catch (e) {
        console.error("Failed to parse saved theme");
      }
    }

    if (savedDarkMode) {
      setIsDark(savedDarkMode === "true");
    }
  }, []);

  // Auto hide coming soon alert
  useEffect(() => {
    if (showComingSoonAlert) {
      const timer = setTimeout(() => {
        setShowComingSoonAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showComingSoonAlert]);

  // Save theme to localStorage
  const handleThemeChange = (theme: ColorTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem("hospital-chat-theme", JSON.stringify(theme));
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem("hospital-chat-dark-mode", newDarkMode.toString());
  };

  const convertMarkdownToHTML = (text: string) => {
    return text
      ?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      ?.replace(/\*(.*?)\*/g, "<em>$1</em>"); // Italic
  };

  const getImageContent = (output: any): string => {
    if (typeof output === "string") {
      return output;
    }
    if (typeof output === "object" && output !== null) {
      return output.data || output.url || output.content || "";
    }
    return "";
  };
  function isImageResponse(response: any) {
    const contentType =
      response.headers["content-type"] ||
      response.headers.get?.("content-type");
    return contentType && contentType.startsWith("image/");
  }
  const sendMessageToAPI = async (message: string): Promise<string> => {
    const formatMarkdownToHTML = (text: string) => {
      return text?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    };

    try {
      const response = await axios.post<APIResponse>(
        // `${API_CONFIG.baseURL}${API_CONFIG.chatEndpoint}`,
        `http://10.10.3.118:5678/webhook/NGUikh`,
        {
          message: message,
          sessionId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );
      const contentType = response.headers["content-type"] || "";

      if (response.status === 200) {
        if (!response.data) {
          throw new Error("No data in response");
        }

        // Fungsi bantu deteksi image
        const isImage = contentType.startsWith("image/");

        if (isImageResponse(response)) {
          // Tangani gambar (blob)
          const blob = new Blob([response.data as any], { type: contentType });
          const blobUrl = URL.createObjectURL(blob); // jangan pakai [blob] as unknown
          return blobUrl;
        } else {
          // Tangani JSON (string dari ArrayBuffer)
          try {
            const jsonString = new TextDecoder().decode(response.data as any);
            const jsonData = JSON.parse(jsonString);
            const responseData = Array.isArray(jsonData)
              ? jsonData[0]
              : jsonData;
            return (
              formatMarkdownToHTML(responseData?.output) ||
              "Received empty response"
            );
          } catch (err) {
            throw new Error("Failed to parse JSON response");
          }
        }
      } else {
        // Gagal status
        try {
          const jsonString = new TextDecoder().decode(response.data as any);
          const errorData = JSON.parse(jsonString);
          throw new Error(
            errorData?.message || "API returned unsuccessful response"
          );
        } catch (err) {
          throw new Error("API error but failed to parse error message");
        }
      }
    } catch (error) {
      console.error("API Error:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === "ECONNABORTED") {
          return "I apologize, but the request timed out. Please try again or contact our support team if the issue persists.";
        }

        if (axiosError.response) {
          // Server responded with error status
          const status = axiosError.response.status;
          switch (status) {
            case 400:
              return "I encountered an issue processing your request. Please try rephrasing your message.";
            case 401:
              return "Authentication required. Please log in to continue.";
            case 403:
              return "Access denied. Please contact support if you believe this is an error.";
            case 404:
              return "Service temporarily unavailable. Please try again later.";
            case 429:
              return "Too many requests. Please wait a moment before trying again.";
            case 500:
              return "Our servers are experiencing issues. Please try again in a few moments.";
            default:
              return `Service error (${status}). Please contact support if this continues.`;
          }
        } else if (axiosError.request) {
          // Network error
          return "Unable to connect to our services. Please check your internet connection and try again.";
        }
      }

      return "I encountered an unexpected error. Please try again or contact our support team.";
    }
  };
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isAiTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    const messageToSend = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsAiTyping(true);

    try {
      // Make API call
      const aiResponseContent = await sendMessageToAPI(messageToSend);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          aiResponseContent.split(":")[0] === "blob"
            ? "Image Generated"
            : aiResponseContent,
        sender: "ai",
        timestamp: new Date(),
        type: aiResponseContent.split(":")[0] === "blob" ? "image" : "text",
        imageUrl:
          aiResponseContent.split(":")[0] === "blob" ? aiResponseContent : "",
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      // Create error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team for immediate assistance.",
        sender: "ai",
        timestamp: new Date(),
        error: true,
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleQuickAction = async (action: {
    label: string;
    prompt: string;
    available: boolean;
  }) => {
    if (!action.available) {
      setShowComingSoonAlert(true);
      return;
    }

    if (isAiTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: action.prompt,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSidebarOpen(false);
    setIsAiTyping(true);

    try {
      // Make API call for quick actions
      const aiResponseContent = await sendMessageToAPI(action.prompt);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          aiResponseContent.split(":")[0] === "blob"
            ? "Image Generated"
            : aiResponseContent,
        sender: "ai",
        timestamp: new Date(),
        type: aiResponseContent.split(":")[0] === "blob" ? "image" : "text",
        imageUrl:
          aiResponseContent.split(":")[0] === "blob" ? aiResponseContent : "",
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      // Fallback responses for quick actions
      let response = "";

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "ai",
        timestamp: new Date(),
        error: true,
      };

      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleMicClick = () => {
    if (isAiTyping) return; // Prevent action when AI is typing
    setShowComingSoonAlert(true);
  };

  const handleEmergencyClick = () => {
    setShowComingSoonAlert(true);
  };

  const handleNavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowComingSoonAlert(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAiTyping) {
      handleSendMessage();
    }
  };

  const handleImagePreview = (imageUrl: string, prompt: string) => {
    setSelectedImage({ url: imageUrl, prompt });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Coming Soon Alert */}
      {showComingSoonAlert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-full max-w-md px-4">
          <Alert className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-blue-200/50 dark:border-blue-700/50 shadow-2xl rounded-2xl">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-gray-800 dark:text-gray-200 font-medium">
              🚀 This feature is coming soon! Stay tuned for updates.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${currentTheme.primary} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-pulse border-2 border-white dark:border-gray-800"></div>
                </div>
                <div>
                  <span
                    className={`text-xl font-bold bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}
                  >
                    Hospital Smart AI
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-700 dark:text-gray-300">
                    <Shield className="w-3 h-3" />
                    <span>Trusted Healthcare</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <nav className="hidden md:flex space-x-6">
                <a
                  href="#"
                  onClick={handleNavClick}
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-4 py-2 rounded-full hover:bg-white/10 dark:hover:bg-black/10"
                >
                  Services
                </a>
                <a
                  href="#"
                  onClick={handleNavClick}
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-4 py-2 rounded-full hover:bg-white/10 dark:hover:bg-black/10"
                >
                  Departments
                </a>
                <a
                  href="#"
                  onClick={handleNavClick}
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-4 py-2 rounded-full hover:bg-white/10 dark:hover:bg-black/10"
                >
                  Contact
                </a>
              </nav>
              <div onClick={(e) => e.stopPropagation()} className="relative">
                <ColorPicker
                  currentTheme={currentTheme}
                  onThemeChange={handleThemeChange}
                  isOpen={isColorPickerOpen}
                  onToggle={() => setIsColorPickerOpen(!isColorPickerOpen)}
                />
              </div>
              <ThemeToggle isDark={isDark} onToggle={handleDarkModeToggle} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8 h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)]">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden rounded-3xl"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Quick Actions Sidebar */}
          <div
            className={`
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
            w-80 lg:w-auto lg:col-span-1 
            transform transition-transform duration-300 ease-in-out
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
            pt-16 lg:pt-0
          `}
          >
            <div className="h-full lg:h-auto space-y-6 p-4 lg:p-0">
              <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-gray-200/30 dark:border-gray-700/30 shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 animate-pulse bg-gradient-to-r ${currentTheme.primary}`}
                    ></div>
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        disabled={isAiTyping && action.available}
                        className={`w-full justify-start h-auto p-4 backdrop-blur-md bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 border border-white/20 dark:border-white/10 transition-all duration-300 group rounded-2xl relative ${
                          !action.available ? "opacity-70" : ""
                        } ${
                          isAiTyping && action.available
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => handleQuickAction(action)}
                      >
                        <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <action.icon className={`w-5 h-5 ${action.color}`} />
                        </div>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {action.label}
                        </span>
                        {!action.available && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                            Soon
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-red-200/40 dark:border-red-700/40 shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                    Emergency
                  </h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                    For medical emergencies, call 911 or visit our Emergency
                    Department immediately.
                  </p>
                  <Button
                    onClick={handleEmergencyClick}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl h-12 font-semibold"
                  >
                    Emergency Contact
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-full backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Chat Header */}
                <div
                  className={`p-6 border-b border-white/20 dark:border-white/10 bg-gradient-to-r ${currentTheme.primary} bg-opacity-20 backdrop-blur-xl rounded-t-3xl`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${currentTheme.primary} rounded-3xl flex items-center justify-center shadow-lg`}
                      >
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white dark:border-gray-800 animate-pulse"></div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Virtual Health Assistant
                      </h2>
                      <p className="text-gray-800 dark:text-gray-100">
                        {isAiTyping
                          ? "AI is thinking..."
                          : "How can we help you today?"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6 max-h-[calc(100vh-27rem)]">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-start space-x-6 max-w-[85%] sm:max-w-[80%] ${
                            message.sender === "user"
                              ? "flex-row-reverse space-x-reverse"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                              message.sender === "user"
                                ? `bg-gradient-to-br ${currentTheme.primary}`
                                : `bg-gradient-to-br ${currentTheme.secondary}`
                            }`}
                          >
                            {message.sender === "user" ? (
                              <User className="w-5 h-5 text-white" />
                            ) : (
                              <Bot className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div
                            className={`rounded-3xl px-6 py-4 shadow-lg backdrop-blur-lg border transition-all duration-300 hover:shadow-xl ${
                              message.sender === "user"
                                ? `bg-gradient-to-br ${currentTheme.primary} bg-opacity-80 text-white border-white/30`
                                : "bg-white/20 dark:bg-black/20 text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10"
                            }`}
                          >
                            <div
                              className="whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: convertMarkdownToHTML(message.content),
                              }}
                            />
                            {message.type === "image" && message.imageUrl && (
                              <div className="mt-3">
                                <div
                                  className="relative w-full h-48 rounded-lg overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() =>
                                    handleImagePreview(
                                      message.imageUrl!,
                                      message.prompt || "Generated image"
                                    )
                                  }
                                >
                                  <Image
                                    src={message.imageUrl || "/placeholder.svg"}
                                    alt="Generated image"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                    onError={(e) => {
                                      console.log(
                                        "Image failed to load:",
                                        message.imageUrl
                                      );
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                  <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                                    <div class="text-center">
                                      <div class="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p class="text-sm">Image Preview</p>
                                    </div>
                                  </div>
                                `;
                                      }
                                    }}
                                  />
                                  {/* Overlay for hover effect */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                                      <Eye className="w-5 h-5 text-gray-700" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-xs opacity-75">
                                      Generated Image
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleImagePreview(
                                        message.imageUrl!,
                                        message.prompt || "Generated image"
                                      )
                                    }
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            )}
                            <p
                              className={`text-xs mt-3 ${
                                message.sender === "user"
                                  ? "text-white/70"
                                  : "text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* AI Typing Indicator */}
                    {isAiTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-6 max-w-[85%] sm:max-w-[80%]">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br ${currentTheme.secondary}`}
                          >
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="rounded-3xl px-6 py-4 shadow-lg backdrop-blur-lg border bg-white/20 dark:bg-black/20 border-white/30 dark:border-white/10">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-300 ml-2">
                                AI is thinking...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-6 border-t border-gray-200/30 dark:border-gray-700/30 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-b-3xl">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={
                          isAiTyping
                            ? "Please wait, AI is thinking..."
                            : "Type your message here..."
                        }
                        disabled={isAiTyping}
                        className={`pr-14 h-12 backdrop-blur-md bg-white/60 dark:bg-gray-700/60 border border-gray-200/40 dark:border-gray-600/40 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-full transition-all duration-300 ${
                          isAiTyping ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onKeyPress={handleKeyPress}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMicClick}
                        disabled={isAiTyping}
                        className={`absolute right-1 top-1/2 transform -translate-y-1/2 backdrop-blur-md bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-all duration-300 ${
                          isAiTyping ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Mic className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      className={`backdrop-blur-md bg-white/10 dark:bg-black/10 bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 rounded-full w-12 h-12`}
                      disabled={!inputValue.trim() || isAiTyping}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-4 text-center">
                    {isAiTyping
                      ? "Please wait while the AI processes your request..."
                      : "This assistant can help with appointments, information, and connecting you with our medical staff."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Image Preview Modal */}
        {selectedImage && (
          <ImagePreviewModal
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
            imageUrl={selectedImage.url}
            prompt={selectedImage.prompt}
          />
        )}
      </div>
    </div>
  );
}
