export const uploadImageToCloudinary = async (
  file: File,
  eventId: string
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "wulevent");
  formData.append("folder", `events/${eventId}/moments`);
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dbn58pwgq/image/upload",
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