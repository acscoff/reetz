import { useState } from 'react'
import Planner from '../components/Planner'
import Bande from '../components/Bande'
import Calendrier from '../components/Calendrier'
import Stats from '../components/Stats'
import Profil from '../components/Profil'

export default function App_Main({ profile, session }) {
  const [screen, setScreen] = useState('planner')

  const screens = {
    planner:    <Planner profile={profile} />,
    bande:      <Bande profile={profile} />,
    calendrier: <Calendrier profile={profile} />,
    stats:      <Stats profile={profile} />,
    profil:     <Profil profile={profile} session={session} />,
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--offwhite)' }}>

      {/* Screen actif */}
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {screens[screen]}
      </div>

      {/* Bottom nav */}
      <div style={{
        height:70, background:'var(--card)', borderTop:'1px solid var(--border)',
        display:'flex', alignItems:'flex-start', justifyContent:'space-around',
        paddingTop:10, flexShrink:0, zIndex:100
      }}>
        {[
          { id:'planner',    icon:'✓', label:"Aujourd'hui" },
          { id:'bande',      icon:'👥', label:'Bande' },
          { id:'calendrier', icon:'📅', label:'Calendrier' },
          { id:'stats',      icon:'📊', label:'Stats' },
          { id:'profil',     icon:'👤', label:'Profil' },
        ].map(tab => (
          <div
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              cursor:'pointer', padding:'4px 10px', borderRadius:12,
              WebkitTapHighlightColor:'transparent',
            }}
          >
            <div style={{ fontSize:20 }}>{tab.icon}</div>
            <div style={{
              fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700,
              letterSpacing:'.06em', textTransform:'uppercase',
              color: screen === tab.id ? 'var(--pink)' : 'var(--muted)'
            }}>
              {tab.label}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}