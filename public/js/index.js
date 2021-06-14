import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { signUp } from './signUp';
import { loginStyle } from './loginStyle';
import { resetLink } from './resetLink';
import { resetPassword } from './resetPassword';
import { bookTour } from './stripe';

//Dom elements
loginStyle();
const mapBox = document.getElementById('map');
const resetLinkForm = document.getElementById('c-form');
const resetPasswordForm = document.getElementById('d-form');
const loginForm = document.querySelector('.form--login');
const signUpForm = document.querySelector('.form--signUp');
const submitForm_b = document.querySelector('.submit-b');
const submitForm_a = document.querySelector('.submit-a');
const resetBtn = document.querySelector('.submit-c');
const resetPassBtn = document.querySelector('.submit-d');
const userFormData = document.querySelector('.form-user-data');
const userFormPassword = document.querySelector('.form-user-settings');
const logOutBtn = document.querySelector('.nav__el--logout');
const bookbtn = document.querySelector('#book-tour');

//values

//Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  submitForm_b.addEventListener('click', (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    e.preventDefault();
    login(email, password);
  });
}
if (signUpForm) {
  submitForm_a.addEventListener('click', (e) => {
    const name = document.getElementById('name_new').value;
    const email = document.getElementById('email_new').value;
    const password = document.getElementById('password_new').value;
    const passwordConfirm = document.getElementById(
      'passwordConfirm_new'
    ).value;
    e.preventDefault();

    signUp(name, email, password, passwordConfirm);
  });
}

if (userFormData) {
  userFormData.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({ name, email }, 'data');
    updateSettings(form, 'data');
  });
}
if (userFormPassword) {
  userFormPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating....';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      {
        passwordCurrent: currentPassword,
        password,
        passwordConfirm: passwordConfirm,
      },
      'password'
    );
    document.querySelector('.btn--save--password').textContent =
      'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (resetLinkForm) {
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const email = document.getElementById('email_new').value;
    resetLink(email);
  });
}
if (resetPasswordForm) {
  resetPassBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const password = document.getElementById('new-password').value;
    const passwordConfirm = document.getElementById(
      'new-password-confirm'
    ).value;
    const token = document.getElementById('token').value;
    resetPassword(password, passwordConfirm, token);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (bookbtn)
  bookbtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing....';
    //tour-id will convert in js as tourId automatically and we get tour id that is on data attribute on html page...
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
