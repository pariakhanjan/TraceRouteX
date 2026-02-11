export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authorized',
            });
        }

        const validRoles = ['viewer', 'engineer', 'admin'];

        if (!validRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid role',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You don\'t have permission to use this action',
                requiredRole: allowedRoles,
                userRole: req.user.role
            });
        }

        next();
    };
};
