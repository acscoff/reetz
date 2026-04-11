export default function Stats({ profile }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>
      <div style={{ padding:'12px 14px 10px', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>Stats</div>
      </div>
      <div style={{ padding:14 }}>
        <div style={{ background:'var(--lime)', borderRadius:14, padding:16 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:700, color:'rgba(0,0,0,0.4)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:4 }}>Streak actuel</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:40, fontWeight:800, color:'#000', lineHeight:1 }}>{profile.streak || 0}</div>
          <div style={{ fontSize:11, color:'rgba(0,0,0,0.5)', marginTop:4 }}>jours consécutifs</div>
        </div>
      </div>
    </div>
  )
}