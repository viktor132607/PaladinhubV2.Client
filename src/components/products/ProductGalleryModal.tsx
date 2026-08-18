
"use client";
export type ProductGalleryModalProps = { open?: boolean; imageUrl?: string; altText?: string; onClose?: () => void };
export default function ProductGalleryModal({ open = false, imageUrl, altText = "Product image", onClose }: ProductGalleryModalProps) { if (!open) return undefined; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" role="dialog" aria-modal="true"><button type="button" onClick={onClose} className="absolute right-6 top-6 text-3xl text-white" aria-label="Close">×</button>{imageUrl ? <img src={imageUrl} alt={altText} className="max-h-[90vh] max-w-[90vw] object-contain" /> : <p className="text-white">No image selected.</p>}</div>; }
