# Longin-Discord-Bot
## Instalation (for JS version)
1. clone repository
2. get into the folder
3. install discord and database packages:

sudo apt-get install nodejs-legacy

npm install --save discord.js

npm install --save sequelize

npm install --save sqlite3

4. rename 'rename_to_config.json' file to 'config.json' or copy it and rename the copy
5. edit 'config.json' and put aplication token in designated place
6. create database with command:

node dbInit.js

7. run bot with:

node bot.js
