<<<<<<< HEAD
window.addEventListener("load", checkUserLogin, false);

/**
 * Checks if the user is logged in and dispatches a custom event with user details.
 */
async function checkUserLogin() {
    try { await handleUserCheckDataLayerEvent(); } 
    catch (error) { console.log(error); }
=======
window.addEventListener("load", checkUserLogin, false);

/**
 * Checks if the user is logged in and dispatches a custom event with user details.
 */
async function checkUserLogin() {
    try { await handleUserCheckDataLayerEvent(); } 
    catch (error) { console.log(error); }
>>>>>>> 09fc545d847559d4760a25524aeb0cc981ca5006
}