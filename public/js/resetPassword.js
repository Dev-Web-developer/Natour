import axios from 'axios';
import { showAlert } from './alerts';

export const resetPassword = async (password, passwordConfirm, token) => {
  try {
    document.querySelector('.submit-d').textContent = 'Updating...';
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/resetPassword/:token',
      data: {
        password: password,
        passwordConfirm: passwordConfirm,
        token: token,
      },
    });
    document.querySelector('.submit-d').textContent = 'Updated!';

    if (res.data.status === 'sucess' || res.data.status === 'success') {
      showAlert('success', 'Password Updated!');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
