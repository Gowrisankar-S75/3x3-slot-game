const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, "client")));
app.get('/test', (req, res) => res.send('test'));
app.listen(3001, () => console.log('started'));
