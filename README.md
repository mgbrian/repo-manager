# Github Manager

An app to manage your Github repositories, providing a more convenient way to manage visibility, collaborators and permissions.

## Setup

1. Create a GitHub OAuth App:

   - Go to [GitHub Developer Settings](https://github.com/settings/developers).
   - Register a new OAuth app.
   - Set the `Authorization Callback URL`. This will be `<the app's domain>/callback`. During development, set this to `http://127.0.0.1:5000/callback`.
   - Create a `Client Secret`.

1. Make the installer script executable if it's not already:

   ```sh
   chmod +x install.sh
   ```

1. Run the installer script:

   ```sh
   chmod +x install.sh
   ```

1. **Set Up Environment Variables**
   - The installer script will create a file, `env.py`. Populate it accordingly.

## Running the app

In development:

```sh
source .requirements/bin/activate && python app.py
```
