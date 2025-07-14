const toast = document.querySelector(".toast");
const closeIcon = document.querySelector(".toast .close");
const progress = document.querySelector(".toast .progress");

let timer1, timer2;

const toastMSG = () => {
    toast.classList.add("active");
    progress.classList.add("active");

    timer1 = setTimeout(() => {
        toast.classList.remove("active");
    }, 5000);

    timer2 = setTimeout(() => {
        progress.classList.remove("active");
    }, 5300);
};

closeIcon.addEventListener("click", () => {
    toast.classList.remove("active");

    setTimeout(() => {
        progress.classList.remove("active");
    }, 300);

    clearTimeout(timer1);
    clearTimeout(timer2);
});


const copyCupom = (e) => {
    copyCupomText(e.target.parentElement.querySelector('.cupom-name').innerText);
}

async function copyCupomText(text) {
    if (!navigator.clipboard) {
        legacyCupomText(text);
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        toastMSG();
    } catch (err) {
        console.error('Failed erro ao copiar: ', err);
    }
}

function legacyCupomText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        toastMSG();
    } catch (err) {
        console.error('Legacy: erro ao copiar', err);
    }

    document.body.removeChild(textArea);
}    