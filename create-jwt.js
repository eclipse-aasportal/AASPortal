import jwt from 'jsonwebtoken';

const token = jwt.sign(
    {
        id: 'john.doe@email.com',
        name: 'John Doe',
        role: 'editor',
    },
    'The quick brown fox jumps over the lazy dog.',
);

// eslint-disable-next-line no-undef
console.log(token);
