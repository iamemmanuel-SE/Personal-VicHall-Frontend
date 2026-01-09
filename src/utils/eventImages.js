// src/utils/eventImages.js

import Royal_orchestra from "../assets/Royal_orchestra.jpg";
import romeo_julient from "../assets/romeo_julient.jpg";
import ricky_gervais_humanity from "../assets/ricky_gervais_humanity.jpg";
import michael_comedy from "../assets/michael_comedy.jpg";
import poster_cranium from "../assets/poster_cranium.png";
import poster_russ from "../assets/poster_russ.png";
import poster_sot from "../assets/poster_sot.png";
import poster_xmas from "../assets/poster_xmas.png";
import jazz_jam from "../assets/jazz_jam.jpeg";

/**
 * Raw map (you can keep adding images here).
 * The KEYS are the "canonical" keys you want to reference (or infer).
 */
const RAW_EVENT_IMAGE_MAP = {
  Royal_orchestra,
  poster_cranium,
  poster_russ,
  poster_sot,
  poster_xmas,
  romeo_julient,
  ricky_gervais_humanity,
  michael_comedy,
  jazz_jam,
};

/**
 * Normalize any incoming DB value to match our keys:
 * - supports "/assets/foo.jpg", "foo.jpg", "foo", "Foo Bar.png"
 * - strips directories and extensions
 * - makes it case-insensitive
 * - treats spaces/hyphens/underscores the same
 */
function normalizeKey(input = "") {
  let s = String(input || "").trim();
  if (!s) return "";

  // remove query/hash
  s = s.split("?")[0].split("#")[0];

  // keep only filename part if path is provided
  const parts = s.split("/");
  s = parts[parts.length - 1];

  // strip extension
  s = s.replace(/\.(png|jpe?g|webp|gif|svg)$/i, "");

  // normalize separators + casing
  s = s
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");

  return s;
}

/**
 * Build a normalized lookup map so we can match many variants.
 */
const NORMALIZED_IMAGE_MAP = Object.entries(RAW_EVENT_IMAGE_MAP).reduce(
  (acc, [k, v]) => {
    acc[normalizeKey(k)] = v;
    return acc;
  },
  {}
);

/**
 * You can still export this if you want to inspect it elsewhere,
 * but use resolveEventImage() for real matching.
 */
export const EVENT_IMAGE_MAP = RAW_EVENT_IMAGE_MAP;

export function resolveEventImage(event) {
  // 1) If DB provides a key / filename / path:
  const raw = (event?.imageUrl || event?.imageKey || "").trim();
  const nk = normalizeKey(raw);
  if (nk && NORMALIZED_IMAGE_MAP[nk]) return NORMALIZED_IMAGE_MAP[nk];

  // 2) fallback: auto-match by title keywords
  const t = (event?.title || "").toLowerCase();

  if (t.includes("royal philharmonic")) return RAW_EVENT_IMAGE_MAP.Royal_orchestra;
  if (t.includes("cranium")) return RAW_EVENT_IMAGE_MAP.poster_cranium;
  if (t.includes("ross noble")) return RAW_EVENT_IMAGE_MAP.poster_russ;
  if (t.includes("sot classics")) return RAW_EVENT_IMAGE_MAP.poster_sot;
  if (t.includes("christmas")) return RAW_EVENT_IMAGE_MAP.poster_xmas;
  if (t.includes("romeo") && t.includes("juliet")) return RAW_EVENT_IMAGE_MAP.romeo_julient;
  if (t.includes("ricky gervais")) return RAW_EVENT_IMAGE_MAP.ricky_gervais_humanity;
  if (t.includes("michael mcintyre") || t.includes("michael")) return RAW_EVENT_IMAGE_MAP.michael_comedy;
  if (t.includes("jazz")) return RAW_EVENT_IMAGE_MAP.jazz_jam;

  return null;
}
