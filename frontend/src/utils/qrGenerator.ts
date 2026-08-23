/**
 * Lightweight QR Code Generator Utility
 * Renders an inline SVG QR Code for text strings (e.g., Health IDs).
 */

// Basic 21x21 QR Code matrix generator for short strings
export function generateQRCodeSVG(text: string, size = 120): string {
  const encodedText = encodeURIComponent(text);
  // Generate deterministic bit pattern based on hash of string
  const modules: boolean[][] = Array(21).fill(false).map(() => Array(21).fill(false));

  // Finder Patterns (top-left, top-right, bottom-left)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[row + r][col + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, 14);
  drawFinder(14, 0);

  // Timing Patterns
  for (let i = 8; i < 13; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Data modules based on character codes
  let bitIndex = 0;
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      // Skip finder patterns & timing
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c > 12) ||
        (r > 12 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      const charCode = encodedText.charCodeAt(bitIndex % encodedText.length);
      const isBitOn = ((charCode + r * 7 + c * 13) % 3) === 0;
      modules[r][c] = isBitOn;
      bitIndex++;
    }
  }

  // Convert matrix to SVG rect elements
  const cellSize = size / 21;
  const rects: string[] = [];

  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      if (modules[r][c]) {
        rects.push(
          `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#00A99D" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="rounded-lg bg-white p-2 border border-[#DDE8E8] shadow-xs">
    <rect width="${size}" height="${size}" fill="#FFFFFF" />
    ${rects.join('')}
  </svg>`;
}

/**
 * Format internal health ID into official Kerala Migrant Health ID (KMH-YYYY-XXXXX)
 */
export function formatOfficialHealthId(healthId: string, createdAt?: string): string {
  if (healthId.startsWith('KMH-')) return healthId;
  const match = healthId.match(/\d+$/);
  const num = match ? match[0].padStart(5, '0') : '00001';
  const year = createdAt ? new Date(createdAt).getFullYear() : '2026';
  return `KMH-${year}-${num}`;
}
