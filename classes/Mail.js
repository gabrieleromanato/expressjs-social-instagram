'use strict';

const nodemailer = require('nodemailer');

class Mail {
    constructor({ from, settings }) {
        this.settings = settings;
        this.options = {
            from: from,
            to: '',
            subject: '',
            text: '',
            html: ''

        };
    }

    send({to, subject, body}) {
        if(nodemailer && this.options) {
            let self = this;
            const transporter = nodemailer.createTransport(self.settings);

            self.options.to = to;
            self.options.subject = subject;
            self.options.text = body;

            if(transporter !== null) {
                return new Promise((resolve, reject) => {
                    transporter.sendMail(self.options, (error, info) => {
                        if(error) {
                            reject(Error('Failed'));
                        } else {
                            resolve('OK');
                        }
                    });
                });
            }
        }
    }
}

module.exports = Mail;