import { useState } from 'react'
import { supabase } from '../supabase'

const EMOJIS = ['🌸','✨','🌿','🌈','🔥','💫','🎯','🌊','🦋','🎨','🍀','⭐']
const STICKERS = [
  { cls:'lime',   label:'🔥 STREAK' },
  { cls:'pink',   label:'DONE!'     },
  { cls:'cyan',   label:'YOU GOT THIS' },
  { cls:'orange', label:"LET'S GO!" },
  { cls:'dark',   label:'NEW RECORD' },
]
const GRADIENTS = [
  'linear-gradient(135deg,#FFD6EC,#C9A0FF,#A0F0FF)',
  'linear-gradient(135deg,#A0F0FF,#CFFF04,#FFD6EC)',
  'linear-gradient(135deg,#FFD6EC,#FF6B00,#CFFF04)',
  'linear-gradient(135deg,#C9A0FF,#00E5FF,#CFFF04)',
]

const STK_COLORS = {
  lime:   { bg:'#CFFF04', color:'#000' },
  pink:   { bg:'#FF2E9A', color:'#fff' },
  cyan:   { bg:'#00E5FF', color:'#000' },
  orange: { bg:'#FF6B00', color:'#fff' },
  dark:   { bg:'#0A0A0A', color:'#CFFF04' },
}

export default function PhotoModal({ profile, group, onClose, onShared }) {
  const [selectedStk, setSelectedStk] = useState(null)
  const [photoFile, setPhotoFile]     = useState(null)
  const [photoUrl, setPhotoUrl]       = useState(null)
  const [loading, setLoading]         = useState(false)
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoUrl(URL.createObjectURL(file))
  }

  async function share() {
    setLoading(true)
    const now = new Date()
    const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0')
    let uploadedUrl = null

    // Upload photo si prise
    if (photoFile) {
      const path = profile.id + '/' + Date.now() + '.jpg'
      const { error } = await supabase.storage.from('photos').upload(path, photoFile)
      if (!error) {
        const { data } = supabase.storage.from('photos').getPublicUrl(path)
        uploadedUrl = data.publicUrl
      }
    }

    const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]

    await supabase.from('photos').insert({
      user_id:  profile.id,
      group_id: group.id,
      emoji,
      sticker:  selectedStk ? selectedStk.label : null,
      gradient,
      photo_url: uploadedUrl,
      date: dateStr,
    })

    setLoading(false)
    onShared()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ width:'100%', background:'var(--card)', borderRadius:'24px 24px 0 0', padding:'20px 16px 32px', border:'1.5px solid var(--border2)' }}>

        {/* Handle */}
        <div style={{ width:32, height:3, background:'rgba(0,0,0,0.15)', borderRadius:99, margin:'0 auto 16px' }}/>

        <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:800, color:'var(--black)', textAlign:'center', marginBottom:4 }}>🎉 Journée complète !</div>
        <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginBottom:16 }}>Prends ta photo et partage avec la bande</div>

        {/* Preview */}
        <div style={{ width:'100%', height:120, borderRadius:14, marginBottom:14, overflow:'hidden', position:'relative', background: photoUrl ? '#000' : GRADIENTS[0], display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
          onClick={() => document.getElementById('photo-input').click()}>
          {photoUrl
            ? <img src={photoUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="preview"/>
            : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:40 }}>{emoji}</div>
                <div style={{ fontSize:9, color:'rgba(0,0,0,0.4)', fontWeight:600 }}>Appuie pour prendre ta photo 📸</div>
              </div>
          }
          {selectedStk && (
            <div style={{ position:'absolute', top:8, right:8, background:STK_COLORS[selectedStk.cls].bg, color:STK_COLORS[selectedStk.cls].color, borderRadius:6, padding:'3px 8px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:800, border:'2px solid #000' }}>
              {selectedStk.label}
            </div>
          )}
        </div>
        <input type="file" accept="image/*" capture="user" id="photo-input" style={{ display:'none' }} onChange={handlePhoto}/>

        {/* Bouton photo */}
        <button onClick={() => document.getElementById('photo-input').click()}
          style={{ width:'100%', background: photoUrl ? 'rgba(0,0,0,0.06)' : 'var(--pink)', color: photoUrl ? 'var(--muted)' : '#fff', border:'none', borderRadius:12, padding:11, fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:800, cursor:'pointer', marginBottom:10 }}>
          {photoUrl ? '📷 Reprendre' : '📷 PRENDRE MA PHOTO'}
        </button>

        {/* Stickers */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', marginBottom:14 }}>
          {STICKERS.map(s => (
            <div key={s.cls} onClick={() => setSelectedStk(selectedStk?.cls === s.cls ? null : s)}
              style={{ background:STK_COLORS[s.cls].bg, color:STK_COLORS[s.cls].color, borderRadius:6, padding:'4px 10px', fontFamily:'Syne,sans-serif', fontSize:8, fontWeight:800, border: selectedStk?.cls === s.cls ? '2.5px solid var(--pink)' : '2px solid #000', cursor:'pointer' }}>
              {s.label}
            </div>
          ))}
        </div>

        <button onClick={share} disabled={loading}
          style={{ width:'100%', background:'var(--black)', color:'var(--lime)', border:'none', borderRadius:12, padding:13, fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:800, cursor:'pointer', marginBottom:8 }}>
          {loading ? '...' : '🚀 PARTAGER AVEC LA BANDE'}
        </button>
        <button onClick={onClose}
          style={{ width:'100%', background:'transparent', border:'1px solid var(--border2)', borderRadius:12, padding:11, fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, color:'var(--muted)', cursor:'pointer' }}>
          Plus tard
        </button>
      </div>
    </div>
  )
}