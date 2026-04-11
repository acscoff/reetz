import { supabase } from '../supabase'

export default function Bande({ profile }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>
      <div style={{ padding:'12px 14px 10px', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>La Bande</div>
        <div style={{ fontSize:9, color:'#1ECC82', marginTop:2 }}>● En ligne</div>
      </div>
      <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:16, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🚧</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--black)', marginBottom:4 }}>Feed en construction</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Le fil d'actualité arrive bientôt — tes amis apparaîtront ici !</div>
        </div>
        <button onClick={handleLogout} style={{ background:'transparent', border:'1px solid var(--border2)', borderRadius:10, padding:'10px', fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, color:'var(--muted)', cursor:'pointer' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}