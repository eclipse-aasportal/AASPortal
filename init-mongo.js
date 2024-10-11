db.createUser({
    user: 'aasportal@iosb-ina.fraunhofer.de',
    pwd: 'aas-portal',
    roles: [
        {
            role: 'readWrite',
            db: 'aasportal-users',
        },
    ],
});
