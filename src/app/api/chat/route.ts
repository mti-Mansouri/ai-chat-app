import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()
  const latestMessage = messages[messages.length - 1]

  // 1. Setup Supabase Server Client
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { 
          try { cookieStore.set({ name, value, ...options }) } catch {} 
        },
        remove(name: string, options: CookieOptions) { 
          try { cookieStore.delete({ name, ...options }) } catch {} 
        },
      },
    }
  )

  // 2. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 3. Fetch History (Memory)
  // We fetch this BEFORE inserting the new message so we don't get duplicates in context
  let systemContext = "You are a helpful AI assistant. You remember previous details."
  
  try {
    const { data: dbHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) // Latest first
      .limit(20)

    if (dbHistory && dbHistory.length > 0) {
      // Reverse to chronological order (Oldest -> Newest)
      const conversationLog = dbHistory.reverse().map((m: any) => 
        `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`
      ).join('\n')

      systemContext += `\n\nPREVIOUS CONVERSATION HISTORY:\n---\n${conversationLog}\n---\n`
    }
  } catch (err) {
    console.error("History fetch failed:", err)
  }

  // 4. Save USER Message to DB
  try {
    await supabase.from('messages').insert({
      user_id: user.id,
      role: 'user',
      content: latestMessage.content
    })
  } catch (err) {
    console.error("Failed to save user message:", err)
  }

  // 5. Process Image Tags
  let userContent: any = latestMessage.content
  if (typeof userContent === 'string' && userContent.includes('[Image:')) {
      const parts = userContent.split('[Image:')
      const text = parts[0].trim()
      const imageUrl = parts[1].replace(']', '').trim()
      
      userContent = [
        { type: 'text', text: text || 'Analyze this image' },
        { type: 'image', image: new URL(imageUrl) }
      ]
  }

  // 6. Generate & Stream Response
  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemContext,
    messages: [
      { role: 'user', content: userContent }
    ],
    // 7. Save AI Message to DB
    onFinish: async (completion) => {
      try {
        await supabase.from('messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: completion.text,
        })
      } catch (e) {
        console.error("Failed to save AI response:", e)
      }
    }
  })

  return result.toTextStreamResponse()
}