import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Calendrier({ profile }) {
  const [tasks, setTasks]           = useState([])
  const [groupTasks, setGroupTasks] = useState([])
  const [photos, setPhotos]         = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [calOffset, setCalOffset]   = useState(0)
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('prive') // 'prive' | 'bande'

  const TODAY = new Date()
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mois  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  const DLBLS = ['Lu','Ma','Me','Je','Ve','Sa','Di']

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
    // Tâches privées
    const { data: privData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'prive')
      .order('date')

    // Tâches today (planner)
    const { data: todayData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'today')
      .order('date')

    // Photos
    const { data: photoData } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })

    // Tâches groupe via group_members
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', profile.id)
      .single()

    let groupT = []
    if (membership) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', membership.group_id)
      const memberIds = (members || []).map(m => m.user_id)
      const { data: gTasks } = await supabase
        .from('tasks')
        .select('*, profiles(username)')
        .in('user_id', memberIds)
        .eq('type', 'today')
        .order('date')
      groupT = gTasks || []
    }

    setTasks([...(privData||[]), ...(todayData||[])])
    setGroupTasks(groupT)
    setPhotos(photoData || [])
    setLoading(false)
  }

  function getPriveForDate(dateStr) {
    return tasks.filter(t => t.type === 'prive' && t.date === dateStr)
  }
  function getTodayForDate(dateStr) {
    return tasks.filter(t => t.type === 'today' && t.date === dateStr)
  }
  function getGroupForDate(dateStr) {
    return groupTasks.filter(t => t.date === dateStr)
  }
  function getPhotoForDate(dateStr) {
    return photos.find(p => p.date === dateStr)
  }

  function isDaySuccess(dateStr) {
    const dayT = getTodayForDate(dateStr)
    return dayT.length >= 3 && dayT.every(t => t.done)
  }

  function hasDayTasks(dateStr) {
    return tasks.some(t => t.date === dateStr) || groupTasks.some(t => t.date === dateStr)
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
  const selLabel      = selIsToday ? "Aujourd'hui" : jours[new Date(selStr+'T12:00:00').getDay()] + ' ' + new Date(selStr+'T12:00:00').getDate() + ' ' + mois[new Date(selStr+'T12:00:00').getMonth()]

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

      {/* Grille mois */}
      <div style={{ margin:'10px 14px 0', background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'10px 12px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
          {DLBLS.map(d => (
            <div key={d} style={{ textAlign:'center', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'var(--muted)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {Array.from({ length: startDow }).map((_,i) => <div key={'e'+i}/>)}
          {Array.from({ length: daysInMonth }).map((_,i) => {
            const d       = i + 1
            const dateStr = year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
            const isToday = dateStr === todayStr
            const isSel   = dateStr === selStr
            const success = isDaySuccess(dateStr)
            const hasT    = hasDayTasks(dateStr)
            const hasPriv = getPriveForDate(dateStr).length > 0
            const hasGrp  = getGroupForDate(dateStr).length > 0
            const hasPhot = !!getPhotoForDate(dateStr)

            let bg = 'transparent', color = 'var(--text)', fontWeight = 500
            if (isToday)      { bg = 'var(--pink)'; color = '#fff'; fontWeight = 700 }
            else if (isSel)   { bg = 'var(--black)'; color = 'var(--lime)'; fontWeight = 700 }
            else if (success) { bg = 'rgba(207,255,4,0.15)'; color = '#5A7000'; fontWeight = 600 }

            return (
              <div key={d} onClick={() => setSelectedDate(new Date(year, month, d))}
                style={{ aspectRatio:'1', borderRadius:99, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:bg, color, fontWeight, fontSize:10, cursor:'pointer', position:'relative', fontFamily:'Syne,sans-serif' }}>
                {d}
                {/* Dots indicateurs */}
                <div style={{ position:'absolute', bottom:1, left:'50%', transform:'translateX(-50%)', display:'flex', gap:1 }}>
                  {hasPriv && <div style={{ width:3, height:3, borderRadius:'50%', background: isSel?'var(--lime)':isToday?'var(--lime)':'var(--pink)' }}/>}
                  {hasGrp  && <div style={{ width:3, height:3, borderRadius:'50%', background: isSel?'var(--lime)':isToday?'var(--lime)':'var(--cyan)' }}/>}
                </div>
                {hasPhot && <div style={{ position:'absolute', top:0, right:2, fontSize:6 }}>📸</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div style={{ margin:'8px 14px 0', display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { color:'rgba(207,255,4,0.3)', label:'Journée validée' },
          { color:'var(--pink)',         label:'Tâches privées' },
          { color:'var(--cyan)',         label:'Tâches bande' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:l.color }}/>
            <div style={{ fontSize:9, color:'var(--muted)' }}>{l.label}</div>
          </div>
        ))}
      </div>

      {/* Séparateur jour sélectionné */}
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
            style={{ flex:1, padding:'8px 4px', textAlign:'center', fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', cursor:'pointer', background:activeTab===tab.id?'var(--black)':'var(--card)', color:activeTab===tab.id?'var(--lime)':'var(--muted)', borderRight: tab.id==='prive' ? '1.5px solid var(--border2)' : 'none' }}>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tâches selon tab */}
      <div style={{ margin:'8px 14px 0', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>

        {activeTab === 'prive' && (
          <>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)' }}>Tâches privées</div>
              <div style={{ fontSize:9, color:'var(--muted)' }}>{selPriveTasks.length} tâche{selPriveTasks.length!==1?'s':''}</div>
            </div>
            {selPriveTasks.length === 0 ? (
              <div style={{ padding:16, textAlign:'center', fontSize:11, color:'var(--muted)', fontStyle:'italic' }}>Aucune tâche privée ce jour</div>
            ) : selPriveTasks.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:16, height:16, borderRadius:5, background:t.done?'var(--lime)':'transparent', border:t.done?'none':'1.5px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {t.done && <div style={{ width:7, height:5, borderLeft:'2px solid #000', borderBottom:'2px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>}
                </div>
                <div style={{ flex:1, fontSize:12, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                <div style={{ fontSize:10 }}>{t.prio===3?'🔥':t.prio===2?'⚡':'😌'}</div>
              </div>
            ))}
            {/* Tâches planner aussi dans privé */}
            {selTodayTasks.length > 0 && (
              <>
                <div style={{ padding:'6px 12px', background:'rgba(0,0,0,0.02)', borderTop:'1px solid var(--border)', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)' }}>
                  Planner du jour
                </div>
                {selTodayTasks.map(t => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:16, height:16, borderRadius:5, background:t.done?'var(--lime)':'transparent', border:t.done?'none':'1.5px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {t.done && <div style={{ width:7, height:5, borderLeft:'2px solid #000', borderBottom:'2px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>}
                    </div>
                    <div style={{ flex:1, fontSize:12, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'bande' && (
          <>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)' }}>Tâches de la bande</div>
              <div style={{ fontSize:9, color:'var(--muted)' }}>{selGroupTasks.length} tâche{selGroupTasks.length!==1?'s':''}</div>
            </div>
            {selGroupTasks.length === 0 ? (
              <div style={{ padding:16, textAlign:'center', fontSize:11, color:'var(--muted)', fontStyle:'italic' }}>Aucune tâche de bande ce jour</div>
            ) : selGroupTasks.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:16, height:16, borderRadius:5, background:t.done?'var(--lime)':'transparent', border:t.done?'none':'1.5px solid rgba(0,229,255,0.4)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {t.done && <div style={{ width:7, height:5, borderLeft:'2px solid #000', borderBottom:'2px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
                  <div style={{ fontSize:8, color:'#0088AA', marginTop:2 }}>@{t.profiles?.username}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ height:16 }}/>
    </div>
  )
}