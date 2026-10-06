import subprocess
import json
import time

songs = [
    "Ya Chandi Mahalaya",
    "Simhastha Sashisekhara Mahalaya",
    "Bajlo Tomar Aalor Benu With Narration Mahalaya",
    "Jago Durga Dashapraharanadharinee Mahalaya",
    "Ogo Amar Agamani-alo Mahalaya",
    "Tabo Achintya Rupa-charita-mahima Mahalaya",
    "Aham Rudrebhirvasubhischara Mahalaya",
    "Akhila-bimane Taba Jaya-gane Mahalaya",
    "Jayanati Mangala Kali Mahalaya",
    "Subhra Sankha-rabe Mahalaya",
    "Jatajutasamayuktamardhendukrita-sekharam Mahalaya",
    "Namo Chandi, Namo Chandi Mahalaya",
    "Ma Go Tabu Beene Sangeeta Mahalaya",
    "Bimane Bimane Mahalaya",
    "Jaya Jaya Japyajaye Mahalaya",
    "He Chinmoyi Mahalaya",
    "Amala-kirane Tribhubana-manoharini Mahalaya",
    "Jayanti Mangala Kali Pankaj Kumar Mullick Mahalaya",
    "Santi Dile Bhari Mahalaya"
]

results = []

for idx, query in enumerate(songs):
    print(f"Searching {idx+1}/{len(songs)}: {query}")
    try:
        # ytsearch1: searches and returns exactly 1 result
        cmd = ["python", "-m", "yt_dlp", f"ytsearch1:{query}", "--dump-json", "--no-warnings"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout.strip())
        
        vid = data['id']
        title = data.get('title', query).replace("'", "\\'")
        artist = (data.get('uploader') or 'Mahalaya').replace("'", "\\'")
        duration = data.get('duration_string', '3:00')
        img = data.get('thumbnails', [{}])[-1].get('url', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80')
        
        entry = f"      {{ videoId: '{vid}', title: '{title}', artist: '{artist}', duration: '{duration}', img: '{img}' }}"
        results.append(entry)
        print(" -> Found:", title)
    except Exception as e:
        print(" -> Failed to fetch:", query)
        print(e)
    time.sleep(1) # Be nice to YouTube

react_code = ",\n".join(results)
with open('mahalaya_sections.txt', 'w', encoding='utf-8') as f:
    f.write(react_code)

print("Done! Saved to mahalaya_sections.txt")
