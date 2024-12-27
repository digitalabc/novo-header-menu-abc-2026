window.addEventListener("userChecked", enableReviewButton, true);
let reviewAlert = "";

/**
 * Sends a product review form.
*/
async function reviewSubmit(){
    const ratingElement = document.getElementById('review-form-rating');
    const textElement = document.getElementById('review-form-text');
    const productVariantIdElement = document.getElementById('product-variant-id');

    const input = {
        review: textElement.value,
        rating: Number(ratingElement.value),
        email: pageUser.email,
        name: pageUser.name,
        productVariantId: Number(productVariantIdElement.value)
    };

    await client.product.createReview(input);    
    showReviewAlert();
}

/**
 * Checks if there is a user logged in the page.
*/
function VerifyPageUser(){
    if (pageUser != null){
        document.getElementById("review-form-div").style.display = "";
        document.getElementById("review-login-div").style.display = "none";
    }
    else{
        const loginElement = document.getElementById("review-login-action-div");
        loginElement.href += window.location.href;
    }
}

/**
 * Hide alert content.
*/
function hideReviewAlert(){
    reviewAlert.innerHTML = "";
}

/**
 * Show alert content.
*/
function showReviewAlert(){
    reviewAlert.innerHTML = '<div class="alert alert-success col-6" role="alert" style="visibility: visible; position: relative; text-align: center; margin-bottom: auto; z-index: 1;">Review enviada com sucesso!</div>';
    setTimeout(hideReviewAlert, 2000);
}

/**
 * Enable review button.
*/
function enableReviewButton(){
    if(pageUser){
        document.getElementById("login-review").classList.add('hidden');
        document.getElementById("review-form").classList.remove('hidden');    
    }
}

