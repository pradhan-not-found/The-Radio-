import json
import re

with open('C:/Users/SOURADEEP/.gemini/antigravity-ide/brain/b34c453e-4b3a-47a8-919d-b0bc48822f7e/.system_generated/tasks/task-1944.log', 'r', encoding='utf-8') as f:
    lines = f.readlines()

songs = []
for line in lines:
    try:
        data = json.loads(line.strip())
        if 'id' in data and 'title' in data:
            title = data['title'].replace("'", "\\'")
            artist = (data.get('uploader') or 'Unknown').replace("'", "\\'")
            duration = data.get('duration_string', '3:00')
            img = data.get('thumbnails', [{}])[-1].get('url', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80')
            songs.append(f"      {{ title: '{title}', artist: '{artist}', duration: '{duration}', img: '{img}' }}")
    except Exception:
        pass

# We only have one big category for this playlist: "PRADHAN DA"
category = "PRADHAN DA MIX"
react_code = f"  const MUSIC_LIBRARY: Record<string, {{ offset: number, count: number }}> = {{\n"
react_code += f"    '{category}': {{ offset: 0, count: {len(songs)} }},\n"
react_code += f"  }};\n\n"

react_code += f"  const PLAYLIST_DATA: Record<string, {{ title: string, artist: string, duration: string, img: string }}[]> = {{\n"
react_code += f"    '{category}': [\n"
react_code += ",\n".join(songs) + "\n"
react_code += f"    ],\n"
react_code += f"  }};\n"

with open('src/components/Radio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace MUSIC_LIBRARY and PLAYLIST_DATA
# This is a bit tricky, let's use regex to find and replace them
pattern = re.compile(r"  const MUSIC_LIBRARY: Record<string, \{ offset: number, count: number \}> = \{.*?  \};\n", re.DOTALL)
content = pattern.sub("", content)

pattern = re.compile(r"  const PLAYLIST_DATA: Record<string, \{ title: string, artist: string, duration: string, img: string \}\[\]> = \{.*?  \};\n", re.DOTALL)
content = pattern.sub(react_code, content)

# Replace the youtube playlist ID
content = content.replace("list: 'PLJAiFJ6bGyew'", "list: 'PLe4fZ-180Mkk'")
content = content.replace("const [activeCat, setActiveCat] = useState('DURGA PUJA');", f"const [activeCat, setActiveCat] = useState('{category}');")

with open('src/components/Radio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Added {len(songs)} songs to Radio.tsx")
