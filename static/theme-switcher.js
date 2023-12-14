const themeToggler = document.getElementById('theme-toggler');
const currentTheme = localStorage.getItem('theme') || 'dark';

function setTheme(theme, delay = false) {
    if (theme === 'dark') {
        themeToggler.innerHTML = '💡';
        document.body.classList.remove('bg-body-secondary');
    } else {
        themeToggler.innerHTML = '🌙';
        document.body.classList.add('bg-body-secondary');
    }

    if (delay) {
        document.body.style.transition = 'background-color 0.15s ease-in-out';
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 500);
    }

    document.documentElement.setAttribute('data-bs-theme', theme);
}

setTheme(currentTheme);

themeToggler.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    setTheme(newTheme, true);
    localStorage.setItem('theme', newTheme);
});