/** Viewer-selectable color skins. Values map to `:root[data-skin=…]` in globals.css. */
export const SKINS = [
  { id: "moph", label: "สธ. เขียว–ส้ม (ค่าเริ่มต้น)", swatch: ["#1f8a55", "#f26a2e"] },
  { id: "mint", label: "มิ้นต์", swatch: ["#34c48f", "#7cc8f2"] },
  { id: "sky", label: "ฟ้าใส", swatch: ["#4b9cf0", "#9ab4ff"] },
  { id: "peach", label: "พีช", swatch: ["#ff9466", "#ffc46b"] },
  { id: "lavender", label: "ลาเวนเดอร์", swatch: ["#a07cf0", "#f59ac8"] },
  { id: "classic", label: "เขียวเข้ม (เดิม)", swatch: ["#0e3d2e", "#4cc79a"] },
  { id: "night", label: "โหมดกลางคืน", swatch: ["#0d1612", "#4cc79a"] },
] as const;

export type SkinId = (typeof SKINS)[number]["id"];

export const DEFAULT_SKIN: SkinId = "moph";
export const SKIN_STORAGE_KEY = "bgs-skin";

/**
 * Runs before first paint (inline in <head>) so the saved skin applies without a flash.
 * Only known ids are applied; storage errors (private mode) fall back to the default.
 */
export const skinBootScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  SKIN_STORAGE_KEY,
)});var ok=${JSON.stringify(SKINS.map((s) => s.id))};if(s&&ok.indexOf(s)>-1&&s!==${JSON.stringify(
  DEFAULT_SKIN,
)}){document.documentElement.setAttribute("data-skin",s);}}catch(e){}})();`;
