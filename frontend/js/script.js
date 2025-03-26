const dropZone = document.getElementById("drop_zone");
const fileInput = document.getElementById("file_input");

// Highlight the drop zone when file(s) are dragged over
dropZone.addEventListener("dragover", (ev) => {
  console.log("File(s) in drop zone");

  ev.preventDefault(); // Prevent browser's default behaviour

  dropZone.classList.add("dragover");
});

// Remove highlight when file(s) leave the drop zone
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (ev) => {
  console.log("File(s) dropped");

  ev.preventDefault(); // Prevent browser's default behaviour
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});
