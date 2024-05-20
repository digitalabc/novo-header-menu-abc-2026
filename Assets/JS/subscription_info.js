window.addEventListener("load", subscriptionInfoLoad, false);

async function subscriptionInfoLoad(){
    await subscriptionInfo();
}

async function subscriptionInfo() {
    //let user = await client.user.get();
    let user = {customerAccessToken: 'MHG6l60z6S1xteFdjRDjWB9eBCfDdZSCjJmMT8alvmDHR8FFLj2rnHypERPwRWj9PB7dXqW9RggUCXcvTLGbDYsy27+LL7Esjg3Fap869QR0nd0kYSGMZpQp8MSlX6bB2gmy4B95r7lYjMSgvH+VdmGlDhrisogdAuwE03j9tQem1MAnxWA3hPa/jFlaNgAY'};
    if (!user) return;   
    
    let response = await client.snippet.render(
        "subscription_info_snippet.html",
        "SnippetQueries/subscription_info.graphql",
        { customerAccessToken: user.customerAccessToken }
    );
    response = JSON.parse(response);
    let descontoPrime = document.querySelectorAll('.spot-price .desconto_prime');
    
    if (response.status && descontoPrime) {
        document.querySelector('header').classList.add('has_prime');
        document.querySelectorAll('.is_prime').forEach((link) => {
            link.classList.add('showprime');
        });
        document.querySelector('.prime_bar').style.display = 'flex';
        document.querySelector('.user__content.authenticated i').style.display = 'block';
        descontoPrime.forEach((el) => {
            el.style.display = "flex";
        });
    }
  }  