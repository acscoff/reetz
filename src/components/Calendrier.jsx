import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Calendrier({ profile }) {
  const [tasks, setTasks]           = useState([])
  const [groupTasks, setGroupTasks] = useState([])
  const [photos, setPhotos]         = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [calOffset, setCalOffset]   = useState(0)
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('prive')

  const TODAY = new Date()
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mois  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  const DLBLS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

  function toStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
  }

  const todayStr = toStr(TODAY)
  const selStr   = selectedDate ? toStr(selectedDate) : todayStr

  useEffect(() => {
    fetchData()
    setSelectedDate(new Date(TODAY))
  }, [])

  async function fetchData() {
    const { data: privData } = await supabase
      .from('tasks').select('*')
      .eq('user_id', profile.id).eq('type', 'prive').order('date')

    const { data: todayData } = await supabase
      .from('tasks').select('*')
      .eq('user_id', profile.id).eq('type', 'today').order('date')

    const { data: photoData } = await supabase
      .from('photos').select('*')
      .eq('user_id', profile.id).order('date', { ascending: false })

    const { data: membership } = await supabase
      .from('group_members').select('group_id')
      .eq('user_id', profile.id).single()

    let groupT = []
    if (membership) {
      const { data: members } = await supabase
        .from('group_members').select('user_id')
        .eq('group_id', membership.group_id)
      const memberIds = (members || []).map(m => m.user_id)
      const { data: gTasks } = await supabase
        .from('tasks').select('*, profiles(username)')
        .in('user_id', memberIds).eq('type', 'today').order('date')
      groupT = gTasks || []
    }

    setTasks([...(privData||[]), ...(todayData||[])])
    setGroupTasks(groupT)
    setPhotos(photoData || [])
    setLoading(false)
  }

  function getPriveForDate(d) { return tasks.filter(t => t.type==='prive' && t.date===d) }
  function getTodayForDate(d) { return tasks.filter(t => t.type==='today' && t.date===d) }
  function getGroupForDate(d) { return groupTasks.filter(t => t.date===d) }
  function getPhotoForDate(d) { return photos.find(p => p.date===d) }
  function isDaySuccess(d) {
    const dayT = getTodayForDate(d)
    return dayT.length >= 3 && dayT.every(t => t.done)
  }

  const base        = new Date(TODAY.getFullYear(), TODAY.getMonth() + calOffset, 1)
  const year        = base.getFullYear()
  const month       = base.getMonth()
  const monthName   = mois[month].charAt(0).toUpperCase() + mois[month].slice(1)
  let   startDow    = new Date(year, month, 1).getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const selPriveTasks = getPriveForDate(selStr)
  const selTodayTasks = getTodayForDate(selStr)
  const selGroupTasks = getGroupForDate(selStr)
  const selPhoto      = getPhotoForDate(selStr)
  const selIsToday    = selStr === todayStr
  const selDate       = new Date(selStr + 'T12:00:00')
  const selLabel      = selIsToday ? "Aujourd'hui" : jours[selDate.getDay()] + ' ' + selDate.getDate() + ' ' + mois[selDate.getMonth()]

  if (loading) return <div style={{ padding:20, color:'var(--muted)', fontSize:13 }}>Chargement…</div>

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>

      {/* Header */}
      <div style={{ padding:'12px 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>Calendrier</div>
          <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{monthName} {year}</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <div onClick={() => setCalOffset(calOffset-1)} style={{ width:28, height:28, borderRadius:8, background:'rgba(0,0,0,0.05)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 }}>‹</div>
          <div onClick={() => { setCalOffset(0); setSelectedDate(new Date(TODAY)) }} style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, padding:'4px 8px', borderRadius:8, background:'rgba(0,0,0,0.05)', border:'1px solid var(--border2)', cursor:'pointer', color:'var(--muted)' }}>Auj.</div>
          <div onClick={() => setCalOffset(calOffset+1)} style={{ width:28, height:28, borderRadius:8, background:'rgba(0,0,0,0.05)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 }}>›</div>
        </div>
      </div>

      {/* Grille style Google Agenda */}
      <div style={{ margin:'10px 14px 0', background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>

        {/* Labels jours */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.02)' }}>
          {DLBLS.map(d => (
            <div key={d} style={{ textAlign:'center', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'var(--muted)', padding:'6px 0' }}>{d}</div>
          ))}
        </div>

        {/* Cellules */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {Array.from({ length: startDow }).map((_,i) => (
            <div key={'e'+i} style={{ minHeight:56, borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.01)' }}/>
          ))}
          {Array.from({ length: daysInMonth }).map((_,i) => {
            const d        = i + 1
            const dateStr  = year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
            const isToday  = dateStr === todayStr
            const isSel    = dateStr === selStr
            const success  = isDaySuccess(dateStr)
            const privT    = getPriveForDate(dateStr)
            const todayT   = getTodayForDate(dateStr)
            const grpT     = getGroupForDate(dateStr)
            const hasPhoto = !!getPhotoForDate(dateStr)
            const allTasks = [...privT, ...todayT]

            return (
              <div key={d} onClick={() => setSelectedDate(new Date(year, month, d))}
                style={{ minHeight:56, borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'3px 2px 2px', cursor:'pointer', background: isSel ? 'rgba(255,46,154,0.04)' : success ? 'rgba(207,255,4,0.05)' : 'transparent', position:'relative', overflow:'hidden' }}>

                {/* Numéro du jour */}
                <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 2px', background: isToday ? 'var(--pink)' : isSel ? 'var(--black)' : 'transparent', color: isToday ? '#fff' : isSel ? 'var(--lime)' : success ? '#5A7000' : 'var(--text)', fontFamily:'Syne,sans-serif', fontSize:10, fontWeight: isToday||isSel ? 700 : 400 }}>
                  {d}
                </div>

                {/* Badges compacts */}
                <div style={{ display:'flex', flexDirection:'column', gap:1, marginTop:1 }}>
                  {privT.length > 0 && (
                    <div style={{ background:'rgba(255,46,154,0.15)', borderRadius:3, padding:'1px 4px', fontSize:7, color:'var(--pink)', fontWeight:700, fontFamily:'Syne,sans-serif' }}>
                      🔒 {privT.length}
                    </div>
                  )}
                  {grpT.length > 0 && (
                    <div style={{ background:'rgba(0,229,255,0.15)', borderRadius:3, padding:'1px 4px', fontSize:7, color:'#0088AA', fontWeight:700, fontFamily:'Syne,sans-serif' }}>
                      👥 {grpT.length}
                    </div>
                  )}
                </div>

                {/* Dot bande */}
                {grpT.length > 0 && (
                  <div style={{ position:'absolute', bottom:2, right:3, width:4, height:4, borderRadius:'50%', background:'var(--cyan)' }}/>
                )}

                {/* Photo */}
                {hasPhoto && (
                  <div style={{ position:'absolute', top:2, right:2, fontSize:7 }}>📸</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div style={{ margin:'8px 14px 0', display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { color:'rgba(255,46,154,0.3)', label:'Privé' },
          { color:'rgba(207,255,4,0.4)',  label:'Validé' },
          { color:'var(--cyan)',           label:'Bande' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:3, background:l.color }}/>
            <div style={{ fontSize:9, color:'var(--muted)' }}>{l.label}</div>
          </div>
        ))}
      </div>

      {/* Séparateur */}
      <div style={{ margin:'10px 14px 0', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', whiteSpace:'nowrap' }}>{selLabel}</div>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      </div>

      {/* Photo */}
      {selPhoto && (
        <div style={{ margin:'10px 14px 0', borderRadius:14, overflow:'hidden', position:'relative', height:140 }}>
          {selPhoto.photo_url
            ? <img src={selPhoto.photo_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="photo"/>
            : <div style={{ width:'100%', height:'100%', background:selPhoto.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>{selPhoto.emoji}</div>
          }
          {selPhoto.sticker && (
            <div style={{ position:'absolute', top:10, right:10, background:'#000', color:'var(--lime)', borderRadius:6, padding:'4px 10px', fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:800 }}>
              {selPhoto.sticker}
            </div>
          )}
        </div>
      )}

      {/* Tabs Privé / Bande */}
      <div style={{ margin:'10px 14px 0', display:'flex', borderRadius:10, overflow:'hidden', border:'1.5px solid var(--border2)' }}>
        {[{id:'prive',label:'🔒 Privé'},{id:'bande',label:'👥 Bande'}].map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex:1, padding:'8px 4px', textAlign:'center', fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', cursor:'pointer', background:activeTab===tab.id?'var(--black)':'var(--card)', color:activeTab===tab.id?'var(--lime)':'var(--muted)', borderRight:tab.id==='prive'?'1.5px solid var(--border2)':'none' }}>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tâches */}
      <div style={{ margin:'8px 14px 0', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>

        {activeTab === 'prive' && (
          <>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)' }}>Tâches privées</div>
              <div style={{ fontSize:9, color:'var(--muted)' }}>{selPriveTasks.length + selTodayTasks.length} tâche{(selPriveTasks.length+selTodayTasks.length)!==1?'s':''}</div>
            </div>
            {selPriveTasks.length === 0 && selTodayTasks.length === 0 ? (
              <div style={{ padding:16, textAlign:'center', fontSize:11, color:'var(--muted)', fontStyle:'italic' }}>Aucune tâche ce jour</div>
            ) : (
              <>
                {selPriveTasks.map(t => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:'rgba(255,46,154,0.4)', flexShrink:0 }}/>
                    <div style={{ flex:1, fontSize:12, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                    <div style={{ fontSize:9 }}>{t.prio===3?'🔥':t.prio===2?'⚡':'😌'}</div>
                    {t.done && <div style={{ fontSize:9, color:'#1ECC82', fontWeight:700 }}>✓</div>}
                  </div>
                ))}
                {selTodayTasks.length > 0 && (
                  <>
                    <div style={{ padding:'5px 12px', background:'rgba(0,0,0,0.02)', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', borderTop:'1px solid var(--border)' }}>Planner</div>
                    {selTodayTasks.map(t => (
                      <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:t.done?'var(--lime)':'rgba(0,0,0,0.15)', flexShrink:0 }}/>
                        <div style={{ flex:1, fontSize:12, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                        {t.done && <div style={{ fontSize:9, color:'#1ECC82', fontWeight:700 }}>✓</div>}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'bande' && (
          <>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)' }}>Tâches de la bande</div>
              <div style={{ fontSize:9, color:'var(--muted)' }}>{selGroupTasks.length} tâche{selGroupTasks.length!==1?'s':''}</div>
            </div>
            {selGroupTasks.length === 0 ? (
              <div style={{ padding:16, textAlign:'center', fontSize:11, color:'var(--muted)', fontStyle:'italic' }}>Aucune tâche de bande ce jour</div>
            ) : selGroupTasks.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:'rgba(0,229,255,0.5)', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                  <div style={{ fontSize:8, color:'#0088AA', marginTop:2 }}>@{t.profiles?.username}</div>
                </div>
                {t.done && <div style={{ fontSize:9, color:'#1ECC82', fontWeight:700 }}>✓</div>}
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ height:16 }}/>
    </div>
  )
}