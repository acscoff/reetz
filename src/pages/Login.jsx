import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [isSignup, setIsSignup]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [forgotPwd, setForgotPwd] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (forgotPwd) {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setError(error.message)
      else setSuccess('Email envoyé ! Vérifie ta boîte mail et tes spams 📬')
      setLoading(false)
      return
    }

    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else if (isSignup) {
      setSuccess('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse. Pense à regarder tes spams 📬')
    }
    setLoading(false)
  }

  return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--offwhite)', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:42, fontWeight:800, color:'var(--black)', lineHeight:1 }}>
            reetz<span style={{ color:'var(--pink)' }}>.</span>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:8 }}>
            {forgotPwd ? 'Récupère ton mot de passe' : isSignup ? 'Crée ton compte' : 'Bon retour 👋'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          {!forgotPwd && (
            <div style={{ position:'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight:44 }}
              />
              <div
                onClick={() => setShowPwd(!showPwd)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:16, userSelect:'none' }}
              >
                {showPwd ? '🙈' : '👁️'}
              </div>
            </div>
          )}

          {error   && <div style={{ fontSize:12, color:'var(--pink)', textAlign:'center', background:'rgba(255,46,154,0.07)', borderRadius:8, padding:'8px 12px' }}>{error}</div>}
          {success && <div style={{ fontSize:12, color:'#1ECC82', textAlign:'center', background:'rgba(30,204,130,0.07)', borderRadius:8, padding:'8px 12px', lineHeight:1.5 }}>{success}</div>}

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : forgotPwd ? 'Envoyer le lien' : isSignup ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {/* Mot de passe oublié */}
        {!isSignup && !forgotPwd && (
          <div style={{ textAlign:'center', marginTop:12 }}>
            <span onClick={() => { setForgotPwd(true); setError(''); setSuccess('') }}
              style={{ fontSize:12, color:'var(--muted)', cursor:'pointer', textDecoration:'underline' }}>
              Mot de passe oublié ?
            </span>
          </div>
        )}

        {/* Toggle signup/login */}
        {!forgotPwd && (
          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
            {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <span onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess('') }}
              style={{ color:'var(--pink)', fontWeight:700, cursor:'pointer' }}>
              {isSignup ? 'Se connecter' : 'Créer un compte'}
            </span>
          </div>
        )}

        {forgotPwd && (
          <div style={{ textAlign:'center', marginTop:16 }}>
            <span onClick={() => { setForgotPwd(false); setError(''); setSuccess('') }}
              style={{ fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
              ← Retour à la connexion
            </span>
          </div>
        )}

      </div>
    </div>
  )
}

const inputStyle = {
  background:'var(--card)', border:'1.5px solid var(--border2)', borderRadius:12,
  padding:'12px 14px', fontSize:14, color:'var(--black)', outline:'none', width:'100%',
  fontFamily:'Inter,sans-serif',
}

const btnStyle = {
  background:'var(--black)', color:'var(--lime)', border:'none', borderRadius:12,
  padding:'14px', fontSize:14, fontWeight:800, fontFamily:'Syne,sans-serif', cursor:'pointer', marginTop:4,
}