@echo off

set CMD=%1

if "%CMD%" == "--update" (
  echo Update code
  git stash
  git pull
  echo Install node modules
  npm install
  echo Done.
) else (
	electron . %*
)