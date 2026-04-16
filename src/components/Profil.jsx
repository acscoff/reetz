import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Profil({ profile, session }) {
  const [group, setGroup]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [joinCode, setJoinCode]   = useState('')
  const [groupName, setGroupName] = useState('')
  const [action, setAction]       = useState('') // 'create' | 'join'
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  useEffect(() => { fetchGroup() }, [])

  async function fetchGroup() {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', profile.id)
      .single()
    if (data) setGroup(data.groups)
    setLoading(false)
  }

  async function createGroup(e) {
    e.preventDefault()
    setError('')
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: g, error: ge } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), code, created_by: profile.id })
      .select().single()
    if (ge) { setError(ge.message); return }
    await supabase.from('group_members').insert({ group_id: g.id, user_id: profile.id })
    setGroup(g)
    setAction('')
    setSuccess('Bande créée ! Partage le code avec tes amis 🎉')
  }

  async function joinGroup(e) {
    e.preventDefault()
    setError('')
    const { data: g, error: ge } = await supabase
      .from('groups')
      .select()
      .eq('code', joinCode.trim().toUpperCase())
      .single()
    if (ge || !g) { setError('Code invalide — vérifie et réessaie'); return }
    const { error: me } = await supabase
      .from('group_members')
      .insert({ group_id: g.id, user_id: profile.id })
    if (me) { setError('Tu es déjà dans cette bande !'); return }
    setGroup(g)
    setAction('')
    setSuccess('Tu as rejoint la bande 🔥')
  }

  async function copyCode() {
    if (!group) return
    await navigator.clipboard.writeText(group.code)
    setSuccess('Code copié ! 📋')
    setTimeout(() => setSuccess(''), 2000)
  }

  if (loading) return <div style={{ padding:20, color:'var(--muted)', fontSize:13 }}>Chargement…</div>

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>

      {/* Header */}
      <div style={{ padding:'12px 14px 10px', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>Mon profil</div>
        <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>Espace personnel</div>
      </div>

      <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>

        {/* Profil card */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--pink)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'#fff', flexShrink:0 }}>
            {profile.username.substring(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:800, color:'var(--black)' }}>@{profile.username}</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{session.user.email}</div>
            <div style={{ fontSize:10, color:'var(--pink)', marginTop:2, fontWeight:700 }}>🔥 {profile.streak || 0} jours de streak</div>
          </div>
        </div>

        {/* Messages */}
        {error   && <div style={{ fontSize:12, color:'var(--pink)', background:'rgba(255,46,154,0.07)', borderRadius:8, padding:'8px 12px' }}>{error}</div>}
        {success && <div style={{ fontSize:12, color:'#1ECC82', background:'rgba(30,204,130,0.07)', borderRadius:8, padding:'8px 12px' }}>{success}</div>}

        {/* Section bande */}
        {group ? (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Ma bande</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:'var(--black)', marginBottom:8 }}>{group.name}</div>
            {/* Code à partager */}
            <div style={{ background:'var(--black)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={copyCode}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'.1em', marginBottom:2 }}>CODE D'INVITATION</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'var(--lime)', letterSpacing:4 }}>{group.code}</div>
              </div>
              <div style={{ fontSize:20 }}>📋</div>
            </div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:8, textAlign:'center' }}>
              Appuie sur le code pour le copier et le partager à tes amis
            </div>
          </div>
        ) : (
          /* Pas de bande */
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Ma bande</div>

            {!action && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4, textAlign:'center' }}>Tu n'es dans aucune bande pour l'instant</div>
                <button onClick={() => setAction('create')} style={btnStyle}>Créer une bande</button>
                <button onClick={() => setAction('join')} style={{ ...btnStyle, background:'var(--offwhite)', color:'var(--black)', border:'1.5px solid var(--border2)' }}>
                  Rejoindre avec un code
                </button>
              </div>
            )}

            {action === 'create' && (
              <form onSubmit={createGroup} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nom de ta bande…"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  required
                  style={inputStyle}
                />
                <button type="submit" style={btnStyle}>Créer 🔥</button>
                <span onClick={() => setAction('')} style={{ textAlign:'center', fontSize:12, color:'var(--muted)', cursor:'pointer' }}>← Retour</span>
              </form>
            )}

            {action === 'join' && (
              <form onSubmit={joinGroup} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Code à 6 lettres…"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  required
                  maxLength={6}
                  style={{ ...inputStyle, textTransform:'uppercase', letterSpacing:4, textAlign:'center', fontSize:20 }}
                />
                <button type="submit" style={btnStyle}>Rejoindre →</button>
                <span onClick={() => setAction('')} style={{ textAlign:'center', fontSize:12, color:'var(--muted)', cursor:'pointer' }}>← Retour</span>
              </form>
            )}
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background:'transparent', border:'1px solid var(--border2)', borderRadius:10, padding:'10px', fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, color:'var(--muted)', cursor:'pointer' }}
        >
          Se déconnecter
        </button>

      </div>
    </div>
  )
}

const inputStyle = {
  background:'var(--offwhite)', border:'1.5px solid var(--border2)', borderRadius:10,
  padding:'10px 12px', fontSize:13, color:'var(--black)', outline:'none', width:'100%',
  fontFamily:'Inter,sans-serif',
}

const btnStyle = {
  background:'var(--black)', color:'var(--lime)', border:'none', borderRadius:12,
  padding:'12px', fontSize:13, fontWeight:800, fontFamily:'Syne,sans-serif', cursor:'pointer',
}