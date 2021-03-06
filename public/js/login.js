import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  //this to work i actully paste cors and helmet config in app.js app.use for helmet and corse paste that as well
  try {
    const res = await axios({
      method: 'POST',
      // url: 'http://127.0.0.1:8000/api/v1/users/login',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    showAlert('error', 'Error in logging out! Try again');
  }
};
