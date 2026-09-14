export async function digestBytes(bytes) {
  const value = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(value), n => n.toString(16).padStart(2, '0')).join('');
}

/** Pick/request access while the Save click still has user activation. */
export async function savePDFFile({ handle, expectedDigest, name, makeBytes, picker = globalThis.showSaveFilePicker?.bind(globalThis) }) {
  let target = handle;
  if (!target && typeof picker === 'function') {
    target = await picker({ suggestedName: name, types: [{ description: 'PDF document', accept: { 'application/pdf': ['.pdf'] } }] });
    expectedDigest = null; // Choosing an existing Save As target is an explicit overwrite choice.
  }
  if (target) {
    const permission = target.requestPermission ? await target.requestPermission({ mode: 'readwrite' }) : 'granted';
    if (permission !== 'granted') throw new Error('File write permission was not granted. The PDF was not changed.');
    if (expectedDigest) {
      const latest = await target.getFile();
      if (await digestBytes(await latest.arrayBuffer()) !== expectedDigest) {
        throw new Error('This file was changed outside the app. Reopen it before saving to avoid overwriting those changes.');
      }
    }
  }
  const bytes = await makeBytes();
  if (!target) return { mode: 'download', bytes, name };
  let writable;
  try {
    writable = await target.createWritable();
    await writable.write(bytes);
    await writable.close();
  } catch (error) {
    try { await writable?.abort(); } catch {}
    throw new Error('The PDF could not be saved to that file. Your workspace is still open. ' + (error.message || ''), { cause: error });
  }
  return { mode: 'file', bytes, name: target.name || name, handle: target, digest: await digestBytes(bytes) };
}
