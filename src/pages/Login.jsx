import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--offwhite)', padding:24
    }}>
      <div style={{ width:'100%', maxWidth:360 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:42, fontWeight:800, color:'var(--black)', lineHeight:1 }}>
            reetz<span style={{ color:'var(--pink)' }}>.</span>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:8 }}>
            {isSignup ? 'Crée ton compte' : 'Bon retour 👋'}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <div style={{ fontSize:12, color:'var(--pink)', textAlign:'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {/* Toggle signup/login */}
        <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--muted)' }}>
          {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <span
            onClick={() => { setIsSignup(!isSignup); setError('') }}
            style={{ color:'var(--pink)', fontWeight:700, cursor:'pointer' }}
          >
            {isSignup ? 'Se connecter' : 'Créer un compte'}
          </span>
        </div>

      </div>
    </div>
  )
}

const inputStyle = {
  background:'var(--card)',
  border:'1.5px solid var(--border2)',
  borderRadius:12,
  padding:'12px 14px',
  fontSize:14,
  color:'var(--black)',
  outline:'none',
  width:'100%',
  fontFamily:'Inter,sans-serif',
}

const btnStyle = {
  background:'var(--black)',
  color:'var(--lime)',
  border:'none',
  borderRadius:12,
  padding:'14px',
  fontSize:14,
  fontWeight:800,
  fontFamily:'Syne,sans-serif',
  cursor:'pointer',
  marginTop:4,
}