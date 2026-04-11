import { useState } from 'react'
import { supabase } from '../supabase'

export default function Onboarding({ onDone }) {
  const [step, setStep]         = useState(1) // 1=username, 2=groupe
  const [username, setUsername] = useState('')
  const [groupAction, setGroupAction] = useState('') // 'create' ou 'join'
  const [groupName, setGroupName]     = useState('')
  const [groupCode, setGroupCode]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleUsername(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, username: username.trim().toLowerCase() })
      .select()
      .single()
    if (error) { setError(error.message); setLoading(false); return }
    setStep(2)
    setLoading(false)
  }

  async function handleGroup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    if (groupAction === 'create') {
      // Générer un code unique à 6 lettres
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data: group, error: ge } = await supabase
        .from('groups')
        .insert({ name: groupName.trim(), code, created_by: user.id })
        .select()
        .single()
      if (ge) { setError(ge.message); setLoading(false); return }
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
    } else {
      // Rejoindre avec un code
      const { data: group, error: ge } = await supabase
        .from('groups')
        .select()
        .eq('code', groupCode.trim().toUpperCase())
        .single()
      if (ge || !group) { setError('Code invalide'); setLoading(false); return }
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
    }

    // Récupère le profil final
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    onDone(profile)
    setLoading(false)
  }

  return (
    <div style={{
      height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--offwhite)', padding:24
    }}>
      <div style={{ width:'100%', maxWidth:360 }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800, color:'var(--black)' }}>
            reetz<span style={{ color:'var(--pink)' }}>.</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleUsername} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'var(--black)', marginBottom:4 }}>
              Choisis ton pseudo
            </div>
            <input
              type="text"
              placeholder="ex: lucie_m"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              maxLength={20}
              style={inputStyle}
            />
            {error && <div style={{ fontSize:12, color:'var(--pink)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? '...' : 'Continuer →'}
            </button>
          </form>
        )}

        {step === 2 && !groupAction && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'var(--black)', marginBottom:4 }}>
              Ta bande
            </div>
            <button onClick={() => setGroupAction('create')} style={btnStyle}>
              Créer une bande
            </button>
            <button onClick={() => setGroupAction('join')} style={{ ...btnStyle, background:'var(--card)', color:'var(--black)', border:'1.5px solid var(--border2)' }}>
              Rejoindre avec un code
            </button>
          </div>
        )}

        {step === 2 && groupAction === 'create' && (
          <form onSubmit={handleGroup} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'var(--black)', marginBottom:4 }}>
              Nom de ta bande
            </div>
            <input
              type="text"
              placeholder="ex: Les Motivés"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required
              style={inputStyle}
            />
            {error && <div style={{ fontSize:12, color:'var(--pink)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? '...' : 'Créer la bande 🔥'}
            </button>
            <span onClick={() => setGroupAction('')} style={{ textAlign:'center', fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
              ← Retour
            </span>
          </form>
        )}

        {step === 2 && groupAction === 'join' && (
          <form onSubmit={handleGroup} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'var(--black)', marginBottom:4 }}>
              Code de la bande
            </div>
            <input
              type="text"
              placeholder="ex: ABC123"
              value={groupCode}
              onChange={e => setGroupCode(e.target.value)}
              required
              maxLength={6}
              style={{ ...inputStyle, textTransform:'uppercase', letterSpacing:4, textAlign:'center', fontSize:20 }}
            />
            {error && <div style={{ fontSize:12, color:'var(--pink)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? '...' : 'Rejoindre →'}
            </button>
            <span onClick={() => setGroupAction('')} style={{ textAlign:'center', fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
              ← Retour
            </span>
          </form>
        )}

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
}