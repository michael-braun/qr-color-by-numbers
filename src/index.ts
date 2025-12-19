import QRCode from 'qrcode-svg';

const qrCode = new QRCode({
  content: 'Hallo Sebastian!',
  ecl: 'L',
});

const modules = qrCode.qrcode.modules;

function columnName(index: number, oneBased = false): string {
  let n = index + 1;
  if (n <= 0) throw new RangeError('Index must be positive when oneBased=true or >=0 when oneBased=false');
  let result = '';
  while (n > 0) {
    n--; // adjust to 0..25
    const char = String.fromCharCode(65 + (n % 26)); // 65 = 'A'
    result = char + result;
    n = Math.floor(n / 26);
  }
  return result;
}

// Neue Funktion: erzeugt eine Liste von Spaltennamen (0-basiert standardmäßig)
function generateColumnNames(length: number, oneBased = false): string[] {
  if (!Number.isFinite(length) || length < 0) {
    throw new RangeError('length must be a non-negative finite number');
  }
  const names: string[] = [];
  for (let i = 0; i < Math.floor(length); i++) {
    names.push(columnName(i, oneBased));
  }
  return names;
}

const length = modules.length;
const columnNames: Array<string> = generateColumnNames(length);

const elements = [];

for (let y = 0; y < length; y++) {
  for (let x = 0; x < length; x++) {
    const module = modules[x][y];
    if (module) {
      elements.push(`${columnNames[x]}${y + 1}`)
    }
  }
}

console.log(`Columns: ${columnNames.join(', ')}`)
console.log(elements.join(' '));
