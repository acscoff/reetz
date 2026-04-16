import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ENCOURAGEMENTS = [
  'YOU GOT THIS! 💪',
  'ALLEZ ! 🔥',
  'T\'ES CAPABLE ! ⚡',
  'LÂCHE RIEN ! 🎯',
  'ON CROIT EN TOI ! ✨',
]

const REACTIONS = ['❤️', '🔥', '💪', '😂', '🎉']

export default function Bande({ profile }) {
  const [members, setMembers]           = useState([])
  const [group, setGroup]               = useState(null)
  const [tasks, setTasks]               = useState([])
  const [photos, setPhotos]             = useState([])
  const [encouragements, setEncouragements] = useState([])
  const [reactions, setReactions]       = useState([])
  const [comments, setComments]         = useState([])
  const [openComment, setOpenComment]   = useState(null)
  const [newComment, setNewComment]     = useState('')
  const [loading, setLoading]           = useState(true)

  function getTodayStr() {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
  }

  const TODAY  = getTodayStr()
  const COLORS = ['#FF2E9A','#00E5FF','#CFFF04','#FF6B00','#BF00FF']

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', profile.id)
      .single()

    if (!membership) { setLoading(false); return }
    setGroup(membership.groups)

    const { data: membersData } = await supabase
      .from('group_members')
      .select('user_id, profiles(*)')
      .eq('group_id', membership.group_id)

    setMembers(membersData || [])
    const memberIds = (membersData || []).map(m => m.user_id)

    const [tasksRes, photosRes, encRes] = await Promise.all([
      supabase.from('tasks').select('*').in('user_id', memberIds).eq('type', 'today').eq('date', TODAY),
      supabase.from('photos').select('*').in('user_id', memberIds).eq('date', TODAY),
      supabase.from('encouragements').select('*').in('to_user', memberIds).eq('date', TODAY),
    ])

    setTasks(tasksRes.data || [])
    setPhotos(photosRes.data || [])
    setEncouragements(encRes.data || [])

    // Réactions et commentaires sur les photos du jour
    const photoIds = (photosRes.data || []).map(p => p.id)
    if (photoIds.length > 0) {
      const [reactRes, commRes] = await Promise.all([
        supabase.from('reactions').select('*').in('photo_id', photoIds),
        supabase.from('comments').select('*, profiles(username)').in('photo_id', photoIds).order('created_at'),
      ])
      setReactions(reactRes.data || [])
      setComments(commRes.data || [])
    }

    setLoading(false)

    // Temps réel
    supabase.channel('realtime-bande')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refreshTasks(memberIds))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => refreshPhotos(memberIds))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encouragements' }, () => refreshEnc(memberIds))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => refreshReactions(memberIds))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => refreshComments(memberIds))
      .subscribe()
  }

  async function refreshTasks(ids) {
    const { data } = await supabase.from('tasks').select('*').in('user_id', ids).eq('type', 'today').eq('date', TODAY)
    setTasks(data || [])
  }
  async function refreshPhotos(ids) {
    const { data } = await supabase.from('photos').select('*').in('user_id', ids).eq('date', TODAY)
    setPhotos(data || [])
  }
  async function refreshEnc(ids) {
    const { data } = await supabase.from('encouragements').select('*').in('to_user', ids).eq('date', TODAY)
    setEncouragements(data || [])
  }
  async function refreshReactions(ids) {
    const photoIds = photos.map(p => p.id)
    if (!photoIds.length) return
    const { data } = await supabase.from('reactions').select('*').in('photo_id', photoIds)
    setReactions(data || [])
  }
  async function refreshComments(ids) {
    const photoIds = photos.map(p => p.id)
    if (!photoIds.length) return
    const { data } = await supabase.from('comments').select('*, profiles(username)').in('photo_id', photoIds).order('created_at')
    setComments(data || [])
  }

  async function sendEncouragement(toUserId, message) {
    await supabase.from('encouragements').insert({
      to_user: toUserId, from_user: profile.id,
      group_id: group.id, message, date: TODAY
    })
    refreshEnc(members.map(m => m.user_id))
  }

  async function toggleReaction(photoId, emoji) {
    const existing = reactions.find(r => r.photo_id === photoId && r.user_id === profile.id && r.emoji === emoji)
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ photo_id: photoId, user_id: profile.id, emoji })
    }
    refreshReactions(members.map(m => m.user_id))
  }

  async function addComment(photoId) {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({ photo_id: photoId, user_id: profile.id, text: newComment.trim() })
    setNewComment('')
    refreshComments(members.map(m => m.user_id))
  }

  function getInitials(username) { return username.substring(0, 2).toUpperCase() }
  function getTasksForUser(userId) { return tasks.filter(t => t.user_id === userId) }
  function getPhotoForUser(userId) { return photos.find(p => p.user_id === userId) }
  function getEncsForUser(userId) { return encouragements.filter(e => e.to_user === userId) }
  function getReactionsForPhoto(photoId) { return reactions.filter(r => r.photo_id === photoId) }
  function getCommentsForPhoto(photoId) { return comments.filter(c => c.photo_id === photoId) }

  if (loading) return <div style={{ padding:20, color:'var(--muted)', fontSize:13 }}>Chargement…</div>

  if (!group) return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>
      <div style={{ padding:'12px 14px 10px', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>La Bande</div>
      </div>
      <div style={{ padding:14 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:20, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>👥</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--black)', marginBottom:4 }}>Pas encore de bande</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Crée ou rejoins un groupe depuis le profil</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>

      {/* Header */}
      <div style={{ padding:'12px 14px 9px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--card)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:'var(--black)' }}>{group.name}</div>
          <div style={{ fontSize:8, color:'#1ECC82', marginTop:1 }}>● {members.length} membres</div>
        </div>
        <div style={{ background:'var(--black)', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}
          onClick={() => { navigator.clipboard.writeText(group.code); alert('Code copié : ' + group.code) }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:7, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'.1em' }}>CODE</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:800, color:'var(--lime)', letterSpacing:2 }}>{group.code}</div>
        </div>
      </div>

      {/* Stories */}
      <div style={{ padding:'9px 14px', display:'flex', gap:9, overflowX:'auto', scrollbarWidth:'none', background:'var(--card)', borderBottom:'1px solid var(--border)' }}>
        {members.map((m, i) => {
          const userTasks = getTasksForUser(m.user_id)
          const done      = userTasks.filter(t => t.done).length
          const total     = userTasks.length
          const complete  = total >= 3 && done >= total
          const color     = COLORS[i % COLORS.length]
          return (
            <div key={m.user_id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
              <div style={{ padding:2, borderRadius:'50%', background: complete ? 'linear-gradient(135deg,var(--lime),var(--cyan))' : 'rgba(0,0,0,0.1)' }}>
                <div style={{ background:'var(--card)', borderRadius:'50%', padding:2 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:10, color }}>
                    {getInitials(m.profiles.username)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:7, color:'var(--muted)', fontWeight:600 }}>
                {m.user_id === profile.id ? 'Moi' : m.profiles.username}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feed */}
      <div style={{ padding:'9px 14px', display:'flex', flexDirection:'column', gap:9 }}>
        {members.map((m, i) => {
          const userTasks = getTasksForUser(m.user_id)
          const done      = userTasks.filter(t => t.done).length
          const total     = userTasks.length
          const needed    = Math.max(total, 3)
          const pct       = needed > 0 ? done / needed : 0
          const complete  = total >= 3 && done >= total
          const color     = COLORS[i % COLORS.length]
          const isMe      = m.user_id === profile.id
          const photo     = getPhotoForUser(m.user_id)
          const encs      = getEncsForUser(m.user_id)
          const photoReactions = photo ? getReactionsForPhoto(photo.id) : []
          const photoComments  = photo ? getCommentsForPhoto(photo.id) : []

          return (
            <div key={m.user_id} style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden' }}>

              {/* Head */}
              <div style={{ padding:'10px 12px 8px', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11, color, flexShrink:0 }}>
                  {getInitials(m.profiles.username)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--black)' }}>
                    {isMe ? 'Moi' : m.profiles.username}
                  </div>
                  <div style={{ fontSize:8, color:'var(--muted)', marginTop:1 }}>
                    {complete ? 'Journée complète 🎉' : total === 0 ? 'Pas encore commencé' : done+'/'+needed+' tâches en cours'}
                  </div>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:99, background:complete?'rgba(207,255,4,0.1)':'rgba(0,0,0,0.04)', color:complete?'#5A7000':'var(--muted)', border:'1px solid', borderColor:complete?'rgba(207,255,4,0.2)':'var(--border)' }}>
                  {done}/{needed}
                </div>
              </div>

              {/* Encouragements reçus */}
              {encs.length > 0 && (
                <div style={{ margin:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:5 }}>
                  {encs.slice(-3).map((e, idx) => (
                    <div key={idx} style={{ background:'var(--black)', color:'var(--lime)', borderRadius:6, padding:'3px 9px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:800 }}>
                      {e.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Barre progression */}
              <div style={{ margin:'0 12px 8px' }}>
                <div style={{ height:5, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:(pct*100)+'%', background:complete?'var(--lime)':color, borderRadius:99, transition:'width .6s ease' }}/>
                </div>
              </div>

              {/* Tâches */}
              {userTasks.length > 0 && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'6px 12px 6px', display:'flex', flexDirection:'column', gap:4 }}>
                  {userTasks.map(t => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:12, height:12, borderRadius:3, background:t.done?'var(--lime)':'transparent', border:t.done?'none':'1.5px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {t.done && <div style={{ width:6, height:4, borderLeft:'1.5px solid #000', borderBottom:'1.5px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>}
                      </div>
                      <div style={{ fontSize:11, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Boutons encouragement (si pas complet et pas moi) */}
              {!isMe && !complete && (
                <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:5, flexWrap:'wrap' }}>
                  {ENCOURAGEMENTS.map(msg => (
                    <div key={msg} onClick={() => sendEncouragement(m.user_id, msg)}
                      style={{ background:'var(--black)', color:'var(--lime)', borderRadius:6, padding:'4px 9px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:800, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                      {msg}
                    </div>
                  ))}
                </div>
              )}

              {/* Photo si partagée */}
              {photo && (
                <div style={{ margin:'8px 12px', borderRadius:10, overflow:'hidden', position:'relative', height:150 }}>
                  {photo.photo_url
                    ? <img src={photo.photo_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="photo"/>
                    : <div style={{ width:'100%', height:'100%', background:photo.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>{photo.emoji}</div>
                  }
                  {photo.sticker && (
                    <div style={{ position:'absolute', top:8, right:8, background:'#000', color:'var(--lime)', borderRadius:6, padding:'3px 8px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:800, border:'2px solid #000' }}>
                      {photo.sticker}
                    </div>
                  )}
                </div>
              )}

              {/* Réactions sur la photo */}
              {photo && (
                <div style={{ padding:'6px 12px 4px', display:'flex', alignItems:'center', gap:5, borderTop:'1px solid var(--border)', flexWrap:'wrap' }}>
                  {REACTIONS.map(emoji => {
                    const count = photoReactions.filter(r => r.emoji === emoji).length
                    const mine  = photoReactions.some(r => r.emoji === emoji && r.user_id === profile.id)
                    return (
                      <div key={emoji} onClick={() => toggleReaction(photo.id, emoji)}
                        style={{ display:'flex', alignItems:'center', gap:3, background: mine ? 'rgba(255,46,154,0.1)' : 'rgba(0,0,0,0.04)', borderRadius:99, padding:'4px 8px', border:'1px solid', borderColor: mine ? 'rgba(255,46,154,0.3)' : 'var(--border)', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                        <span style={{ fontSize:12 }}>{emoji}</span>
                        {count > 0 && <span style={{ fontSize:9, fontWeight:700, color: mine ? 'var(--pink)' : 'var(--muted)', fontFamily:'Syne,sans-serif' }}>{count}</span>}
                      </div>
                    )
                  })}
                  {/* Bouton commentaire */}
                  <div onClick={() => setOpenComment(openComment === photo.id ? null : photo.id)}
                    style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(0,0,0,0.04)', borderRadius:99, padding:'4px 8px', border:'1px solid var(--border)', cursor:'pointer', marginLeft:'auto' }}>
                    <span style={{ fontSize:12 }}>💬</span>
                    {photoComments.length > 0 && <span style={{ fontSize:9, fontWeight:700, color:'var(--muted)', fontFamily:'Syne,sans-serif' }}>{photoComments.length}</span>}
                  </div>
                </div>
              )}

              {/* Commentaires */}
              {photo && openComment === photo.id && (
                <div style={{ padding:'6px 12px 10px', borderTop:'1px solid var(--border)' }}>
                  {photoComments.map(c => (
                    <div key={c.id} style={{ display:'flex', gap:6, marginBottom:6 }}>
                      <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, color:'var(--pink)', flexShrink:0 }}>@{c.profiles.username}</div>
                      <div style={{ fontSize:11, color:'var(--text)' }}>{c.text}</div>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && addComment(photo.id)}
                      placeholder="Ajoute un commentaire…"
                      style={{ flex:1, background:'var(--offwhite)', border:'1.5px solid var(--border2)', borderRadius:8, padding:'7px 10px', fontSize:11, color:'var(--black)', outline:'none', fontFamily:'Inter,sans-serif' }}
                    />
                    <button onClick={() => addComment(photo.id)}
                      style={{ background:'var(--black)', color:'var(--lime)', border:'none', borderRadius:8, padding:'7px 12px', fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:800, cursor:'pointer' }}>
                      →
                    </button>
                  </div>
                </div>
              )}

            </div>
          )
        })}
      </div>

      <div style={{ height:16 }}/>
    </div>
  )
}