(function checkAuth() {
    const session = localStorage.getItem('olympus_session') || sessionStorage.getItem('olympus_session');
    if (!session) {
        window.location.href = 'index.html';
    }
})();