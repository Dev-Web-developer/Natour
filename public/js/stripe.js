import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51J06FqSIpaThAzVyKRST5aSGtu5yoM7830safLmYA1uFqP8Wy2L8fmOPNhf5zkpz2kuftwlfnve81aW2RgIgzkRr00QAcKEnyx'
);

export const bookTour = async (tourId) => {
  try {
    //1)Get checkout session from endpoint
    const session = await axios(
      `/api/v1/booking/checkout-session/${tourId}`
    );

    //2)create checkout form + charge credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
