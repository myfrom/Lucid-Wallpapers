const fs = require('fs').promises,
      sharp = require('sharp');

const script = new Promise(async r => {
  const folders = (await fs.readdir('.', { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name[0] !== '.' && entry.name !== 'node_modules')
    .map(entry => entry.name);

  for (let folder of folders) {
    const images = (await fs.readdir(folder))
      .filter((filename, _, itself) => {
        if (/(_small|_pixel_preview)\.[^\.]+$/.test(filename))
          return false;
        else if (itself.includes(filename.replace(/\.[^\.]+$/, '_small$&')) && itself.includes(filename.replace(/\.[^\.]+$/, '_pixel_preview.txt')))
          return false;
        else
          return true;
      });
    
    for (let image of images) {
      let sharpObject = await sharp(`${folder}/${image}`)
      const metadata = await sharpObject.metadata();
      if (metadata.width > metadata.height) {
        sharpObject = sharpObject.rotate(90);
      }
      // if (metadata.height > 3840) {
      //   await sharpObject.clone()
      //     .resize({ height: 3840 })
      //     .toFile(`${folder}/${image}`);
      // }
      await sharpObject.clone()
        .resize({ height: Math.round(metadata.height / 5) })
        .toFile(`${folder}/${image.replace(/\.[^\.]+$/, '_small$&')}`);
      await sharpObject
        .resize({ height: 40 })
        .toBuffer()
        .then(buf => `data:image/${metadata.format};base64,${buf.toString('base64')}`)
        .then(string => fs.writeFile(`${folder}/${image.replace(/\.[^\.]+$/, '_pixel_preview.txt')}`, string));
    }
  }

  r();
});

script.then(console.log('Finished'));