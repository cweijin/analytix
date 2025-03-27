const dropZone = document.getElementById("drop_zone");
const fileInput = document.getElementById("file_input");
const fileList = document.getElementById("file_list");

// Track uploaded files
let files = [];

function selectFile(fileInput) {
  return new Promise((resolve, reject) => {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length === 0) {
        reject("No file selected.");
      } else {
        resolve(fileInput.files);
      }
    });
  });
}

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

dropZone.addEventListener("drop", async (ev) => {
  ev.preventDefault(); // Prevent browser's default behaviour
  dropZone.classList.remove("dragover");

  handleFiles(ev.dataTransfer.files);
});

dropZone.addEventListener("click", async () => {
  fileInput.click();
});

// Handle file selection by clicking
fileInput.addEventListener("change", (ev) => {
  handleFiles(ev.target.files);
});

// Function to handle files
function handleFiles(selectedFiles) {
  const formData = new FormData();

  for (let file of selectedFiles) {
    if (!file.name.match(/\.(csv|xls|xlsx)$/)) {
      alert("Only .csv, .xls and .xlsx files are supported.");
      continue;
    }

    /*  Currently do not support multiple files with same name
        File with same name will overrides the previous. */
    if (!files.includes(file.name)) {
      files.push(file.name);
    }

    formData.append("files", file);
    renderFileList();
  }

  // Send to backend
  fetch("http://localhost:8000/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      let fileNames = data.files.map((f) => f.filename).join(", ");
      alert(`Uploaded: ${fileNames}`);
    })
    .catch((err) => console.error(err));
}

// Function to render file list
function renderFileList() {
  console.log(files);
  fileList.innerHTML = "";

  files.forEach((file, index) => {
    const fileItem = document.createElement("div");
    fileItem.classList.add("file_item");
    fileItem.innerHTML = `
        <span>${file}</span>
        <button class="delete_btn" onclick="removeFile(${index})">&times;</button>
      `;

    fileList.appendChild(fileItem);
  });
}

// Function to remove file
async function removeFile(index) {
  filename = files.splice(index, 1)[0];

  await fetch(`http://localhost:8000/upload/${filename}`, {
    method: "DELETE",
  });

  renderFileList();
}
