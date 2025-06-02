// /js/utils/detectMobile.js
export function detectMobile() {
  // 1) Try the modern hint
  if (navigator.userAgentData?.mobile !== undefined) {
    return navigator.userAgentData.mobile;
  }
  // 2) Fall back to pointer check
  if (window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }
  // 3) Finally, fall back to UA regex
  return /Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
}
