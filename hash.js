import crypto from 'crypto';


function hash(string, salt) {
    console.log("Salted password: " + string + salt)
    let hash = crypto.createHash('sha1');
    hash = hash.update(string + salt).digest('hex').toUpperCase();
    console.log("Our Hash: " + hash);
    return hash;
}

const known_hash = "3E69813453094B017E9F523427397588B53BC6FF"
console.log("Known Hash: " + known_hash);

if (hash('abcdef123', 'gZRs/9g=') === known_hash) {
    console.log('Hashes match');
} else {
    console.log('Hashes do not match');
}
