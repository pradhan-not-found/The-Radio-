import json
import subprocess
import os

queries = [
    "Ya Chandi Topic Birendra Krishna Bhadra",
    "Simhastha Sashisekhara Topic",
    "Bajlo Tomar Alor Benu Topic Supriti Ghosh",
    "Jago Durga Dashapraharanadharinee Topic",
    "Ogo Amar Agamani Alo Topic",
    "Tabo Achintya Rupa Topic",
    "Aham Rudrebhirvasubhischara Topic",
    "Akhila Bimane Taba Jaya Topic",
    "Jayanti Mangala Kali Topic",
    "Subhra Sankha rabe Topic",
    "Jatajutasamayuktamardhendukrita Topic",
    "Namo Chandi Namo Chandi Topic",
    "Ma Go Tabu Beene Sangeeta Topic",
    "Bimane Bimane Topic",
    "Jaya Jaya Japyajaye Topic",
    "He Chinmoyi Topic",
    "Amala Kirane Topic",
    "Santi Dile Bhari Topic"
]

results = []

import sys

for q in queries:
    print(f"Searching: {q}")
    # Search for top 2 results to avoid Saregama if possible
    cmd = [sys.executable, "-m", "yt_dlp", f"ytsearch3:{q}", "--dump-json"]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        lines = proc.stdout.strip().split('\n')
        found = False
        for line in lines:
            if not line.strip(): continue
            data = json.loads(line)
            uploader = data.get('uploader', '')
            if 'Saregama' not in uploader:
                results.append({
                    'videoId': data['id'],
                    'title': data['title'].replace("'", "\\'"),
                    'artist': uploader.replace("'", "\\'"),
                    'duration': data.get('duration_string', '3:00'),
                    'img': data.get('thumbnails', [{}])[-1].get('url', '')
                })
                found = True
                break
        if not found and lines:
            # Fallback to first
            data = json.loads(lines[0])
            results.append({
                'videoId': data['id'],
                'title': data['title'].replace("'", "\\'"),
                'artist': data.get('uploader', '').replace("'", "\\'"),
                'duration': data.get('duration_string', '3:00'),
                'img': data.get('thumbnails', [{}])[-1].get('url', '')
            })
    except Exception as e:
        print(f"Error on {q}: {e}")

# Output as TS code
print("    'MAHALAYA SONGS': [")
for r in results:
    print(f"      {{ videoId: '{r['videoId']}', title: '{r['title']}', artist: '{r['artist']}', duration: '{r['duration']}', img: '{r['img']}' }},")
print("    ]")
