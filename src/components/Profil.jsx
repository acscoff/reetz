import { supabase } from '../supabase'

export default function Profil({ profile, session }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--offwhite)' }}>
      <div style={{ padding:'12px 14px 10px', background:'var(--offwhite)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--black)' }}>Mon profil</div>
      </div>
      <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--pink)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#fff', flexShrink:0 }}>
            {profile.username.substring(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:800, color:'var(--black)' }}>@{profile.username}</div>
            <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{session.user.email}</div>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background:'transparent', border:'1px solid var(--border2)', borderRadius:10, padding:'10px', fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, color:'var(--muted)', cursor:'pointer' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}