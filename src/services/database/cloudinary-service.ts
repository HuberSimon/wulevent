const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME;

export const uploadImageToCloudinary = async (
  file: File,
  eventId: string
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "wulevent");
  formData.append("folder", `events/${eventId}/moments`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  return data.secure_url;
};

export const optimizedCloudinaryUrl = (url: string, width?: number) => {
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const transformation = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";

  return (
    url.slice(0, idx + marker.length) +
    transformation +
    "/" +
    url.slice(idx + marker.length)
  );
};

export const deleteFromCloudinary = async (imageUrls: string[]): Promise<void> => {
  if (imageUrls.length === 0) return;
  try {
    const res = await fetch("/.netlify/functions/deleteCloudinaryImages", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageUrls }),
    });
    if (!res.ok) throw new Error(`Server antwortete mit ${res.status}`);
    const data = await res.json();
    console.log("Cloudinary delete results:", data.results);
  } catch (err) {
    console.warn("Cloudinary-Löschung fehlgeschlagen:", err);
  }
};