'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, LogOut, Stethoscope, Loader2, Activity } from 'lucide-react'
// FIX: Import from your local lib file using a relative path to avoid resolution errors
import { createClient } from '../lib/supabaseClient'

// --- Custom Chat Hook ---
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

    // 1. Optimistic UI Update (Show user message immediately)
    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input, 
      createdAt: new Date() 
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 2. Send to Server (Server will save User Message + Generate AI Response + Save AI Response)
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // We send the conversation context, but the server prefers its DB memory
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!response.body) throw new Error('No response body')

      // 3. Stream Response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: '', 
        createdAt: new Date() 
      }
      
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
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "I'm having trouble connecting to the Health Assistant. Please check your connection.", 
        createdAt: new Date() 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, input, handleInputChange, handleSubmit, setMessages }
}

export default function ChatPage() {
  // Initialize Supabase Client using your existing helper
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useCustomChat({
    api: '/api/chat',
  })

  // 1. Authentication & Load History
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)

        // Fetch History from DB
        const { data: history, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true })

        if (error) console.error("Error fetching history:", error)

        if (history) {
          setMessages(history.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.created_at)
          })))
        }
      } else {
        // Redirect if not logged in
        if (typeof window !== 'undefined') window.location.href = '/auth'
      }
      setLoadingAuth(false)
    }
    checkUser()
  }, [])

  // 2. Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Handle Image Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return
    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName)
      
      // Append image URL to text input for user to send
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

  if (loadingAuth) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-blue-600">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium">Loading Health Assistant...</p>
      </div>
    </div>
  )
  
  if (!user) return null

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Healthcare Header */}
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Stethoscope size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">MediChat AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-medium text-slate-500">Medical Assistant Online</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Chat Area - Clean Clinical Look */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
        <div className="mx-auto max-w-3xl flex flex-col space-y-6">
          {messages.length === 0 && (
            <div className="mt-10 text-center opacity-50">
              <Activity className="mx-auto mb-2 text-blue-300" size={48} />
              <p className="text-slate-500">How can I help with your health today?</p>
            </div>
          )}
          
          {messages.map((m) => {
            const isUser = m.role === 'user'
            const imageMatch = m.content.match(/\[Image: (.*?)\]/)
            const imageUrl = imageMatch ? imageMatch[1] : null
            const textContent = m.content.replace(/\[Image: .*?\]/, '').trim()

            return (
              <div key={m.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] sm:max-w-[75%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`relative rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed
                      ${isUser 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                      }`}
                  >
                    {imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                        <img src={imageUrl} alt="Uploaded content" className="h-auto w-full object-cover" />
                      </div>
                    )}
                    {textContent && <p className="whitespace-pre-wrap">{textContent}</p>}
                  </div>
                  
                  <span className="mt-1.5 text-[10px] font-medium text-slate-400 px-1">
                    {m.role === 'assistant' ? 'MediChat • ' : 'You • '}
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 py-4 border-t border-slate-200">
        <div className="mx-auto max-w-3xl flex items-end gap-3">
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
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors
              ${isUploading 
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            title="Upload Medical Record/Image"
          >
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} />}
          </button>

          <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your health query..."
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}