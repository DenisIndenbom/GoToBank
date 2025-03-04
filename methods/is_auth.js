/**
 * Middleware for authentication.
 * If the user is authenticated (checked using session.user_id in req.session), it calls the next middleware.
 * If the user is not authenticated, and a url is provided, it redirects to the provided url, else sends a status code 401.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function in the middleware chain.
 * @param {String} url - The optional URL to redirect to if the user is not authenticated.
 * @returns {Void} - This function does not return a value directly.
 */
async function auth(req, res, next, url = '') {
	if (req.session && req.session.user_id) return next();

	return url ? res.redirect(url) : res.sendStatus(401);
}

/**
 * Middleware for non-authenticated users.
 * If the user is not authenticated (checked using session.user_id in req.session), it calls the next middleware.
 * If the user is authenticated, it redirects to the '/' route.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function in the middleware chain.
 * @returns {Void} - This function does not return a value directly.
 */
async function not_auth(req, res, next) {
	if (!(req.session && req.session.user_id)) return next();

	return res.redirect('/');
}

module.exports = {
	auth: auth,
	not_auth: not_auth,
};
