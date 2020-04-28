'use strict';

module.exports = {
    fileSize: 1000000,
    mongodb: {
        url: 'mongodb://localhost:27017/db'
    },
    session: {
        name: '',
        keys: ['', '']
    },
    mail: {
      from: 'noreply@express.localhost',  
      settings: {  
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: {
              user: '',
              pass: ''
            }
      }      
    }
};