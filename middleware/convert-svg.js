import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const urlCache = new Map();

const downloadAndConvertSvg = async (svgUrl, folderName) => {
  if (
    typeof svgUrl !== 'string' ||
    svgUrl.startsWith(`/uploads/${folderName}/`)
  ) {
    return svgUrl;
  }

  if (urlCache.has(svgUrl)) {
    return urlCache.get(svgUrl);
  }

  try {
    let fileId;
    try {
      fileId = svgUrl.split('/d/')[1].split('/view')[0];
    } catch (error) {
      console.error('Failed to split svgUrl:', svgUrl);
      return undefined;
    }
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const pngFilename = `${fileId}.png`;

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const pngPath = path.join(
      dirname,
      '..',
      'uploads',
      folderName,
      pngFilename
    );

    if (fs.existsSync(pngPath)) {
      const localUrl = `/uploads/${folderName}/${pngFilename}`;
      return localUrl;
    }

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
    });

    const pngBuffer = await sharp(response.data).png().toBuffer();

    fs.mkdirSync(path.dirname(pngPath), { recursive: true });

    fs.writeFileSync(pngPath, pngBuffer);

    const localUrl = `/uploads/${folderName}/${pngFilename}`;

    urlCache.set(svgUrl, localUrl);

    return localUrl;
  } catch (error) {
    console.error('Failed to download and convert SVG:', error);
  }
};

export default downloadAndConvertSvg;
