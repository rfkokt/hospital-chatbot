"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Palette, Check } from "lucide-react"

interface ColorTheme {
  name: string
  primary: string
  secondary: string
  accent: string
  gradient: string
}

const colorThemes: ColorTheme[] = [
  {
    name: "Ocean Blue",
    primary: "from-blue-500 to-cyan-500",
    secondary: "from-green-400 to-emerald-500",
    accent: "bg-blue-500",
    gradient: "from-blue-50 via-cyan-50 to-green-50",
  },
  {
    name: "Forest Green",
    primary: "from-green-500 to-emerald-500",
    secondary: "from-teal-400 to-green-500",
    accent: "bg-green-500",
    gradient: "from-green-50 via-emerald-50 to-teal-50",
  },
  {
    name: "Sunset Orange",
    primary: "from-orange-500 to-red-500",
    secondary: "from-yellow-400 to-orange-500",
    accent: "bg-orange-500",
    gradient: "from-orange-50 via-red-50 to-yellow-50",
  },
  {
    name: "Purple Dream",
    primary: "from-purple-500 to-pink-500",
    secondary: "from-indigo-400 to-purple-500",
    accent: "bg-purple-500",
    gradient: "from-purple-50 via-pink-50 to-indigo-50",
  },
  {
    name: "Rose Gold",
    primary: "from-pink-500 to-rose-500",
    secondary: "from-rose-400 to-pink-500",
    accent: "bg-pink-500",
    gradient: "from-pink-50 via-rose-50 to-red-50",
  },
  {
    name: "Midnight Blue",
    primary: "from-slate-600 to-blue-600",
    secondary: "from-indigo-500 to-slate-600",
    accent: "bg-slate-600",
    gradient: "from-slate-50 via-blue-50 to-indigo-50",
  },
]

interface ColorPickerProps {
  currentTheme: ColorTheme
  onThemeChange: (theme: ColorTheme) => void
  isOpen: boolean
  onToggle: () => void
}

export function ColorPicker({ currentTheme, onThemeChange, isOpen, onToggle }: ColorPickerProps) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 rounded-full w-12 h-12"
      >
        <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={onToggle} />
          <Card className="absolute top-14 right-0 w-80 backdrop-blur-xl bg-white/90 dark:bg-black/90 border border-white/30 dark:border-white/10 shadow-2xl rounded-3xl z-[100]">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Choose Theme Color</h3>
              <div className="grid grid-cols-2 gap-3">
                {colorThemes.map((theme, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-2xl transition-all duration-300 group relative"
                    onClick={() => {
                      onThemeChange(theme)
                      onToggle()
                    }}
                  >
                    {currentTheme.name === theme.name && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex space-x-1">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${theme.primary} shadow-lg`}></div>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${theme.secondary} shadow-lg`}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {theme.name}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-white/20 dark:bg-black/20">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  Current: <span className="font-semibold text-gray-800 dark:text-gray-200">{currentTheme.name}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
