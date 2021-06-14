import axios from 'axios';
import { showAlert } from './alerts';

export const resetLink = async (email) => {
  try {
    document.querySelector('.submit-c').textContent = 'Sending...';

    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email: email,
      },
    });

    document.querySelector('.submit-c').textContent = 'Sent!';
    if (res.data.status === 'sucess' || res.data.status === 'success') {
      showAlert('success', 'Token Sent to your mail!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
