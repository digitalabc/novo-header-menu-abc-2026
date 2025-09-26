window.addEventListener("load", checkUserLogin, false);

async function checkUserLogin() {
  try {
    const user = await client.customer.get();

    window.dispatchEvent(
      new CustomEvent("userChecked", { email: user ? user.data.email : false })
    );
  } catch (error) {
    console.error(error);
  }
}
