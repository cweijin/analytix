const dropZone = document.getElementById("drop_zone");
const fileInput = document.getElementById("file_input");
const fileList = document.getElementById("file_list");
const fileDropdown = document.getElementById("file_dropdown");
const rowInput = document.getElementById("row_input");
const displayBtn = document.getElementById("display_button");
const dataTable = document.getElementById("data_table");
const promptBtn = document.getElementById("prompt_button");
const promptInput = document.getElementById("prompt_input");
const answerDisplay = document.getElementById("answer_display");
const promptHistory = document.getElementById("prompt_history");

let files = []; // Track uploaded files
let prompts = [];

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

// Pass the data to handleFiles() when users drop files
dropZone.addEventListener("drop", async (ev) => {
  ev.preventDefault(); // Prevent browser's default behaviour
  dropZone.classList.remove("dragover");

  handleFiles(ev.dataTransfer.files);
});

// Alternatively, users can click on the drop region to upload files
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
      let filenames = data.files.map((f) => f.filename).join(", ");
      alert(`Uploaded: ${filenames}`);
      updateDropdown();
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
        <button class="delete_button" onclick="removeFile(${index})">&times;</button>
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
  updateDropdown();
}

// To update the dropdown menu of display row section
function updateDropdown() {
  fileDropdown.innerHTML = files
    .map((file) => `<option value="${file}">${file}</option>`)
    .join("");
}

// Build the table when display button is clicked
displayBtn.addEventListener("click", () => {
  const rows = rowInput.value;
  const file = fileDropdown.value;

  if (!file || !rows) {
    alert("Please select a file and specify rows!");
    return;
  }

  const formData = new FormData();
  formData.append("filename", file);
  formData.append("rows", rows);

  fetch("http://localhost:8000/get_rows", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => displayTable(data))
    .catch((err) => console.error("Error fetching rows:", err));
});

function displayTable(data) {
  dataTable.innerHTML = "";
  if (data.error) {
    alert(data.error);
    return;
  }

  if (data.length === 0) {
    dataTable.innerHTML = "<tr><td>No Data Found</td></tr>";
    return;
  }

  // Create headers
  const headers = Object.keys(data[0]);
  const thead = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const rows = data
    .map(
      (row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`
    )
    .join("");
  dataTable.innerHTML = thead + rows;
}

// Ask Question
promptBtn.addEventListener("click", () => {
  const prompt = promptInput.value;
  const file = fileDropdown.value;

  if (!prompt || !file) {
    alert("Enter a prompt and select a file!");
    return;
  }

  savePromptHistory(file, prompt);

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("filename", file);

  fetch("http://localhost:8000/ask", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.type === "plot") {
        // Display the plot as an image
        answerDisplay.innerHTML = `<img src="data:image/png;base64,${data.answer}" alt="Plot" />`;
      } else {
        // Display the text response
        answerDisplay.textContent = data.answer;
      }
    })
    .catch((err) => console.error(err));
});

// Save prompt history
function savePromptHistory(filename, prompt) {
  const newPrompt = { filename: filename, prompt: prompt };

  //Duplicate check
  if (
    prompts.some((item) => item.filename === filename && item.prompt === prompt)
  )
    return;

  // Add the new prompt to the history
  prompts.push(newPrompt);

  // Ensure prompt history not exceeding 5
  if (prompts.length > 5) {
    prompts.shift();
  }

  updatePromptHistory();
}

// Fetch and display prompt history
function updatePromptHistory() {
  promptHistory.innerHTML = prompts
    .map(
      (item, index) => `
      <li>
        <button class="history_item" onclick="reusePrompt(${index})">${item.prompt}</button>
      </li>
    `
    )
    .join("");
}

// Reuse a prompt
function reusePrompt(index) {
  const prompt = prompts[index].prompt;
  const filename = prompts[index].filename;
  promptInput.value = prompt;
  fileDropdown.value = filename;
}
