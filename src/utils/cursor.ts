export function encodeCursorFromIndex(idx: number) {
  return Buffer.from(String(idx)).toString('base64');
}

export function decodeCursorToIndex(cursor: string) {
  try {
    return Number(Buffer.from(cursor, 'base64').toString('utf8'));
  } catch (e) {
    return 0;
  }
}
