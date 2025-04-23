const refreshButton = document.getElementById("refresh-button");
const lastRefreshedText = document.getElementById("last-refreshed-text");
const searchInput = document.getElementById("search-input");
const publicReposOnlyCheckbox = document.getElementById("visibility-filter-public");
const privateReposOnlyCheckbox = document.getElementById("visibility-filter-private");
const repoListContainer = document.getElementById("repo-list-container");


publicReposOnlyCheckbox.addEventListener("change", handleVisibilityCheckboxToggle);
privateReposOnlyCheckbox.addEventListener("change", handleVisibilityCheckboxToggle);

// Repos loaded from the backend
let loadedRepos = [];
// Time repos were last refreshed from the DB.
let lastRefreshedTime;
// The type of repos to display, based on visibility: "all", "private", "public"
let visibilitySubset = "all";

document.addEventListener("DOMContentLoaded", () => {
  renderRepos(true);
});
refreshButton.addEventListener("click", () => {
  renderRepos(true)
})
searchInput.addEventListener("input", () => {
  renderRepos();
});

/* Fetch list of repositories from the backend.

  @returns {Array<Object>} - An array of repository objects.
*/
async function loadRepos() {
  const response = await fetch(REPOS_LIST_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to fetch repos.");
  }

  return await response.json();
}

/* Render list of repositories in the UI, applying any filters from the UI.

  @param {boolean} refreshFromDB - Whether to refresh repos from the server.
    If this is set to false, the repo list most recently pulled from the server
    is used. Default = false.
*/
async function renderRepos(refreshFromDB = false) {
  if (refreshFromDB) {
    try {
      loadedRepos = await loadRepos();
      lastRefreshedTime = new Date();
      if (lastRefreshedTime){
        lastRefreshedText.textContent = `Last Refreshed: ${lastRefreshedTime.toLocaleString()}`
      }
    } catch (err) {
      console.error(err);
      repoListContainer.innerHTML = "<p>Error loading repositories.</p>";
      return;
    }
  }

  displayedRepos = filterRepos(loadedRepos);

  if (displayedRepos.length === 0) {
    repoListContainer.innerHTML = "<p>No repositories to display.</p>";
    return;
  }

  // Clear contents from previous run.
  repoListContainer.innerHTML = "";

  const repoListTable = document.createElement("table");
  repoListTable.id = "repo-list-table";
  repoListTable.innerHTML = "";
  const repoTableBody = document.createElement("tbody");

  displayedRepos.forEach((repo) => {
    const toggleVisibilityUrlGenerator = repo.private ? generateMakePublicUrl : generateMakePrivateUrl;
    const toggleVisibilityLink = toggleVisibilityUrlGenerator(repo.name);
    const created = new Date(repo.created_at).toLocaleString();
    const updated = new Date(repo.updated_at).toLocaleString();

    repoTableBody.innerHTML += `
        <tr data-created-date="${created}" data-updated-date="${updated}">
          <td><a href="${repo.url}" target="_blank">${repo.name}</a></td>
          <td class="visibility-cell">
            ${repo.private ? "Private" : "Public"}
          </td>
          <td class="actions-cell">
            <div class="action-buttons-container">
              <button class="toggle-visibility-button" data-href="${toggleVisibilityLink}">
                <span class="material-icons toggle-visibility-icon">${repo.private ? "visibility" : "visibility_off"}</span>
              </button>
              <button class="collaborators-button" data-href="">
                <span class="material-icons show-collaborators-icon">group</span>
              </button>
            </div>
          </td>
        </tr>
      `;
  });

  const toggleVisibilityButtons = repoTableBody.getElementsByClassName(
    "toggle-visibility-button",
  );
  for (let button of toggleVisibilityButtons) {
    button.addEventListener("click", toggleVisibility);
  }
  repoListTable.appendChild(repoTableBody);
  repoListContainer.appendChild(repoListTable);
}

/* Event handler for the repo visibility toggle buttons. */
async function toggleVisibility(event) {
  const clickedButton = event.currentTarget;

  const toggleVisibilityLink = clickedButton.dataset.href;

  const response = await fetch(toggleVisibilityLink);
  if (!response.ok) {
    throw new Error("Error toggling visibility.");
  }

  renderRepos(true);
}

/* Applies the current UI filters to a list of repos and returns the resulting subset.

  @param {Array<Object>} - An array of repos.

  @returns {Array<Object>} - A subset of the input array with filters applied.
*/
function filterRepos(repos) {
  let filteredRepos = repos;
  if (visibilitySubset == "private") {
    filteredRepos = filteredRepos.filter((repo) => repo.private);
  } else if (visibilitySubset == "public") {
    filteredRepos = filteredRepos.filter((repo) => !repo.private);
  }

  filteredRepos = filteredRepos.filter((repo) =>
    repo.name.includes(searchInput.value.trim()),
  );

  return filteredRepos;
}

/* Event handler for the repo visibility filter checkboxes.

  Ensures at most one filter is active at a time (but both can be off).
*/
function handleVisibilityCheckboxToggle(event) {
  const selectedCheckbox = event.target;

  if (selectedCheckbox === publicReposOnlyCheckbox && publicReposOnlyCheckbox.checked) {
    privateReposOnlyCheckbox.checked = false;
  } else if (selectedCheckbox === privateReposOnlyCheckbox && privateReposOnlyCheckbox.checked) {
    publicReposOnlyCheckbox.checked = false;
  }

  if (privateReposOnlyCheckbox.checked) {
    visibilitySubset = "private";
  } else if (publicReposOnlyCheckbox.checked) {
    visibilitySubset = "public";
  } else {
    visibilitySubset = "all";
  }

  renderRepos();
}

/* Add a collaborator to a repository.

  @param {string} repoName - The name of the repo (just the name, without the
    owner username).
  @param {string} username - The GitHub username to add as collaborator.
*/
async function addCollaborator(repoName, username) {
  try {
    // TODO: Parametrize this!
    const response = await fetch(`/api/repos/${repoName}/collaborators/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error:", errorData);
      alert(
        "Failed to add collaborator: " + (errorData.error || "Unknown error"),
      );
    } else {
      const data = await response.json();
      console.log("Success:", data);
      alert(data.message);
    }
  } catch (error) {
    console.error("Request failed:", error);
    alert("An unexpected error occurred.");
  }
}
