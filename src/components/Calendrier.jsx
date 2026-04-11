export default function Calendrier({ profile }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>
      <div style={{ padding:'12px 14px 10px', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>Calendrier</div>
      </div>
      <div style={{ padding:14 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:16, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🚧</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--black)', marginBottom:4 }}>Calendrier en construction</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Bientôt disponible !</div>
        </div>
      </div>
    </div>
  )
}