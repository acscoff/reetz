import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Prive from './Prive'
import PhotoModal from './PhotoModal'

const LOCK_HOUR = 12
const MIN_TASKS = 3

function getTodayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function isLocked() {
  return new Date().getHours() >= LOCK_HOUR
}

export default function Planner({ profile }) {
  const [tasks, setTasks]           = useState([])
  const [newTask, setNewTask]       = useState('')
  const [addOpen, setAddOpen]       = useState(false)
  const [tomOpen, setTomOpen]       = useState(false)
  const [newTom, setNewTom]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [showPrive, setShowPrive]   = useState(false)
  const [showPhoto, setShowPhoto]   = useState(false)
  const [group, setGroup]           = useState(null)
  const [photoTaken, setPhotoTaken] = useState(false)

  const TODAY    = getTodayStr()
  const TOMORROW = getTomorrowStr()
  const locked   = isLocked()

  const todayT    = tasks.filter(t => t.type === 'today' && t.date === TODAY)
  const tomorrowT = tasks.filter(t => t.type === 'today' && t.date === TOMORROW)
  const done      = todayT.filter(t => t.done).length
  const total     = todayT.length
  const needed    = Math.max(total, MIN_TASKS)
  const pct       = needed > 0 ? Math.min(done / needed, 1) : 0

  const status = (() => {
    if (total >= MIN_TASKS && done >= total) return 'success'
    if (!locked) return 'open'
    const h = new Date().getHours(), m = new Date().getMinutes()
    if (h === 23 && m >= 55) return 'fail'
    return 'locked'
  })()

  useEffect(() => { fetchTasks(); fetchGroup() }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'today')
      .gte('date', TODAY)
    setTasks(data || [])
    setLoading(false)
  }

  async function fetchGroup() {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', profile.id)
      .single()
    if (data) setGroup(data.groups)
    const { data: photo } = await supabase
      .from('photos')
      .select('id')
      .eq('user_id', profile.id)
      .eq('date', TODAY)
      .single()
    if (photo) setPhotoTaken(true)
  }

  async function addTask() {
    if (!newTask.trim()) return
    const { data } = await supabase
      .from('tasks')
      .insert({ user_id: profile.id, text: newTask.trim(), type: 'today', done: false, date: TODAY, prio: 1 })
      .select().single()
    setTasks(prev => [...prev, data])
    setNewTask(''); setAddOpen(false)
  }

  async function addTomTask() {
    if (!newTom.trim()) return
    const { data } = await supabase
      .from('tasks')
      .insert({ user_id: profile.id, text: newTom.trim(), type: 'today', done: false, date: TOMORROW, prio: 1 })
      .select().single()
    setTasks(prev => [...prev, data])
    setNewTom(''); setTomOpen(false)
  }

  async function toggleTask(task) {
    if (locked && status !== 'success') return
    const { data } = await supabase
      .from('tasks')
      .update({ done: !task.done })
      .eq('id', task.id)
      .select().single()
    const updated = tasks.map(t => t.id === task.id ? data : t)
    setTasks(updated)
    // Ouvrir photo modal si journée complète
    const todayUpdated = updated.filter(t => t.type === 'today' && t.date === TODAY)
    const doneUpdated  = todayUpdated.filter(t => t.done).length
    if (todayUpdated.length >= MIN_TASKS && doneUpdated >= todayUpdated.length && !photoTaken) {
      setTimeout(() => setShowPhoto(true), 500)
    }
  }

  const jours   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mois    = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  const now     = new Date()
  const dateStr = jours[now.getDay()] + ' ' + now.getDate() + ' ' + mois[now.getMonth()]

  const bannerBg     = status==='success'?'rgba(207,255,4,0.08)':status==='fail'?'rgba(255,46,154,0.07)':status==='locked'?'rgba(255,107,0,0.06)':'rgba(0,0,0,0.03)'
  const bannerBorder = status==='success'?'rgba(207,255,4,0.35)':status==='fail'?'rgba(255,46,154,0.2)':status==='locked'?'rgba(255,107,0,0.2)':'var(--border2)'
  const bannerIcon   = status==='success'?'🎉':status==='fail'?'💀':status==='locked'?'🔒':'⏳'
  const bannerTitle  = status==='success'?'Journée validée !':status==='fail'?'Journée ratée':status==='locked'?'Liste verrouillée à 12h':'Journée en cours'
  const bannerSub    = status==='success'?done+'/'+total+' tâches · streak maintenu 🔥':status==='fail'?done+'/'+total+' tâches · streak cassé 😔':status==='locked'?done+'/'+total+' tâches · prépare demain ci-dessous':'Verrou à 12h00 — fais tes tâches !'

  if (loading) return <div style={{ padding:20, color:'var(--muted)', fontSize:13 }}>Chargement…</div>
  if (showPrive) return <Prive profile={profile} onBack={() => setShowPrive(false)} />

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>

      {/* Header */}
      <div style={{ padding:'12px 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>
            reetz<span style={{ color:'var(--pink)' }}>.</span>
          </div>
          <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{dateStr}</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <div onClick={() => setShowPrive(true)} style={{ background:'var(--card)', border:'1.5px solid var(--border2)', borderRadius:99, padding:'3px 10px', display:'flex', alignItems:'center', gap:5, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:10 }}>🔒</span>
            <span style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'var(--muted)' }}>PRIVÉ</span>
          </div>
          <div style={{ background:'rgba(255,46,154,0.1)', border:'1.5px solid rgba(255,46,154,0.2)', borderRadius:99, padding:'3px 10px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'var(--pink)' }}>
            🔥 {profile.streak || 0}j
          </div>
        </div>
      </div>

      {/* Bandeau état */}
      <div style={{ margin:'10px 14px 0', background:bannerBg, border:'1px solid '+bannerBorder, borderRadius:10, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ fontSize:16 }}>{bannerIcon}</div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, color:'var(--black)' }}>{bannerTitle}</div>
          <div style={{ fontSize:9, color:'var(--muted)', marginTop:1 }}>{bannerSub}</div>
        </div>
      </div>

      {/* Ring progression */}
      <div style={{ margin:'10px 14px 0', background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:14, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5"/>
            <circle cx="32" cy="32" r="26" fill="none"
              stroke={status==='success'?'var(--lime)':'var(--pink)'}
              strokeWidth="5" strokeDasharray="163"
              strokeDashoffset={163*(1-pct)} strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition:'stroke-dashoffset .6s ease' }}
            />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:800, color:'var(--black)', lineHeight:1 }}>{done}/{needed}</div>
            <div style={{ fontSize:7, color:'var(--muted)', fontWeight:600, marginTop:1 }}>tâches</div>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)', marginBottom:3 }}>
            🔥 {profile.streak || 0} jours de streak
          </div>
          <div style={{ fontSize:10, color:'var(--muted)', marginBottom:6 }}>
            {status==='success'?'🎉 Journée validée !':status==='fail'?'😔 Objectif non atteint':done===0?'Commence ta journée !':'Continue, tu es lancé 💪'}
          </div>
          <div style={{ height:4, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:(pct*100)+'%', background:'linear-gradient(90deg,var(--pink),var(--orange))', borderRadius:99, transition:'width .5s ease' }}/>
          </div>
        </div>
      </div>

      {/* Liste tâches */}
      <div style={{ margin:'10px 14px 0', background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 8px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--black)' }}>Tâches du jour</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, color:done>=needed?'#1ECC82':'var(--muted)', fontWeight:700 }}>
            {done>=needed?'✓ Objectif atteint !':(needed-done)+' restante'+(needed-done>1?'s':'')}
          </div>
        </div>

        {todayT.map(t => (
          <div key={t.id} onClick={() => toggleTask(t)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)', cursor:locked&&status!=='success'?'default':'pointer' }}>
            <div style={{ width:24, height:24, borderRadius:7, border:t.done?'none':'2px solid var(--border2)', background:t.done?'var(--lime)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
              {t.done && <div style={{ width:11, height:7, borderLeft:'2.5px solid #000', borderBottom:'2.5px solid #000', transform:'rotate(-45deg) translateY(-1px)' }}/>}
            </div>
            <div style={{ flex:1, fontSize:14, fontWeight:500, color:t.done?'var(--muted)':'var(--text)', textDecoration:t.done?'line-through':'none' }}>{t.text}</div>
            {locked && !t.done && status==='fail' && <div style={{ fontSize:8, fontWeight:800, color:'#fff', background:'var(--pink)', borderRadius:4, padding:'2px 5px' }}>ÉCHEC</div>}
          </div>
        ))}

        {!locked && Array.from({ length: Math.max(0, MIN_TASKS-total) }).map((_,i) => (
          <div key={'e'+i} onClick={() => setAddOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', opacity:.4 }}>
            <div style={{ width:24, height:24, borderRadius:7, border:'2px dashed var(--border2)', flexShrink:0 }}/>
            <div style={{ flex:1, fontSize:13, color:'var(--muted)', fontStyle:'italic' }}>Tâche {total+i+1} — obligatoire</div>
            <div style={{ fontSize:16, color:'var(--pink)' }}>+</div>
          </div>
        ))}

        {!locked && !addOpen && (
          <div onClick={() => setAddOpen(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', cursor:'pointer', color:'var(--pink)', fontSize:12, fontWeight:600 }}>
            <span style={{ fontSize:16 }}>+</span> Ajouter une tâche
          </div>
        )}

        {addOpen && (
          <div style={{ padding:'12px 16px 14px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
            <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key==='Enter' && addTask()}
              placeholder="Nom de la tâche…" style={inputStyle} />
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={addTask} style={btnSmall}>+ Ajouter</button>
              <button onClick={() => { setAddOpen(false); setNewTask('') }} style={{ ...btnSmall, background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)' }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Bannière photo */}
      <div
        onClick={() => { if (status==='success' && !photoTaken && group) setShowPhoto(true) }}
        style={{ margin:'10px 14px 0', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor: status==='success' && !photoTaken ? 'pointer' : 'default', border:'1.5px solid', background: photoTaken ? 'rgba(207,255,4,0.08)' : status==='success' ? 'rgba(207,255,4,0.08)' : 'var(--card)', borderColor: status==='success' || photoTaken ? 'rgba(207,255,4,0.4)' : 'var(--border2)' }}>
        <div style={{ fontSize:22 }}>📸</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'var(--black)' }}>
            {photoTaken ? 'Photo partagée avec la bande !' : status==='success' ? 'Photo débloquée !' : 'Photo bloquée'}
          </div>
          <div style={{ fontSize:9, color:'var(--muted)', marginTop:1 }}>
            {photoTaken ? 'Bravo pour cette journée 🎉' :
             status==='success' ? 'Appuie pour partager avec la bande' :
             locked ? 'Objectif non atteint aujourd\'hui 😔' :
             total<MIN_TASKS ? 'Ajoute encore '+(MIN_TASKS-total)+' tâche'+(MIN_TASKS-total>1?'s':'')+' (min. '+MIN_TASKS+')' :
             'Encore '+(total-done)+' tâche'+(total-done>1?'s':'')+' à valider'}
          </div>
        </div>
        <div style={{ fontSize:18, color:'var(--muted)' }}>{photoTaken ? '✓' : '›'}</div>
      </div>

      {/* Section DEMAIN */}
      {(status==='success'||status==='locked'||status==='fail') && (
        <div style={{ margin:'10px 14px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)' }}>
              {(() => { const t=new Date(); t.setDate(t.getDate()+1); return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][t.getDay()]+' '+t.getDate(); })()}
            </div>
            {tomorrowT.length>0 && <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'#0088AA', background:'rgba(0,229,255,0.12)', borderRadius:99, padding:'2px 7px' }}>{tomorrowT.length} tâche{tomorrowT.length>1?'s':''}</div>}
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            {tomorrowT.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,229,255,0.5)', flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:13, color:'var(--text)' }}>{t.text}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:700, color:'#0088AA', background:'rgba(0,229,255,0.12)', borderRadius:4, padding:'2px 5px' }}>DEMAIN</div>
              </div>
            ))}
            {!tomOpen ? (
              <div onClick={() => setTomOpen(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', cursor:'pointer', color:'var(--muted)', fontSize:11, fontWeight:600 }}>
                <span style={{ fontSize:14, color:'var(--pink)' }}>+</span> Préparer une tâche pour demain
              </div>
            ) : (
              <div style={{ padding:'10px 14px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                <input autoFocus value={newTom} onChange={e => setNewTom(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addTomTask()}
                  placeholder="Tâche pour demain…" style={inputStyle} />
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={addTomTask} style={btnSmall}>+ Ajouter</button>
                  <button onClick={() => { setTomOpen(false); setNewTom('') }} style={{ ...btnSmall, background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)' }}>✕</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhoto && group && (
        <PhotoModal
          profile={profile}
          group={group}
          onClose={() => setShowPhoto(false)}
          onShared={() => { setShowPhoto(false); setPhotoTaken(true) }}
        />
      )}

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