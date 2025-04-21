const repoListContainer = document.getElementById("repo-list-container");

document.addEventListener("DOMContentLoaded", renderRepos);

async function loadRepos() {
  try {
    const response = await fetch(REPOS_LIST_ENDPOINT);
    if (!response.ok) {
      throw new Error("Failed to fetch repos.");
    }

    const repos = await response.json();
    return repos;
  } catch (err) {
    console.error(err);
    repoListContainer.innerHTML = "<p>Error loading repositories.</p>";
  }
}

async function renderRepos() {
  const repos = await loadRepos();
  if (repos.length === 0) {
    repoListContainer.innerHTML = "<p>No repositories found.</p>";
    return;
  }
  const repoListTable = document.createElement("table");
  repoListTable.id = "repo-list-table";
  repoListTable.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Visibility</th>
            <th></th>
          </tr>
        </thead>
    `;
  const repoTableBody = document.createElement("tbody");

  repos.forEach((repo) => {
    const toggleVisibilityUrlGenerator = repo.private
      ? generateMakePublicUrl
      : generateMakePrivateUrl;
    const toggleVisibilityLink = toggleVisibilityUrlGenerator(repo.name);
    const created = new Date(repo.created_at).toLocaleString();
    const updated = new Date(repo.updated_at).toLocaleString();

    repoTableBody.innerHTML += `
        <tr data-created-date="${created}" data-updated-date="${updated}">
          <td><a href="${repo.url}" target="_blank">${repo.name}</a></td>
          <td class="visibility-cell">
            ${repo.private ? "Private" : "Public"}
            <button class="toggle-visibility-button" data-href="${toggleVisibilityLink}">Toggle</button>
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

async function toggleVisibility(event) {
  const clickedButton = event.currentTarget;

  const toggleVisibilityLink = clickedButton.dataset.href;

  const response = await fetch(toggleVisibilityLink);
  if (!response.ok) {
    throw new Error("Error toggling visibility.");
  }

  renderRepos();
}

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
