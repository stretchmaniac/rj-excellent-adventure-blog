# rj-excellent-adventure-blog

Make sure you have `npm` installed locally and accessible via the command line (CMD or Powershell):
```
USER> npm --version
9.6.7
```

Then navigate to the root directory of this project
```
USER> cd .../rj-excellent-adventure-blog
```

and run
```
npm install
```

This installs the necessary `node.js` packages into the `node_modules` folder within `rj-excellent-adventure-blog`.
This install command should be run every time you change the source (e.g., pull changes from GitHub), but does *not* need to be run every time you wish to restart.

To run, from the same `rj-excellent-adventure` folder run
```
npm run dev
```
This will serve the application to `localhost`. Navigate to [http://localhost:8080/](http://localhost:8080/) with your favorite web browser.

Powershell
---
This project makes use of windows powershell scripts, in particular to access microsoft's native file browser. The scripts can be found in the `src/server` folder, and you can run them independently via `.\src\server\openFile.ps1` in a powershell console window.
In order to give permission for powershell to run certain commands, you'll need to run the following command in an administrator powershell window
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
This needs to be done only once.

Stylistic Changes
---
Basic stylistic changes to blog posts can be made in 
```
src/assets/stylesheets/slate/rendered-element.scss
```
Changes here will apply **globally** to all blog posts.