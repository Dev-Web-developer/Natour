import axios from 'axios';
import { showAlert } from './alerts';

//type can be password or data
//and data can be password or email and name
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });
    if (res.data.status === 'success' || res.data.status === 'sucess') {
      showAlert('success', `${type.toUpperCase()} updated seccessfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
