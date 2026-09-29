import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const url = 'exp://192.168.0.183:8081';
const outputPath = path.resolve('../qr_expo.png');

async function main() {
  // Generate PNG
  await QRCode.toFile(outputPath, url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  console.log('QR Code PNG saved to: ' + outputPath);

  // Generate ASCII terminal string
  const terminalQR = await QRCode.toString(url, { type: 'terminal', small: true });
  console.log('---BEGIN_ASCII_QR---');
  console.log(terminalQR);
  console.log('---END_ASCII_QR---');
}

main().catch(console.error);
