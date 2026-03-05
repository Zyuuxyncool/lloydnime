// Quick test script to check API response
const https = require('https');

const url = 'https://api-otakudesu-zeta.vercel.app/anime/anime/yuusha-party-kiyoubinbou-sub-indo';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n=== API Response Summary ===');
      console.log('Status:', json.status);
      console.log('Title:', json.data?.title);
      console.log('Episode Count:', json.data?.episodeList?.length || 0);
      console.log('Has Episodes:', json.data?.episodeList?.length > 0);
      console.log('Recommended Count:', json.data?.recommendedAnimeList?.length || 0);
      
      if (json.data?.episodeList?.length > 0) {
        console.log('\n=== First Episode ===');
        console.log(JSON.stringify(json.data.episodeList[0], null, 2));
      } else {
        console.log('\n⚠️ NO EPISODES FOUND');
        console.log('Data keys:', Object.keys(json.data || {}));
      }
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Raw data:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
});
