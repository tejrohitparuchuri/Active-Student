/**
 * Active Student Portal - Login & Registration Form Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- LOGIN FORM ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const errorMsg = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.classList.add('hidden');

      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;
      const btn = loginForm.querySelector('button');

      if (!email.endsWith('@anurag.edu.in')) {
        errorMsg.innerText = "❌ Login Declined: Only @anurag.edu.in emails are accepted. Any other institute emails or gmail.com will be declined.";
        errorMsg.classList.remove('hidden');
        return;
      }

      try {
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-black mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;

        const data = await API.login(email, password);
        window.location.href = data.redirectUrl || 'index.html';
      } catch (error) {
        console.error(error);
        errorMsg.innerText = error.message || "Invalid email or password.";
        errorMsg.classList.remove('hidden');
        btn.innerText = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  // --- REGISTER FORM ---
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const errorMsg = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.classList.add('hidden');

      const fullName = document.getElementById('fullName').value.trim();
      const rollNo = document.getElementById('rollNo').value.trim();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const btn = registerForm.querySelector('button');

      if (!email.endsWith('@anurag.edu.in')) {
        errorMsg.innerText = "❌ Signup Declined: Only @anurag.edu.in emails are accepted. Any other institute emails or gmail.com will be declined.";
        errorMsg.classList.remove('hidden');
        return;
      }

      if (password !== confirmPassword) {
        errorMsg.innerText = "Passwords do not match!";
        errorMsg.classList.remove('hidden');
        return;
      }

      try {
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-black mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;

        const data = await API.register({ fullName, rollNo, email, password, confirmPassword });
        window.location.href = data.redirectUrl || 'index.html';
      } catch (error) {
        console.error(error);
        errorMsg.innerText = error.message || "Registration failed. Try again.";
        errorMsg.classList.remove('hidden');
        btn.innerText = 'Create Account';
        btn.disabled = false;
      }
    });
  }
});

