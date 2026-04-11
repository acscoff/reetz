import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Bande({ profile }) {
  const [members, setMembers]   = useState([])
  const [group, setGroup]       = useState(null)
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)

  function getTodayStr() {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
  }

  const TODAY = getTodayStr()

  useEffect(() => {
    fetchGroup()
  }, [])

  async function fetchGroup() {
    // Récupère le groupe de l'utilisateur
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', profile.id)
      .single()

    if (!membership) { setLoading(false); return }

    setGroup(membership.groups)

    // Récupère les membres du groupe
    const { data: membersData } = await supabase
      .from('group_members')
      .select('user_id, profiles(*)')
      .eq('group_id', membership.group_id)

    setMembers(membersData || [])

    // Récupère les tâches today de tous les membres
    const memberIds = (membersData || []).map(m => m.user_id)
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', memberIds)
      .eq('type', 'today')
      .eq('date', TODAY)

    setTasks(tasksData || [])
    setLoading(false)

    // Écoute les changements en temps réel
    supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks(membership.group_id, membersData)
      })
      .subscribe()
  }

  async function fetchTasks(groupId, membersData) {
    const memberIds = (membersData || members).map(m => m.user_id)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', memberIds)
      .eq('type', 'today')
      .eq('date', TODAY)
    setTasks(data || [])
  }

  function getTasksForUser(userId) {
    return tasks.filter(t => t.user_id === userId)
  }

  function getInitials(username) {
    return username.substring(0, 2).toUpperCase()
  }

  const COLORS = ['#FF2E9A','#00E5FF','#CFFF04','#FF6B00','#BF00FF']

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
        {/* Code du groupe */}
        <div style={{ background:'var(--black)', borderRadius:8, padding:'4px 10px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:7, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'.1em' }}>CODE</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:800, color:'var(--lime)', letterSpacing:2 }}>{group.code}</div>
        </div>
      </div>

      {/* Stories */}
      <div style={{ padding:'9px 14px', display:'flex', gap:9, overflowX:'auto', scrollbarWidth:'none', background:'var(--card)', borderBottom:'1px solid var(--border)' }}>
        {members.map((m, i) => {
          const userTasks = getTasksForUser(m.user_id)
          const done = userTasks.filter(t => t.done).length
          const total = userTasks.length
          const complete = total >= 3 && done >= total
          const color = COLORS[i % COLORS.length]
          return (
            <div key={m.user_id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
              <div style={{ padding:2, borderRadius:'50%', background: complete ? 'linear-gradient(135deg,var(--lime),var(--cyan))' : 'rgba(0,0,0,0.1)' }}>
                <div style={{ background:'var(--card)', borderRadius:'50%', padding:2 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background: color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:10, color }}>
                    {getInitials(m.profiles.username)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:7, color:'var(--muted)', fontWeight:600 }}>{m.profiles.username}</div>
            </div>
          )
        })}
      </div>

      {/* Feed */}
      <div style={{ padding:'9px 14px', display:'flex', flexDirection:'column', gap:9 }}>
        {members.map((m, i) => {
          const userTasks = getTasksForUser(m.user_id)
          const done = userTasks.filter(t => t.done).length
          const total = userTasks.length
          const needed = Math.max(total, 3)
          const pct = needed > 0 ? done / needed : 0
          const complete = total >= 3 && done >= total
          const color = COLORS[i % COLORS.length]
          const isMe = m.user_id === profile.id

          return (
            <div key={m.user_id} style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden' }}>

              {/* Head */}
              <div style={{ padding:'10px 12px 8px', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:10, color, flexShrink:0 }}>
                  {getInitials(m.profiles.username)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--black)' }}>
                    {isMe ? 'Moi' : m.profiles.username}
                  </div>
                  <div style={{ fontSize:8, color:'var(--muted)', marginTop:1 }}>
                    {complete ? 'Journée complète 🎉' : total === 0 ? 'Pas encore commencé' : 'En cours…'}
                  </div>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:99, background: complete ? 'rgba(207,255,4,0.1)' : 'rgba(0,0,0,0.04)', color: complete ? '#5A7000' : 'var(--muted)', border:'1px solid', borderColor: complete ? 'rgba(207,255,4,0.2)' : 'var(--border)' }}>
                  {done}/{needed}
                </div>
              </div>

              {/* Barre progression */}
              <div style={{ margin:'0 12px 10px' }}>
                <div style={{ height:4, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:(pct*100)+'%', background: complete ? 'var(--lime)' : color, borderRadius:99, transition:'width .6s ease' }}/>
                </div>
              </div>

              {/* Tâches */}
              {userTasks.length > 0 && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'6px 12px 8px', display:'flex', flexDirection:'column', gap:4 }}>
                  {userTasks.map(t => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:12, height:12, borderRadius:3, background: t.done ? 'var(--lime)' : 'transparent', border: t.done ? 'none' : '1.5px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {t.done && <div style={{ width:6, height:4, borderLeft:'1.5px solid #000', borderBottom:'1.5px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>}
                      </div>
                      <div style={{ fontSize:11, color: t.done ? 'var(--muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer réactions */}
              <div style={{ padding:'6px 12px 10px', display:'flex', alignItems:'center', gap:6, borderTop:'1px solid var(--border)' }}>
                {['❤️','🔥','💪'].map(emoji => (
                  <div key={emoji} style={{ background:'rgba(0,0,0,0.04)', borderRadius:99, padding:'4px 9px', fontSize:9, color:'var(--muted)', border:'1px solid var(--border)', cursor:'pointer' }}>
                    {emoji}
                  </div>
                ))}
                {!isMe && !complete && (
                  <div style={{ marginLeft:'auto', background:'var(--black)', color:'var(--lime)', border:'none', borderRadius:99, padding:'4px 10px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:800, cursor:'pointer' }}>
                    YOU GOT THIS!
                  </div>
                )}
                {complete && (
                  <div style={{ marginLeft:'auto', background:'rgba(207,255,4,0.12)', borderRadius:99, padding:'4px 9px', fontSize:9, fontWeight:700, color:'#5A7000', fontFamily:'Syne,sans-serif', border:'1px solid rgba(207,255,4,0.25)' }}>
                    ✓ Complété
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>

      <div style={{ height:16 }}/>
    </div>
  )
}