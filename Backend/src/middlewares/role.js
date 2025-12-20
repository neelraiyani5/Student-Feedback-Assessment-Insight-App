const role = (...allowedRoles) => {
    return (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)){
            return req.status(403).json({message: "Access denied!!!"})
        }
        next();
    }
}

export default role;