'use strict';


const request = require('request');
const image2base64 = require('image-to-base64');

const fs = require('fs');

const Config = {
    cacheDirectory: './cache/',
    userIdPrefixName: 'userId',
    apiURL: 'https://reqres.in/api/users/',
    imageTemplatePrefixName: '{userId}.png'
};

module.exports = async function (fastify, opts) {

    const requestFromApi = (userId, handler) => {
        return request(`${Config.apiURL}${userId}`, handler);
    };

    fastify.get(`/:${Config.userIdPrefixName}`, async (req, reply) => {

        return requestFromApi(req.params[Config.userIdPrefixName], async (error, response, body) => {
            if (error) {
                console.log(error);
            } else {
                return body;
            }
        });

    });

    fastify.get(`/:${Config.userIdPrefixName}/avatar`, async (req, reply) => {
        var ImageData, promise1, promise2, bodyJSON;

        var wanted = Config.imageTemplatePrefixName.replace(`{${Config.userIdPrefixName}}`, req.params[Config.userIdPrefixName]);

        if (fs.existsSync(`${Config.cacheDirectory}${wanted}`))           
            return fs.readFileSync(`${Config.cacheDirectory}${wanted}`, {encoding: 'utf-8'});

        promise1 = new Promise(function(resolve, reject) {
            requestFromApi(req.params[Config.userIdPrefixName], async (error, response, body) => {
                resolve(JSON.parse(body));
            });
        });

        await promise1.then(function(value) {
          bodyJSON = value;
        });

        promise2 = new Promise(function(resolve, reject) {
            image2base64(bodyJSON.data.avatar)
            .then(
                (response) => { 
                    fs.writeFileSync(`${Config.cacheDirectory}${wanted}`, response, (error) => {
                        if (error) {
                            console.log(error);
                        }
                    });
                    resolve(response);
                }
            )
            .catch(
                (error) => {
                    console.log(error);
                    resolve(response);
                }
            );
        });

        await promise2.then(function(value) {
          ImageData = value;
        });

        return ImageData;
        
    });

    fastify.delete(`/:${Config.userIdPrefixName}/avatar`, async (req, reply) => {
        var response;
        const wanted = Config.imageTemplatePrefixName.replace(`{${Config.userIdPrefixName}}`, req.params[Config.userIdPrefixName]);
        var promise1 = new Promise(function(resolve, reject) {
            fs.unlink(`${Config.cacheDirectory}${wanted}`, (err) => {
                if (err) {
                    resolve({status:404,message: "file not found"});
                } else {
                    resolve({status:200, message: "file is successfully removed"});
                }
            });
        });
        await promise1.then(function(value) {
          response = value;
        });
        return response;
    });


};

module.exports.autoPrefix = '/user';