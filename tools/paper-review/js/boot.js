if (location.protocol === 'file:') {
  const status = document.getElementById('status');
  status.hidden = false;
  status.classList.add('error');
  status.textContent = 'You opened a downloaded HTML file. Publish the app files to GitHub Pages, then open https://parsecneuro.github.io/tools/paper-review/. The published website does not need Python or a BAT file. See START-HERE.txt for upload instructions.';
} else {
  setTimeout(() => {
    if (window.paperReviewReady) return;
    const status = document.getElementById('status');
    status.hidden = false;
    status.classList.add('error');
    status.textContent = 'The app could not finish starting. Use a current desktop browser and make sure the entire paper-review folder was copied, including its vendor folder.';
  }, 15000);
}
