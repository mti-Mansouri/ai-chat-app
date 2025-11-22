// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { createClient } from '@/lib/supabaseClient'
// import { Loader2, Stethoscope } from 'lucide-react'

// export default function AuthPage() {
//   const router = useRouter()
//   const supabase = createClient()

//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

//   // --- 1. Handle Email/Password Login ---
//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setMessage(null)

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     })

//     if (error) {
//       setMessage({ text: error.message, type: 'error' })
//       setLoading(false)
//     } else {
//       router.replace('/') 
//     }
//   }

//   // --- 2. Handle Google Login ---
//   const handleGoogleLogin = async () => {
//     setLoading(true)
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`,
//       },
//     })

//     if (error) {
//       setMessage({ text: error.message, type: 'error' })
//       setLoading(false)
//     }
//     // Note: No need to set loading false on success, as the page redirects
//   }

//   // --- 3. Handle Sign Up ---
//   const handleSignUp = async () => {
//     setLoading(true)
//     setMessage(null)

//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         emailRedirectTo: `${window.location.origin}/auth/callback`,
//       },
//     })

//     if (error) {
//       setMessage({ text: error.message, type: 'error' })
//     } else {
//       setMessage({ text: 'Check your email for the confirmation link!', type: 'success' })
//     }
//     setLoading(false)
//   }

//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
//       <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
        
//         {/* Header */}
//         <div className="mb-8 flex flex-col items-center text-center">
//           <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
//             <Stethoscope size={28} />
//           </div>
//           <h1 className="text-2xl font-bold text-slate-800">MediChat AI</h1>
//           <p className="text-sm text-slate-500">Sign in to access your health assistant</p>
//         </div>

//         {/* Error/Success Messages */}
//         {message && (
//           <div className={`mb-4 rounded-lg p-3 text-sm text-center ${
//             message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
//           }`}>
//             {message.text}
//           </div>
//         )}

//         <div className="space-y-4">
//           {/* Google Button */}
//           <button
//             onClick={handleGoogleLogin}
//             disabled={loading}
//             className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
//           >
//             {/* Google Icon SVG */}
//             <svg className="h-5 w-5" viewBox="0 0 24 24">
//               <path
//                 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                 fill="#4285F4"
//               />
//               <path
//                 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                 fill="#34A853"
//               />
//               <path
//                 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                 fill="#FBBC05"
//               />
//               <path
//                 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                 fill="#EA4335"
//               />
//             </svg>
//             Continue with Google
//           </button>

//           {/* Divider */}
//           <div className="relative flex items-center py-2">
//             <div className="flex-grow border-t border-slate-200"></div>
//             <span className="mx-4 flex-shrink-0 text-xs text-slate-400">OR</span>
//             <div className="flex-grow border-t border-slate-200"></div>
//           </div>

//           {/* Email Form */}
//           <form onSubmit={handleLogin} className="space-y-4">
//             <div>
//               <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
//                 placeholder="name@example.com"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
//                 placeholder="••••••••"
//                 required
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
//             >
//               {loading && <Loader2 className="animate-spin" size={16} />}
//               {loading ? 'Processing...' : 'Sign In with Email'}
//             </button>
//           </form>
//         </div>

//         <div className="mt-6 text-center">
//           <p className="text-sm text-slate-500">
//             Don't have an account?{' '}
//             <button 
//               onClick={handleSignUp} 
//               disabled={loading}
//               className="font-medium text-blue-600 hover:underline"
//             >
//               Sign Up
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Loader2, Stethoscope, Users, Award, ArrowRight, ShieldCheck } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage({ text: error.message, type: 'error' })
      setLoading(false)
    } else {
      router.replace('/') 
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setMessage({ text: error.message, type: 'error' })
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Check your email for the confirmation link!', type: 'success' })
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* --- LEFT SIDE: Presentation / Team Info --- */}
      <div className="hidden w-1/2 flex-col justify-between bg-blue-600 p-12 text-white lg:flex relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500 opacity-50 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-emerald-500 opacity-30 blur-3xl"></div>

        {/* Header Info */}
        <div className="relative z-10 animate-[fadeInUp_0.6s_ease-out]">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <Stethoscope size={32} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-800/50 px-3 py-1 text-xs font-medium text-blue-200 border border-blue-400/30 mb-4">
            <Award size={12} /> Agentic AI Challenge
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight mb-4">
            Reply Challenge <br/> of Healthcare
          </h1>
          <p className="text-lg text-blue-100 max-w-md leading-relaxed opacity-90">
            Experience the next generation of patient care. 
            Our <span className="font-bold text-white">NexusCare</span> leverages advanced AI to decode medical records and provide real-time health assistance.
          </p>
        </div>

        {/* Team Section */}
        <div className="relative z-10 mt-12 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-300">
            <Users size={16} />
            Engineered by Team 25
          </div>
          <div className="space-y-4 border-l-2 border-white/20 pl-6">
            <div className="group flex items-center gap-3 transition-all hover:translate-x-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
              <span className="text-xl font-medium">Mehdi Mansouri</span>
            </div>
            <div className="group flex items-center gap-3 transition-all hover:translate-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-300"></div>
              <span className="text-xl font-medium">Matin Salami</span>
            </div>
            <div className="group flex items-center gap-3 transition-all hover:translate-x-2">
              <div className="h-2 w-2 rounded-full bg-indigo-300"></div>
              <span className="text-xl font-medium">Matin Zomorrodabedi</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-300/60 animate-[fadeInUp_1s_ease-out_0.4s_both]">
          © 2025 Team 25. All rights reserved.
        </div>
      </div>

      {/* --- RIGHT SIDE: Auth Form --- */}
      <div className="flex w-full flex-col justify-center bg-slate-50 p-8 lg:w-1/2 lg:p-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-slate-500">Please sign in to access the Patient Portal.</p>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg p-4 text-sm flex items-start gap-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              {message.text}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-4 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="relative">Continue with Google</span>
          </button>

          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-4 flex-shrink-0 text-xs font-semibold uppercase text-slate-400">Or continue with email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 disabled:opacity-70 disabled:shadow-none"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  Sign In <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account yet?{' '}
            <button 
              onClick={handleSignUp} 
              disabled={loading}
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign Up for access
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}