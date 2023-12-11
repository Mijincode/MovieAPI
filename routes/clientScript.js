const movieDataContainer = document.getElementById("movieData");
const loading = document.getElementById("loading");
const dataDiv = document.getElementById("details");
const uploadedPoster = document.createElement("img");
const responseDetails = document.getElementById("codeElement");

//Input fields
const inputTitle = document.getElementById("title");
const inputId = document.getElementById("imdbID");
const inputGetPoster = document.getElementById("posterInput");
const inputUploadPoster = document.getElementById("posterId");
const inputChooseFile = document.getElementById("posterFile");
const inputYear = document.getElementById("year");
const inputRegisterEmail = document.getElementById("registerEmail");
const inputRegisterPassword = document.getElementById("registerPassword");
const inputLoginEmail = document.getElementById("loginEmail");
const inputLoginPassword = document.getElementById("loginPassword");

let response;
let uploadedResponse;
let data;
let url;

async function getData(event, searchType) {
  event.preventDefault();
  dataDiv.textContent = "";

  if (uploadedPoster) {
    uploadedPoster.remove();
  }

  movieDataContainer.appendChild(responseDetails);

  if (searchType === "title") {
    const title = document.getElementById("title").value;
    const year = document.getElementById("year").value; // Add this line
    url = `http://localhost:3000/movies/search?title=${title}&year=${year}`; // Modify this line
  } else if (searchType === "id") {
    const imdbID = document.getElementById("imdbID").value;
    url = `http://localhost:3000/movies/data/${imdbID}`;
  }

  dataDiv.textContent = "Loading...";

  response = await fetch(url);

  data = await response.json();
  clearInputs();

  dataDiv.textContent = JSON.stringify(data, null, 2);
  loading.innerText = "";
}

async function getPoster(event) {
  event.preventDefault();
  dataDiv.textContent = "";

  if (responseDetails) {
    responseDetails.remove();
  }

  dataDiv.textContent = "Loading...";

  const imdbID = document.getElementById("posterInput").value;

  try {
    const response = await fetch(`http://localhost:3000/posters/${imdbID}`);

    const blob = await response.blob();
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);

    if (movieDataContainer.querySelector("img") !== null) {
      uploadedPoster.src = imageUrl;
    } else {
      movieDataContainer.appendChild(uploadedPoster);
      uploadedPoster.src = imageUrl;
    }

    dataDiv.textContent = response.status; // JSON.stringify(response.blob, null, 2);

    clearInputs();
  } catch (error) {
    console.error("Error during fetch:", error);
    dataDiv.textContent = "Error fetching poster. Please check the IMDb ID.";
  }
}

// Upload an alternative poster: saves locally, but for some reason can't stop page refresh on initial upload
async function uploadPoster(event) {
  event.preventDefault();

  const imdbID = document.getElementById("posterId").value;
  const fileInput = document.getElementById("posterFile");
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("poster", file);
  formData.append("id", imdbID);

  // Clear existing messages
  dataDiv.textContent = "";

  try {
    const response = await fetch(
      `http://localhost:3000/posters/add/${imdbID}`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    clearInputs();
    dataDiv.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error during fetch:", error);
  }

  return false;
}

function clearInputs() {
  inputTitle.value = "";
  inputId.value = "";
  inputGetPoster.value = "";
  inputUploadPoster.value = "";
  inputChooseFile.value = "";
  inputYear.value = "";
  inputRegisterEmail.value = "";
  inputRegisterPassword.value = "";
  inputLoginEmail.value = "";
  inputLoginPassword.value = "";
}

// User Register
async function userRegister(event) {
  let responseData;
  event.preventDefault();
  const registerEmail = document.getElementById("registerEmail").value;
  const registerPassword = document.getElementById("registerPassword").value;
  dataDiv.textContent = "";

  try {
    const response = await fetch("http://localhost:3000/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registerEmail, registerPassword }),
    });

    responseData = await response.json();
    clearInputs();
    dataDiv.textContent = JSON.stringify(responseData, null, 2);
  } catch (error) {
    // dataDiv.textContent = JSON.stringify(responseData, null, 2);
    console.error("Error during user registration.", error);
    dataDiv.textContent = "Error during user registration.";
  }
}

// User Login
async function userLogin(event) {
  event.preventDefault();
  const loginEmail = document.getElementById("loginEmail").value;
  const loginPassword = document.getElementById("loginPassword").value;
  dataDiv.textContent = "";

  try {
    const response = await fetch("http://localhost:3000/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loginEmail, loginPassword }),
    });

    const responseData = await response.json();
    document.cookie = `jwt=${responseData.token}; path=/; Secure; SameSite=None; HttpOnly`; // This workd - token set in cookie
    clearInputs();
    dataDiv.textContent = JSON.stringify(responseData, null, 2);
  } catch (error) {
    console.error("Error during fetch:", error);
    // dataDiv.textContent = "Error during user login.";
  }
}
