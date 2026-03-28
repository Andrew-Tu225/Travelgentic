/**
 * Map destination names to Unsplash images for trip/destination cards.
 * Falls back to a generic travel image when no match is found.
 */
const DESTINATION_IMAGES = {
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
  indonesia: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
  japan: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
  france: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
  santorini: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800",
  greece: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800",
  venice: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=800",
  italy: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=800",
  lisbon: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=800",
  portugal: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=800",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=800",
  spain: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=800",
  dubrovnik: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800",
  croatia: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=800",
  reykjavik: "https://images.unsplash.com/photo-1520769945061-0a448c463865?q=80&w=800",
  iceland: "https://images.unsplash.com/photo-1520769945061-0a448c463865?q=80&w=800",
  marrakech: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=800",
  morocco: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=800",
  medellín: "https://images.unsplash.com/photo-1587595431973-160dcdf9e76d?q=80&w=800",
  colombia: "https://images.unsplash.com/photo-1587595431973-160dcdf9e76d?q=80&w=800",
  prague: "https://images.unsplash.com/photo-1541849546-216549ae216d?q=80&w=800",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800",
  swiss: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800",
  zermatt: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800",
  tbilisi: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800",
  georgia: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800";

export function getDestinationImage(destination) {
  if (!destination) return FALLBACK_IMAGE;
  const key = destination.toLowerCase().split(/[, ]/)[0];
  return DESTINATION_IMAGES[key] || FALLBACK_IMAGE;
}
