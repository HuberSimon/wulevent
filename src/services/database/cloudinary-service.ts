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