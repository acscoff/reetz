import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import App_Main from './pages/App_Main'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupère la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--offwhite)' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'var(--black)' }}>
        reetz<span style={{ color:'var(--pink)' }}>.</span>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/onboarding" element={session && !profile ? <Onboarding onDone={p => setProfile(p)} /> : <Navigate to="/" />} />
      <Route path="/*" element={
        !session ? <Navigate to="/login" /> :
        !profile ? <Navigate to="/onboarding" /> :
        <App_Main profile={profile} session={session} />
      } />
    </Routes>
  )
}