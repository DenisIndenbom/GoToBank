const prisma = require('../lib/prisma')

/**
* Middleware that checks if the user is an admin. If so it passes the request to the next middleware in the chain
* 
* @param req - The request object from express server
* @param res - The response object from express server ( not used in this middleware )
* @param next - The next middleware in the chain ( not used in this middleware )
* 
* @return { Promise } Resolves to the next middleware in the chain or rejects with an error message if the user is not
*/
async function is_admin(req, res, next) {
    const admin = await prisma.admin.findFirst({
        where: {
            user_id: req.session.user_id
        }
    })

    // Returns the next page of results.
    if (admin) return next()

    return res.redirect('/404')
}

/**
* Get the level of a admin.
* 
* @param user_id - The id of the user.
* 
* @return { Promise } The level of the user.
*/
async function get_level(user_id) {
    const admin = await prisma.admin.findFirst({
        where: {
            user_id: user_id
        }
    })

    return admin.level
}

/**
* Checks if a addmin has access to a action.
* 
* @param user_id - The id of the user to check.
* @param level - The level to check against. 
* 
* @return { Promise } True if the user has access to the page false otherwise. Note that the promise will resolve to false if the user doesn't have access
*/
async function access(user_id, level) {
    const admin = await prisma.admin.findFirst({
        where: {
            user_id: user_id
        }
    })

    return admin.level >= level
}

/**
* Add administrator to system.
* 
* @param user_id - The ID of the new administrator user.
* @param level - The level of administrative rights.
*
* @returns { Promise } true if successful else false
*/
async function add_admin(user_id, level) {
    try {
        await prisma.admin.create({
            data: {
                user_id: user_id,
                level: level
            }
        })
    }
    catch (e) {
        return false
    }

    return true
}

/**
* Delete administrator from system
* 
* @param user_id - The id of the administrator user 
*/
async function delete_admin(user_id) {
    await prisma.admin.deleteMany({
        where: {
            user_id: user_id
        }
    })
}

module.exports = {
    is_admin: is_admin,
    get_level: get_level,
    access: access,
    add_admin: add_admin,
    delete_admin: delete_admin
}