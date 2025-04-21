from functools import wraps
import os

import httpx
from quart import Quart, session, redirect, request, render_template, url_for, jsonify

try:
    import env
except ImportError:
    print("env.py file not found. Create one based on sample_env.py.")


FLASK_SECRET_KEY = os.environ.get("FLASK_SECRET_KEY")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")
GITHUB_API_URL = "https://api.github.com"


if not all([FLASK_SECRET_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET]):
    raise RuntimeError("Set all the required environment variables. See sample_env.py.")


app = Quart(__name__)
app.secret_key = FLASK_SECRET_KEY


def login_required(json_response=False):
    """View decorator to confirm login. Redirects or returns JSON error on failure.

    Args:
        json_response: bool - Whether to return a JSON response instead of
            redirecting on failure. Default False.
    """
    def decorator(f):
        @wraps(f)
        async def decorated_view(*args, **kwargs):
            # Login check
            if "github_user" not in session:
                if json_response:
                    return jsonify({"error": "Login required"}), 401

                return redirect(url_for("login"))

            return await f(*args, **kwargs)
        return decorated_view
    return decorator


def github_headers():
    return {"Authorization": f"token {session.get('github_token')}"}


@app.route("/")
async def home():
    if "github_user" in session:
        return redirect(url_for("repos"))

    return await render_template("index.html")


@app.route("/login")
async def login():
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}&scope=repo"
    )
    return redirect(github_auth_url)


@app.route("/callback")
async def callback():
    code = request.args.get("code")
    if not code:
        return "Error: No code provided", 400

    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, json=data, headers=headers)
        token_data = resp.json()

    if resp.status_code != 200:
        return "Error fetching token", 400

    session["github_token"] = token_data["access_token"]

    # Fetch username for session
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(f"{GITHUB_API_URL}/user", headers=github_headers())
        user_data = user_resp.json()

    session["github_user"] = user_data["login"]
    return redirect("/repos")


@app.route("/repos")
@login_required()
async def repos():
    return await render_template("repos.html")


@app.route("/api/repos")
@login_required(json_response=True)
async def list_repos():
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API_URL}/user/repos", headers=github_headers())

    if resp.status_code != 200:
        return jsonify({"error": "Failed to fetch repos"}), 400

    repo_data = [
        {
            "name": repo["html_url"],
            "url": repo["html_url"],
            "owner": repo["owner"]["login"],
            "private": repo["private"],
            "created_at": repo["created_at"],
            "updated_at": repo["updated_at"],
        }
        for repo in resp.json()
    ]

    return jsonify(repo_data)


@app.route("/api/repos/<string:repo>/make-private", methods=["GET"])
@login_required(json_response=True)
async def make_private(repo):
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{GITHUB_API_URL}/repos/{session['github_user']}/{repo}",
            headers=github_headers(),
            json={"private": True},
        )

    # TODO: More granular error-handling e.g. repo not found/not owned by user.
    if resp.status_code != 200:
        return jsonify({"error": "Failed to update visibility to private."}), 400

    return jsonify({"message": f"Repo '{repo}' is now private."})


@app.route("/api/repos/<string:repo>/make-public", methods=["GET"])
@login_required(json_response=True)
async def make_public(repo):
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{GITHUB_API_URL}/repos/{session['github_user']}/{repo}",
            headers=github_headers(),
            json={"private": False},
        )

    if resp.status_code != 200:
        return jsonify({"error": "Failed to update visibility to public."}), 400

    return jsonify({"message": f"Repo '{repo}' is now public."})


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000,
    )
