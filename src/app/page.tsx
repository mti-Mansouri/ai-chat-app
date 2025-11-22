'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Send, Paperclip, LogOut, Bot, Loader2 } from 'lucide-react'

// --- Custom Hook to replace 'ai/react' ---
// This ensures the app works in the preview environment without external dependencies
function useCustomChat({ api }: { api: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { id: Date.now().toString(), role: 'user', content: input, createdAt: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!response.body) throw new Error('No response body')

      // Simple text decoder for streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', createdAt: new Date() }
      
      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantMessage.content += chunk
        
        setMessages(prev => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1] = { ...assistantMessage }
          return newMsgs
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback for demo if API isn't running
      const errorMessage = { 
        id: (Date.now() + 2).toString(), 
        role: 'assistant', 
        content: "I'm having trouble connecting to the AI right now. Please check if your API key is set and the server is running.", 
        createdAt: new Date() 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, input, handleInputChange, handleSubmit }
}

export default function ChatPage() {
  // Inline Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [user, setUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use Custom Hook
  const { messages, input, handleInputChange, handleSubmit } = useCustomChat({
    api: '/api/chat', 
  })

  // 1. Check Authentication on Load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Use window location for redirect in preview
        window.location.href = '/auth'
      } else {
        setUser(session.user)
      }
      setLoadingAuth(false)
    }
    checkUser()
  }, [])

  // 2. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Handle Image Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return
    const file = e.target.files[0]
    setIsUploading(true)

    try {
      // Create a unique file path: userId/timestamp.ext
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images') // Make sure this bucket exists and is Public
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get Public URL
      const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName)

      // Hack: Append image URL to the text input so the AI 'sees' it
      // We will parse this tag in the API route
      const syntheticEvent = {
        target: { value: input + ` [Image: ${data.publicUrl}]` }
      } as React.ChangeEvent<HTMLInputElement>
      handleInputChange(syntheticEvent)

    } catch (error: any) {
      alert('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loadingAuth) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-green-700" /></div>
  if (!user) return null

  return (
    <div className="flex h-screen flex-col bg-[#efeae2]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#008069] p-4 text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-2">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold">AI Assistant</h1>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></span>
              <p className="text-xs text-green-100 opacity-90">Online</p>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="rounded-full p-2 hover:bg-white/10 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat p-4">
        <div className="flex flex-col space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user'
            // Check for our special image tag
            const imageMatch = m.content.match(/\[Image: (.*?)\]/)
            const imageUrl = imageMatch ? imageMatch[1] : null
            const textContent = m.content.replace(/\[Image: .*?\]/, '').trim()

            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative max-w-[85%] rounded-lg p-2 shadow-sm ${
                    isUser ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                  }`}
                >
                  {imageUrl && (
                    <div className="mb-2 overflow-hidden rounded-lg border border-black/10">
                      <img src={imageUrl} alt="Uploaded content" className="h-auto w-full object-cover" />
                    </div>
                  )}
                  {textContent && <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{textContent}</p>}
                  
                  <span className="mt-1 block text-right text-[10px] text-gray-500 opacity-70">
                    {m.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2 bg-[#f0f2f5] p-2 pb-6 md:pb-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full p-3 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Paperclip size={24} />}
        </button>

        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            className="flex-1 rounded-lg border-none bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[#008069]"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-[#008069] p-3 text-white shadow-sm transition-colors hover:bg-[#006d59] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}