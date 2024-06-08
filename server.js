const express = require('express');
const app = express();
const port = 3000;

const router = require('./router'); // Require the renamed router.js

app.use('/', router);

app.listen(port, function() {
    console.log(`Server is listening on http://localhost:${port}`);
});
