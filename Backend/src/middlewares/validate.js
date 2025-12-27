import { validationResult } from "express-validator";

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array().map(err => {
                return {
                    message: err.msg
                }

            })
        });
    }
    next();

}
export default validate;