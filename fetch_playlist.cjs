const ytpl = require('ytpl');
const fs = require('fs');

async function fetchPlaylist() {
  try {
    const playlist = await ytpl('PLe4fZ-180Mkk', { limit: 50 });
    console.log(`Title: ${playlist.title}`);
    console.log(`Items: ${playlist.items.length}`);
    
    let reactCode = `    '${playlist.title.toUpperCase()}': [\n`;
    playlist.items.forEach(item => {
      const title = item.title.replace(/'/g, "\\'");
      const author = item.author.name.replace(/'/g, "\\'");
      const duration = item.duration || '3:00';
      const img = item.bestThumbnail.url;
      reactCode += `      { title: '${title}', artist: '${author}', duration: '${duration}', img: '${img}' },\n`;
    });
    reactCode += `    ],`;
    
    fs.writeFileSync('playlist_data.txt', reactCode);
    console.log('Done! Saved to playlist_data.txt');
  } catch (err) {
    console.error(err);
  }
}

fetchPlaylist();
