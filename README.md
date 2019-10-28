## Setup

    npm i

Before running anything locally, create a `.env` file and initialize your env variable like so:

    DB=mongodb://localhost:27017/boilerplate
    SECRET_KEY=NSA
    REACT_APP_URL=http://localhost:3000 // when cors is enabled, this will be the only origin to send requests

PS: if you're deploying to a VPS/VPC u should have another `.env.production` file and add some logic to handle that on the `./config/config.js` file.

Start the db locally

    npm run database

PS: replace `mongo-data` with the name of the folder your data is stored.

start dev server

    npm run dev

start prod server

    npm start
