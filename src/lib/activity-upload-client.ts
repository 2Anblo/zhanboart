const CHUNK_BYTES = 3 * 1024 * 1024;
const UPLOAD_ENDPOINT = "/api/admin/activity-uploads";

export async function readAdminResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {
    if (response.status === 413) throw new Error("上传请求过大，请刷新页面后重试分块上传。");
    throw new Error(`服务器返回异常（HTTP ${response.status}），请稍后重试。`);
  }
  if (!response.ok) throw new Error(data.error || `请求失败（HTTP ${response.status}）`);
  return data as T;
}

export async function saveAdminContent<T>(endpoint: string, method: string, original: FormData): Promise<T> {
  const form = new FormData();
  original.forEach((value, key) => form.append(key, value));
  const tokens: string[] = [];
  let submitted = false;
  let responded = false;
  try {
    if (form.get("type") === "notes") {
      const files = [...form.getAll("imageFiles"), ...form.getAll("imageFile")]
        .filter((value): value is File => value instanceof File && value.size > 0);
      form.delete("imageFiles");
      form.delete("imageFile");
      for (const file of files) {
        const { token } = await readAdminResponse<{ token: string }>(await fetch(UPLOAD_ENDPOINT, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, mime: file.type, size: file.size }),
        }));
        tokens.push(token);
        for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
          const chunk = new FormData();
          chunk.set("token", token);
          chunk.set("index", String(offset / CHUNK_BYTES));
          chunk.set("chunk", file.slice(offset, offset + CHUNK_BYTES), "chunk");
          await readAdminResponse(await fetch(UPLOAD_ENDPOINT, { method: "PUT", body: chunk }));
        }
        form.append("uploadedImages", token);
      }
    }
    submitted = true;
    const response = await fetch(endpoint, { method, body: form });
    responded = true;
    return await readAdminResponse<T>(response);
  } finally {
    // A disconnected save request may still be reading chunks on the server.
    if (!submitted || responded) {
      await Promise.allSettled(tokens.map(token => fetch(UPLOAD_ENDPOINT, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      })));
    }
  }
}
