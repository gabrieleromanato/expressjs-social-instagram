'use strict';

const mongoose  = require('mongoose');

const { Schema }  = mongoose;

const PostSchema = new Schema({
    description: String,
    image: String,
    user: String,
    date: Date

},{collection: 'posts'});

module.exports = mongoose.model('posts', PostSchema);