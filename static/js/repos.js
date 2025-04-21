const repoListContainer = document.getElementById("repo-list-container");

document.addEventListener("DOMContentLoaded", loadRepos);

async function loadRepos() {
  try {
    const response = await fetch(REPOS_LIST_ENDPOINT);
    if (!response.ok) {
      throw new Error("Failed to fetch repos.");
    }

    const repos = await response.json();

    if (repos.length === 0) {
      repoListContainer.innerHTML = "<li>No repositories found.</li>";
      return;
    }

    /* Structure:
      {
          "created_at": "2022-01-25T20:40:03Z",
          "name": "https://github.com/..",
          "owner": "...",
          "private": false,
          "updated_at": "2022-06-27T02:54:43Z",
          "url": "https://github.com/..."
        },
    */
    repos.forEach((repo) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = repo.url;
      a.textContent = `${repo.owner}/${repo.name}`;
      a.target = "_blank";
      li.appendChild(a);
      repoListContainer.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    repoListContainer.innerHTML = "<li>Error loading repositories.</li>";
  }
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
