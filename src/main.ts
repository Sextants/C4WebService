
import C4WebService from './C4WebService';
import Express = require('express');
import Redis from "ioredis";
import { RedisStore } from 'c4jwt';
import { ACLRedisCache, ACLDemoCommunicator } from 'c4accesscontrol';
// import Hello from './Controllers/Hello'

var Service : C4WebService;
// var Service2 : C4WebService;
var RedisClient : Redis.Redis | null = null;

function SetRouters(app : Express.Express) {
    app.get('/hello', (req, res) => {
        res.json({
            code : 600,
            msg  : "Succeed",
            data : {
                Text : "Hello world!"
            }
        });
    });
}

 async function Test() {
     RedisClient = new Redis(
         6379,
         "0.0.0.0",
         {
             family         : 4,
             connectionName : "TestJWT",
             db : 2
         }
     );

     await new Promise((resolve, reject) => {
        (<Redis.Redis>RedisClient).on('ready', () => {
            resolve();
        });

        (<Redis.Redis>RedisClient).on('error', (err) => {
            reject(err);
        });
    }).catch((err) => {
        console.log(err);
        RedisClient = null;
    })

    if (null === RedisClient) {
        process.exit(-1);
    }

    let CurRedisStore = new RedisStore();
    await CurRedisStore.init({
        client : RedisClient,
        prefix : "jwt_",
        clockTolerance : 30
    });

    let RedisCache = new ACLRedisCache(RedisClient);
    await RedisCache.init();

    let DemoCommunicator = new ACLDemoCommunicator();

    Service = new C4WebService();
    // Service2 = new C4WebService();
    await Service.init({
        name : "TestService",
        host : "localhost",
        port : 9001,
        domain : "localhost",
        serviceType : "http",
        staticPath : "./public",
        uploadPath : "./upload",
        compression : {},
        maxBodySize : "200kb",
        jwtOption : {
            authField : "Token",
            keys : [
                "123",
                "456"
            ],
            algorithm : "HS256",
            expiresIn : "2h",
            issuer : "issuer",
            subject : "Test",
            clockTolerance : 30,
            store : CurRedisStore,
            payloadAlgorithm : "aes-256-cbc",
            payloadKeys : {
                "0" : {
                    key : "01234567890123456789012345678901",
                    iv : "0123456789012345"
                },
                "1" : {
                    key : "12345678901234567890123456789012",
                    iv : "1234567890123456"
                }
            }
        },
        // aclOption : {
        //     disable : false,
        //     serToken : "Token ZXlKcmFXUWlPaUl3SWl3aWRIbHdJam9pU2xkVUlpd2lZV3huSWpvaVNGTXlOVFlpZlEuZXlKcFlYUWlPakUxTWpnek5UYzRNak1zSW5OMVlpSTZJbXh2WjJsdUlpd2lhWE56SWpvaWQyVmtjeUlzSW5Ca1lYUmhJam9pY0VsRlJsaDJSVzFsVlVSMGRrWm1SbGh1TDNsTE1saFhNR2RrWkRSM04yMTBWRmt3ZEc1YWRrMVRPRTlwZFZSMFFsbE5iRGw1V0ZKVk5VTTVVRm94ZVNJc0luQnJaWGxwWkNJNklqRWlMQ0pxZEdraU9pSm1OalUwWldFeFlpMWxZMlpqTFRSbE1qQXRPVEJpWmkxaFlqbGlNbUk1Wm1GbU5qZ2lmUS5KM0ktNkdkYXhFS2t4QnZCOWd5OTY3alhRX2RJLTlnWXJjR2JaWWlQTV9v",
        //     aclCache : RedisCache,
        //     aclCommunicator : DemoCommunicator
        // }
        // aclOption : {}
        // Session : {
        //     secret : '123',
        //     resave : false,
        //     saveUninitialized : false
        // }
    }).catch((err) => {
        console.log(err.toString());
    });

    // await Service2.init({
    //     name : "TestService",
    //     host : "localhost",
    //     port : 9002,
    //     domain : "localhost",
    //     serviceType : "http",
    //     staticPath : "./public",
    //     uploadPath : "./upload",
    //     compression : {},
    //     maxBodySize : "200kb"
    // }).catch((err) => {
    //     console.log(err.toString())
    // })

    SetRouters(Service.getApp());
    await Service.addControllers(['Hello.js', 'StaticRes.js', 'TryACL.js']);
    // await Service.addControllers([ {dir : 'Hello'}]);
    // await Service2.addControllers(['Hello']);
    await Service.launch().catch((err) => {
        console.log(err);
    });
    // await Service2.launch().catch((err) => {
    //     console.log(err);
    // });
}

Test().catch((err) => {
    console.log(err);
});
