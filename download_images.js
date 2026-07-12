const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
         return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const dir = 'c:/Users/hp/Desktop/Manaraa/assets/images';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

Promise.all([
  download('https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Emblem_of_Nepal.svg/300px-Emblem_of_Nepal.svg.png', path.join(dir, 'emblem_nepal.png')),
  download('https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Flag_of_Nepal.svg/200px-Flag_of_Nepal.svg.png', path.join(dir, 'flag_nepal.png'))
]).then(() => console.log('Downloaded')).catch(console.error);
