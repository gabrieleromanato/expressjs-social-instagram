'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const validator = require('validator');
const users = require('../models/users');
const posts = require('../models/posts');
const crypto = require('crypto');
const Mail = require('../classes/Mail');
const { from, settings } = require('../config').mail;
const UPLOAD_PATH = path.dirname(process.mainModule.filename) + '/public/images/';
const Upload = require('../classes/Upload');

router.use((req, res, next) => {
    const { user } = req.session;
    req.app.locals.isLoggedIn = ( user );
    req.app.locals.user = user;
    next();
});

router.get('/', async (req, res, next) => {
    try {
        const latestPosts = await posts.find().sort({ date: -1 }).limit(3);
        const homePosts = [];

        for(let i = 0; i < latestPosts.length; i++) {
            let post = latestPosts[i];
            let singlePost = {};

            singlePost.image = post.image;
            singlePost.description = post.description;
            singlePost.user = await users.findOne({ username: post.user });

            homePosts.push(singlePost);
        }

        res.render('index', { 
            title: 'Express Instagram',
            posts: homePosts 
        });

    } catch(err) {
        res.sendStatus(500);
    }
    
});

router.get('/register', (req, res, next) => {
    res.render('register', { title: 'Register | Express Instagram' });
});

router.get('/login', (req, res, next) => {
    res.render('login', { title: 'Login | Express Instagram' });
});

router.get('/logout', (req, res, next) => {
    if(req.session.user) {
        delete req.session.user;
    }
    res.redirect('/login');    
});

router.get('/posts/create', (req, res, next) => {
    if(req.session.user) {
        res.render('create', { title: 'New Post | Express Instagram' });
    } else {
        res.redirect('/login');
    }    
});

router.get('/posts/:id', async (req, res, next) => {
    try {
        const post = await posts.findById(req.params.id);
        const user = await users.findOne({ username: post.user });
        res.render('post', { 
            title: `${user.username} | Express Instagram`,
            post: post,
            postUser: user
        });
    } catch(err) {
        res.sendStatus(500);
    }
});

router.get('/profile/:username', async (req, res, next) => {
    const { username } = req.params;
    try {
        const user = await users.findOne({ username: username });
        if(user) {
            const userPosts = await posts.find({ _id: { $in: user.posts } } ).sort({ date: -1 });
            res.render('profile',{
                title: `${username} | Express Instagram`,
                currentUser: user,
                posts: userPosts
            });
        } else {
            res.sendStatus(404);
        }
    } catch(err) {
        res.sendStatus(500); 
    }
});

router.get('/profile/:username/edit', async (req, res, next) => {
    if(req.session.user) {
    const { username } = req.params;
    try {
        const user = await users.findOne({ username: username });
        if(user) {
            res.render('edit',{
                title: `${username} | Express Instagram`,
                currentUser: user
            });
        } else {
            res.sendStatus(404);
        }
    } catch(err) {
        res.sendStatus(500); 
    }
    } else {
        res.redirect('/login'); 
    }
});

router.post('/follow', async (req, res, next) => {
    const { follower, following, action } = req.body;
    try {
        switch(action) {
            case 'follow':
                await Promise.all([ 
                    users.findByIdAndUpdate(follower, { $push: { following: following }}),
                    users.findByIdAndUpdate(following, { $push: { followers: follower }})
                
                ]);
            break;

            case 'unfollow':
                await Promise.all([ 
                    users.findByIdAndUpdate(follower, { $pull: { following: following }}),
                    users.findByIdAndUpdate(following, { $pull: { followers: follower }})
                
                ]); 
            break;

            default:
                break;
        }

        res.json({ done: true });
        
    } catch(err) {
        res.json({ done: false });
    }
});

