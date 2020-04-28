'use strict';

const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const config = require('./config');
const { name, keys } = config.session;
const { url } = config.mongodb;
const routes = require('./routes');

mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true });

app.disable('x-powered-by');
app.set('view engine', 'ejs');


app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
    name: name,
    keys: keys
}));
app.use('/', routes);



app.listen(port);