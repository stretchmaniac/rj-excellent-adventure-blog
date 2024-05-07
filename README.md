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

You'll need to install a modern version of powershell, since the powershell.exe found on windows 11 actually points to a [legacy version](https://stackoverflow.com/questions/60124810/what-is-the-difference-between-pwsh-and-powershell-integrated-console-on-vs), and the modified multi-select file picker found from [here](https://stackoverflow.com/questions/18956836/openfiledialog-load-files-in-the-same-order-as-the-user-selected-them/77423151#77423151) requires more modern .NET. Installation instructions can be found here (the `winget` option works great with just a few (legacy) powershell commands):
 - https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4

 After installation, you'll need to add `pwsh.exe` to your PATH environment variable. Search "environment variable" in the windows search bar to find the relevant control panel entry. The actual executable `pwsh.exe` can be found in the `C:\Program Files\PowerShell\7` folder, which should be the folder added to PATH.


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