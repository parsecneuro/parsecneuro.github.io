if (location.protocol === 'file:') {
  const status = document.getElementById('status');
  status.hidden = false;
  status.classList.add('error');
  status.textContent = 'To use this app locally, run start_local.bat (Windows) or python3 start_local.py from the paper-review folder. Then open the local address shown. See START-HERE.txt.';
} else {
  setTimeout(() => {
    if (window.paperReviewReady) return;
    const status = document.getElementById('status');
    status.hidden = false;
    status.classList.add('error');
    status.textContent = 'The app could not finish starting. Use a current desktop browser and make sure the entire paper-review folder was copied, including its vendor folder.';
  }, 15000);
}