router.post('/profile/:username/edit', async (req, res, next) => {
    if(req.session.user) {
        const { username } = req.params;
        try {
            const upload = new Upload({ 
                filename: 'image', 
                destination: UPLOAD_PATH + 'profiles', 
                newName: crypto.createHash('sha256').update(Date.now().toString()).digest('hex') 
            });

            const uploaded = await upload.save(req, res);

            if(uploaded.done) {
                const { url, description } = uploaded.body;
                const {  file } = uploaded;
                const data = {
                    url,
                    description,
                    image: file.filename
                };
                await users.findOneAndUpdate({ username: username }, { $set: data });

                res.json({ updated: true, username });
            } else {
                res.json({ updated: false });
            }    
        } catch(err) {
            res.json(err); 
        }
    } else {
        res.sendStatus(403); 
    }
});

router.post('/posts/create', async (req, res, next) => {
    if(req.session.user) {
        try {
            const upload = new Upload({ 
                filename: 'image', 
                destination: UPLOAD_PATH + 'posts', 
                newName: crypto.createHash('sha256').update(Date.now().toString()).digest('hex') 
            });

            const uploaded = await upload.save(req, res);

            if(uploaded.done) {
                const { description } = uploaded.body;
                const {  file } = uploaded;
                const errors = [];

                if(validator.isEmpty(description)) {
                    errors.push({
                        param: 'description',
                        msg: 'Description is a required field.'
                    });
                }

                if(errors.length > 0) {
                    fs.unlinkSync(file.path);
                    res.json({ errors });
                } else {
                    const newPost = new posts({
                        description,
                        image: file.filename,
                        user: req.session.user.username,
                        date: new Date()
                    });

                    newPost.save().then(post => {
                        users.findOneAndUpdate({ _id: req.session.user._id}, { $push: { posts: post._id } }).then(result => {
                            res.json({ created: true, postid: post._id });
                        });
                    });
                }
            } else {
                res.json({ created: false });
            }
        } catch(err) {
            res.json(err);
        }
    } else {
        res.sendStatus(403);
    }    
});

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    const encPwd = crypto.createHash('sha256').update(password).digest('hex');

    try {
        const user = await users.findOne({ email: email, password: encPwd });
        if(user) {
            req.session.user = user;
            res.json({ success: true, username: user.username });
        } else {
            res.json({ success: false }); 
        }
    } catch(err) {
        res.json({ success: false });
    }
});

router.post('/register', async (req, res, next) => {
    const { name, email, username, password, password_confirmation } = req.body;
    const errors = [];

    if(validator.isEmpty(name)) {
        errors.push({
            param: 'name',
            msg: 'Name is a required field.'
        });
    }

    if(!validator.isEmail(email)) {
        errors.push({
            param: 'email',
            msg: 'Invalid e-mail address.'
        });
    }

    if(!validator.isAlphanumeric(username)) {
        errors.push({
            param: 'username',
            msg: 'Invalid username.'
        });
    }

    if(validator.isEmpty(password)) {
        errors.push({
            param: 'password',
            msg: 'Password is a required field.'
        });
    }

    if(password !== password_confirmation) {
        errors.push({
            param: 'password_confirmation',
            msg: 'Passwords do not match.'
        });
    }

    try {
        const usernameExists = await users.countDocuments({ username: username });
        const emailExists = await users.countDocuments({ email: email });

        if(usernameExists === 1) {
            errors.push({
                param: 'username',
                msg: 'Invalid username.'
            });
        }

        if(emailExists === 1) {
            errors.push({
                param: 'email',
                msg: 'Invalid e-mail address.'
            }); 
        }

    } catch(err) {
        res.json({ error: err });
    }

    if(errors.length > 0) {
        res.json({ errors });
    } else {
        const encPwd = crypto.createHash('sha256').update(password).digest('hex');

        const newUser = new users({
            name,
            email,
            username,
            password: encPwd

        });

        const mailer = new Mail({
            from,
            settings
        });

        try {
            await newUser.save();
            await mailer.send({ to: email, subject: 'Welcome to Express Instagram', body: `Welcome ${username}!` });
        } catch(err) {
            res.json({ error: err }); 
        }
        
        

        res.json({ success: true });
    }
});

module.exports = router;