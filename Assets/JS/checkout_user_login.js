window.addEventListener("load", checkUserLogin, false);

/**
 * Checks if the user is logged in and dispatches a custom event with user details.
 */
async function checkUserLogin() {
    try { await handleUserCheckDataLayerEvent(); } 
    catch (error) { console.log(error); }
}