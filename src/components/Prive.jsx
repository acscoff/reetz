import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function getDateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function getWeekRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
  start.setHours(0,0,0,0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23,59,59,999)
  return { start, end }
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

const TAGS = {
  perso:  { label:'🙂 Perso',  bg:'rgba(191,0,255,0.1)',  color:'#9900CC' },
  boulot: { label:'💼 Boulot', bg:'rgba(0,229,255,0.12)', color:'#0088AA' },
  sante:  { label:'🌿 Santé',  bg:'rgba(207,255,4,0.18)', color:'#5A7000' },
  maison: { label:'🏠 Maison', bg:'rgba(255,107,0,0.12)', color:'var(--orange)' },
}

const VIEWS = [
  { id:'today',    label:"Aujourd'hui" },
  { id:'tomorrow', label:'Demain'      },
  { id:'week',     label:'Semaine'     },
  { id:'month',    label:'Mois'        },
  { id:'all',      label:'Tout'        },
]

export default function Prive({ profile, onBack }) {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [addOpen, setAddOpen]   = useState(false)
  const [newTask, setNewTask]   = useState('')
  const [newDate, setNewDate]   = useState('')
  const [newPrio, setNewPrio]   = useState(1)
  const [newTag, setNewTag]     = useState(null)
  const [view, setView]         = useState('today')
  const [showDone, setShowDone] = useState(false)

  const TODAY    = getDateStr(0)
  const TOMORROW = getDateStr(1)

  useEffect(() => {
    fetchTasks()
    // Pré-remplir date selon la vue
    setNewDate(TODAY)
  }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'prive')
      .order('date', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTask.trim()) return
    const { data } = await supabase
      .from('tasks')
      .insert({ user_id: profile.id, text: newTask.trim(), type: 'prive', done: false, date: newDate || TODAY, prio: newPrio, tag: newTag })
      .select().single()
    setTasks(prev => [...prev, data])
    setNewTask(''); setNewDate(TODAY); setNewPrio(1); setNewTag(null)
    setAddOpen(false)
  }

  async function toggleTask(task) {
    const { data } = await supabase
      .from('tasks').update({ done: !task.done }).eq('id', task.id).select().single()
    setTasks(prev => prev.map(t => t.id === task.id ? data : t))
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function getFiltered() {
    let list = tasks.filter(t => !t.done)
    if (view === 'today')    list = list.filter(t => t.date === TODAY)
    if (view === 'tomorrow') list = list.filter(t => t.date === TOMORROW)
    if (view === 'week') {
      const { start, end } = getWeekRange()
      list = list.filter(t => { const d = new Date(t.date); return d >= start && d <= end })
    }
    if (view === 'month') {
      const { start, end } = getMonthRange()
      list = list.filter(t => { const d = new Date(t.date); return d >= start && d <= end })
    }
    return list.sort((a,b) => (b.prio||1)-(a.prio||1) || a.date.localeCompare(b.date))
  }

  // Progress ring aujourd'hui
  const todayAll  = tasks.filter(t => t.date === TODAY)
  const todayDone = todayAll.filter(t => t.done).length
  const ringPct   = todayAll.length > 0 ? todayDone / todayAll.length : 0
  const circ      = 2 * Math.PI * 17

  const active = getFiltered()
  const done   = tasks.filter(t => t.done)

  const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const mois  = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc']

  if (loading) return <div style={{ padding:20, color:'var(--muted)', fontSize:13 }}>Chargement…</div>

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>

      {/* Header */}
      <div style={{ padding:'12px 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div onClick={onBack} style={{ width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.05)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 }}>‹</div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>🔒 Privé</div>
            <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>Mes tâches personnelles</div>
          </div>
        </div>
        <div onClick={() => { setAddOpen(!addOpen); setNewDate(view === 'tomorrow' ? TOMORROW : TODAY) }}
          style={{ width:30, height:30, borderRadius:'50%', background:'var(--pink)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>

      {/* Filtres vue */}
      <div style={{ display:'flex', gap:5, padding:'8px 14px', overflowX:'auto', scrollbarWidth:'none', background:'var(--offwhite)' }}>
        {VIEWS.map(v => (
          <div key={v.id} onClick={() => { setView(v.id); setNewDate(v.id === 'tomorrow' ? TOMORROW : TODAY) }}
            style={{ flexShrink:0, padding:'5px 12px', borderRadius:99, fontSize:9, fontWeight:700, fontFamily:'Syne,sans-serif', cursor:'pointer', border:'1.5px solid', background:view===v.id?'var(--black)':'transparent', borderColor:view===v.id?'var(--black)':'var(--border2)', color:view===v.id?'var(--lime)':'var(--muted)', WebkitTapHighlightColor:'transparent' }}>
            {v.label}
          </div>
        ))}
      </div>

      {/* Panel ajout */}
      {addOpen && (
        <div style={{ margin:'0 14px 10px', background:'var(--card)', border:'1.5px solid var(--border2)', borderRadius:14, padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
          <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key==='Enter' && addTask()}
            placeholder="Nouvelle tâche privée…" style={inputStyle} />
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:4 }}>Date</div>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inputStyle, fontSize:12 }} />
          </div>
          {/* Priorité */}
          <div style={{ display:'flex', gap:5 }}>
            {[{v:1,l:'😌 Tranquille'},{v:2,l:'⚡ Important'},{v:3,l:'🔥 Urgent'}].map(p => (
              <div key={p.v} onClick={() => setNewPrio(p.v)}
                style={{ flex:1, textAlign:'center', padding:'6px 3px', borderRadius:9, border:'1.5px solid', cursor:'pointer', fontSize:9, fontWeight:700, fontFamily:'Syne,sans-serif',
                  background: newPrio===p.v ? (p.v===3?'rgba(255,46,154,0.12)':p.v===2?'rgba(255,107,0,0.12)':'rgba(0,229,255,0.12)') : 'transparent',
                  borderColor: newPrio===p.v ? (p.v===3?'var(--pink)':p.v===2?'var(--orange)':'var(--cyan)') : 'var(--border2)',
                  color: newPrio===p.v ? (p.v===3?'var(--pink)':p.v===2?'var(--orange)':'#0088AA') : 'var(--muted)',
                }}>{p.l}</div>
            ))}
          </div>
          {/* Tags */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {Object.entries(TAGS).map(([k,v]) => (
              <div key={k} onClick={() => setNewTag(newTag===k ? null : k)}
                style={{ padding:'5px 10px', borderRadius:99, border:'1.5px solid', cursor:'pointer', fontSize:8, fontWeight:700, fontFamily:'Syne,sans-serif',
                  background: newTag===k ? v.bg : 'transparent', borderColor: newTag===k ? v.color : 'var(--border2)', color: newTag===k ? v.color : 'var(--muted)',
                }}>{v.label}</div>
            ))}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={addTask} style={btnSmall}>+ Ajouter</button>
            <button onClick={() => setAddOpen(false)} style={{ ...btnSmall, background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Progress ring */}
      <div style={{ margin:'0 14px 10px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ position:'relative', width:44, height:44, flexShrink:0 }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="17" fill="none" stroke="var(--border)" strokeWidth="4"/>
            <circle cx="22" cy="22" r="17" fill="none"
              stroke={todayDone >= todayAll.length && todayAll.length > 0 ? 'var(--lime)' : 'var(--pink)'}
              strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ*(1-ringPct)}
              strokeLinecap="round" transform="rotate(-90 22 22)"
              style={{ transition:'stroke-dashoffset .6s ease' }}
            />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:800, color:'var(--black)' }}>
            {todayDone}/{todayAll.length}
          </div>
        </div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)', marginBottom:2 }}>
            {todayAll.length > 0 && todayDone >= todayAll.length ? '🎉 Journée privée complète !' : 'Tâches privées du jour'}
          </div>
          <div style={{ fontSize:9, color:'var(--muted)' }}>
            {todayAll.length > 0 ? todayDone+'/'+todayAll.length+' validée'+(todayDone>1?'s':'') : "Aucune tâche aujourd'hui"}
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ margin:'0 14px 6px', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)' }}>
          {VIEWS.find(v => v.id === view)?.label}
        </div>
        {active.length > 0 && (
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'var(--pink)', background:'rgba(255,46,154,0.1)', borderRadius:99, padding:'2px 7px' }}>{active.length}</div>
        )}
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      </div>

      {/* Liste tâches */}
      <div style={{ margin:'0 14px' }}>
        {active.length === 0 && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>✅</div>
            <div style={{ fontSize:10, color:'var(--muted)', fontStyle:'italic' }}>
              {view === 'today' ? "Rien pour aujourd'hui !" : view === 'tomorrow' ? 'Rien de prévu demain' : 'Aucune tâche ici'}
            </div>
          </div>
        )}
        {active.map(t => {
          const today0   = new Date(); today0.setHours(0,0,0,0)
          const taskDate = new Date(t.date); taskDate.setHours(0,0,0,0)
          const overdue  = taskDate < today0 && t.date !== TODAY
          const isToday  = t.date === TODAY
          const isTomorrow = t.date === TOMORROW
          const prioEmoji  = t.prio===3?'🔥':t.prio===2?'⚡':'😌'
          const dateLabel  = isToday ? "Aujourd'hui" : isTomorrow ? 'Demain' : jours[new Date(t.date).getDay()]+' '+new Date(t.date).getDate()+' '+mois[new Date(t.date).getMonth()]
          return (
            <div key={t.id} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div onClick={() => toggleTask(t)} style={{ width:18, height:18, borderRadius:6, border:'2px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1, cursor:'pointer', transition:'all .2s' }}/>
              <div style={{ flex:1, cursor:'pointer' }} onClick={() => toggleTask(t)}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', lineHeight:1.4 }}>{t.text}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3, flexWrap:'wrap' }}>
                  {t.date && (
                    <span style={{ fontSize:8, color:overdue?'var(--pink)':'var(--muted)', background:overdue?'rgba(255,46,154,0.1)':'rgba(0,0,0,0.05)', borderRadius:4, padding:'1px 5px', fontWeight:overdue?700:400 }}>
                      {overdue ? '⚠️ ' : ''}{dateLabel}
                    </span>
                  )}
                  {t.tag && TAGS[t.tag] && (
                    <span style={{ fontSize:7, fontWeight:700, fontFamily:'Syne,sans-serif', padding:'2px 6px', borderRadius:99, background:TAGS[t.tag].bg, color:TAGS[t.tag].color }}>{TAGS[t.tag].label}</span>
                  )}
                  <span style={{ fontSize:11 }}>{prioEmoji}</span>
                </div>
              </div>
              <div onClick={() => deleteTask(t.id)} style={{ width:18, height:18, borderRadius:5, background:'rgba(255,46,154,0.07)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:1 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Archive */}
      <div style={{ margin:'8px 14px 0' }}>
        <div onClick={() => setShowDone(!showDone)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 0', cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform:showDone?'rotate(180deg)':'none' }}><polyline points="6 9 12 15 18 9"/></svg>
          Terminées ({done.length})
        </div>
        {showDone && done.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 0', borderBottom:'1px solid var(--border)', opacity:.6 }}>
            <div onClick={() => toggleTask(t)} style={{ width:18, height:18, borderRadius:6, background:'var(--lime)', border:'2px solid var(--lime)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <div style={{ width:8, height:5, borderLeft:'2.5px solid #000', borderBottom:'2.5px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>
            </div>
            <div style={{ flex:1, fontSize:12, color:'var(--muted)', textDecoration:'line-through' }}>{t.text}</div>
            <div onClick={() => deleteTask(t.id)} style={{ width:18, height:18, borderRadius:5, background:'rgba(255,46,154,0.07)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height:16 }}/>
    </div>
  )
}

const inputStyle = {
  background:'var(--offwhite)', border:'1.5px solid var(--border2)', borderRadius:10,
  padding:'10px 12px', fontSize:13, color:'var(--black)', outline:'none', width:'100%',
  fontFamily:'Inter,sans-serif',
}

const btnSmall = {
  background:'var(--black)', color:'var(--lime)', border:'none', borderRadius:9,
  padding:'9px 14px', fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:800, cursor:'pointer',
}