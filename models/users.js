'use strict';

const mongoose  = require('mongoose');

const { Schema }  = mongoose;

const UserSchema = new Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    url: { type: String, default: '' },
    image: { type: String, default: 'default.png' },
    description: { type: String, default: '' },
    posts: Array,
    followers: Array,
    following: Array

},{collection: 'users'});

module.exports = mongoose.model('users', UserSchema);