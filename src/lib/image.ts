/**
 * Downscales an image file in the browser and returns a JPEG data URL.
 * Used for logo uploads: ~512px JPEG keeps the server-action payload tiny
 * (typically 20–80KB, far under the 1MB body limit). Transparency is
 * flattened onto white so dominant-color reads stay accurate.
 */
export async function downscaleImage(
  file: File,
  maxDim = 512
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not read the image. Try a different file.")

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL("image/jpeg", 0.8)
}
