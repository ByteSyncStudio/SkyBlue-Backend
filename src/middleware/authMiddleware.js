import jsonwebtoken from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jsonwebtoken.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

export const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) return res.sendStatus(401);

        const hasRole = req.user.roles.some(role => roles.includes(role));
        
        if (hasRole) {
            next();
        } else {
            res.sendStatus(403);
        }
    };
};