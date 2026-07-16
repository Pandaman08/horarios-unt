export function hasAvailableSpace(currentY: number, pageHeight: number, margin: number, requiredSpace: number): boolean {
  return currentY + requiredSpace < pageHeight - margin;
}
