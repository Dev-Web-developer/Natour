import axios from 'axios';
import { showAlert } from './alerts';

export const signUp = async (name, email, password, passwordConfirm) => {
  //this to work i actully paste cors and helmet config in app.js app.use for helmet and corse paste that as well
  try {
    document.querySelector('.submit-a').textContent = 'Hold on....';
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name: name,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
      },
    });

    if (res.data.status === 'sucess' || res.data.status === 'success') {
      showAlert('success', 'Signed in successfully!');
      window.setTimeout(() => {
        location.assign('/me');
      }, 1000);
    }
    document.querySelector('.submit-a').textContent = 'Signed UP';
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
