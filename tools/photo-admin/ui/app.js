const statusElement = document.querySelector("#status");
const setupPanel = document.querySelector("#setup-panel");
const setupMessage = document.querySelector("#setup-message");
const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#file");
const dateInput = document.querySelector("#date");
const dropZone = document.querySelector("#drop-zone");
const dropCopy = document.querySelector("#drop-copy");
const preview = document.querySelector("#preview");
const uploadButton = document.querySelector("#upload-button");
const photoGrid = document.querySelector("#photo-grid");
const photoCount = document.querySelector("#photo-count");
const emptyState = document.querySelector("#empty-state");
const notice = document.querySelector("#notice");
const photoTemplate = document.querySelector("#photo-template");

dateInput.value = new Date().toISOString().slice(0, 10);

async function request(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`);
  return payload;
}

function showNotice(message, isError = false) {
  notice.hidden = false;
  notice.textContent = message;
  notice.style.borderColor = isError ? "var(--danger)" : "var(--line)";
  notice.style.color = isError ? "#ef9c90" : "var(--paper)";
}

function clearNotice() {
  notice.hidden = true;
  notice.textContent = "";
}

async function loadStatus() {
  try {
    const status = await request("/api/status");
    statusElement.classList.toggle("connected", status.connected);
    statusElement.classList.toggle("error", !status.connected);
    statusElement.lastChild.textContent = status.connected ? " R2 已连接" : " R2 尚未连接";
    setupPanel.hidden = status.connected;
    uploadButton.disabled = !status.connected;
    if (!status.connected) {
      setupMessage.textContent = status.missing?.length
        ? `请补齐：${status.missing.join("、")}`
        : `R2 连接失败：${status.error || "请检查凭据与存储桶权限"}`;
    }
  } catch (error) {
    statusElement.classList.add("error");
    statusElement.lastChild.textContent = " 状态检查失败";
    setupPanel.hidden = false;
    setupMessage.textContent = error.message;
    uploadButton.disabled = true;
  }
}

function renderPhotos(photos) {
  photoGrid.replaceChildren();
  photoCount.textContent = `${String(photos.length).padStart(2, "0")} FRAME${photos.length === 1 ? "" : "S"}`;
  emptyState.hidden = photos.length !== 0;

  for (const photo of photos) {
    const card = photoTemplate.content.cloneNode(true);
    const article = card.querySelector(".photo-card");
    const image = card.querySelector("img");
    const time = card.querySelector("time");
    const title = card.querySelector("h3");
    const caption = card.querySelector("p");
    const deleteButton = card.querySelector(".delete-button");

    article.dataset.slug = photo.slug;
    image.src = photo.image;
    image.alt = photo.title;
    time.dateTime = photo.date;
    time.textContent = photo.date || "UNDATED";
    title.textContent = photo.title;
    caption.textContent = photo.caption || photo.location || photo.slug;
    deleteButton.disabled = !photo.managed;
    deleteButton.title = photo.managed ? "同时删除 R2 图片和 Markdown" : "本地旧照片不由 R2 工作台删除";
    deleteButton.addEventListener("click", () => removePhoto(photo, deleteButton));
    photoGrid.append(card);
  }
}

async function loadPhotos() {
  const { photos } = await request("/api/photos");
  renderPhotos(photos);
}

function previewFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  preview.onload = () => URL.revokeObjectURL(url);
  preview.src = url;
  preview.hidden = false;
  dropCopy.hidden = true;
}

fileInput.addEventListener("change", () => previewFile(fileInput.files[0]));

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;
  previewFile(file);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearNotice();
  uploadButton.disabled = true;
  uploadButton.textContent = "正在上传…";
  try {
    await request("/api/photos", { method: "POST", body: new FormData(form) });
    form.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    preview.hidden = true;
    preview.removeAttribute("src");
    dropCopy.hidden = false;
    showNotice("照片已进入 R2，Markdown 已写入 content/photos。现在可以提交并推送。", false);
    await loadPhotos();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = "上传并保存";
  }
});

async function removePhoto(photo, button) {
  const confirmed = window.confirm(`永久删除「${photo.title}」？\n\n这会同时删除 R2 对象和本地 Markdown，无法撤销。`);
  if (!confirmed) return;

  clearNotice();
  button.disabled = true;
  button.textContent = "删除中";
  try {
    await request(`/api/photos/${encodeURIComponent(photo.slug)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmSlug: photo.slug }),
    });
    showNotice(`「${photo.title}」已从 R2 和本地内容中删除。`, false);
    await loadPhotos();
  } catch (error) {
    button.disabled = false;
    button.textContent = "删除";
    showNotice(error.message, true);
  }
}

await Promise.all([loadStatus(), loadPhotos()]).catch((error) => showNotice(error.message, true));
