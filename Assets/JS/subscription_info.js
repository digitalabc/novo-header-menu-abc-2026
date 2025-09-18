window.addEventListener("load", subscriptionInfoLoad, false);

async function subscriptionInfoLoad(){
    await subscriptionInfo();
}

async function subscriptionInfo() {
    const user = await client.customer.get();
    if (!user) return;   
    const token = client.cookie.get("sf_customer_access_token");
    
    let response = await client.snippet.render(
        "subscription_info_snippet.html",
        "SnippetQueries/subscription_info.graphql",
        { customerAccessToken: token }
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