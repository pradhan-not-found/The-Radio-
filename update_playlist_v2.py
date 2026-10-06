import json
import re

with open('C:/Users/SOURADEEP/.gemini/antigravity-ide/brain/b34c453e-4b3a-47a8-919d-b0bc48822f7e/.system_generated/tasks/task-1944.log', 'r', encoding='utf-8') as f:
    lines = f.readlines()

songs = []
for line in lines:
    try:
        data = json.loads(line.strip())
        if 'id' in data and 'title' in data:
            vid = data['id']
            title = data['title'].replace("'", "\\'")
            artist = (data.get('uploader') or 'Unknown').replace("'", "\\'")
            duration = data.get('duration_string', '3:00')
            img = data.get('thumbnails', [{}])[-1].get('url', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80')
            songs.append(f"      {{ videoId: '{vid}', title: '{title}', artist: '{artist}', duration: '{duration}', img: '{img}' }}")
    except Exception:
        pass

category = "PRADHAN DA MIX"
react_code = f"  const PLAYLIST_DATA: Record<string, {{ videoId: string, title: string, artist: string, duration: string, img: string }}[]> = {{\n"

# OLD DATA
react_code += f"""    'DURGA PUJA': [
      {{ videoId: 'SFJeglBF5cg', title: 'Dugga Elo', artist: 'Monali Thakur', duration: '2:27', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80' }},
      {{ videoId: 'FBOt8rMUcio', title: 'Dugga Ma (Original Motion Picture Soundtrack)', artist: 'Arijit Singh', duration: '4:31', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' }},
      {{ videoId: 'ZFBq075jwiE', title: 'Ebar Jeno Onno Rokom Pujo', artist: 'Nakash Aziz Official', duration: '3:33', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' }},
      {{ videoId: '7uzjfZ423Kc', title: 'Dhak Baja Kashor Baja', artist: 'Shreya Ghoshal Official', duration: '4:26', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=80' }},
      {{ videoId: 'OHznU-L0JqI', title: 'Bolo Dugga Elo', artist: 'Kaushik-Guddu', duration: '3:20', img: 'https://images.unsplash.com/photo-1516280440502-a2fc99496c53?w=100&q=80' }},
      {{ videoId: 'w6SQsKD2U-Y', title: 'Aamaar Dugga', artist: 'Monali Thakur', duration: '3:20', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&q=80' }},
      {{ videoId: 'aL1POTi_EhE', title: 'Dhaker Taley', artist: 'Abhijeet', duration: '4:43', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80' }}
    ],
    'MAHALAYA': [
      {{ videoId: '6Z0UaR-i7H8', title: 'Mahisasuramardini - Full', artist: 'Birendra Krishna Bhadra', duration: '1:28:00', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' }},
      {{ videoId: '1Yycc3tejNw', title: 'Ya Chandi', artist: 'Chorus', duration: '4:15', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' }}
    ],
    'MAHALAYA SONGS': [
      {{ videoId: 'j7nWykTLEMs', title: 'Jago Tumi Jago', artist: 'Sujata Sarkar', duration: '3:45', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=80' }},
      {{ videoId: 'cFsCf0MGuuA', title: 'Bajlo Tomar Alor Benu', artist: 'Supriti Ghosh', duration: '4:10', img: 'https://images.unsplash.com/photo-1516280440502-a2fc99496c53?w=100&q=80' }}
    ],
"""

react_code += f"    '{category}': [\n"
react_code += ",\n".join(songs) + "\n"
react_code += f"    ],\n"
react_code += f"  }};\n"

with open('src/components/Radio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r"  const MUSIC_LIBRARY: Record<string, \{ offset: number, count: number \}> = \{.*?  \};\n\n", re.DOTALL)
content = pattern.sub("", content)

pattern = re.compile(r"  const PLAYLIST_DATA: Record<string, \{ title: string, artist: string, duration: string, img: string \}\[\]> = \{.*?  \};\n", re.DOTALL)
content = pattern.sub(react_code, content)

with open('src/components/Radio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Radio.tsx")
